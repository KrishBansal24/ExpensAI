/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  DEFAULT_FRAUD_SETTINGS,
  FRAUD_DECISIONS,
  decisionFromStatus,
  mergeFraudSettings,
  statusFromDecision,
} from '../services/fraudConfig';

const AdminDataContext = createContext();

const BUDGET_CATEGORY_KEYS = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Other'];

const sanitizeBudgetCategories = (categories = {}) => {
  return BUDGET_CATEGORY_KEYS.reduce((acc, key) => {
    const raw = Number(categories?.[key] ?? 0);
    acc[key] = Number.isFinite(raw) ? Math.max(raw, 0) : 0;
    return acc;
  }, {});
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortByLatest = (items, key) => {
  return [...items].sort((left, right) => {
    const leftTime = toDate(left?.[key])?.getTime() ?? 0;
    const rightTime = toDate(right?.[key])?.getTime() ?? 0;
    return rightTime - leftTime;
  });
};

export function AdminDataProvider({ children }) {
  const { user, hasAdminAccess } = useAuth();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fraudSettings, setFraudSettings] = useState(DEFAULT_FRAUD_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [fraudSettingsLoading, setFraudSettingsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !hasAdminAccess) {
      setUsers([]);
      setTransactions([]);
      setLoading(false);
      setFraudSettings(mergeFraudSettings(DEFAULT_FRAUD_SETTINGS));
      setFraudSettingsLoading(false);
      return undefined;
    }

    setLoading(true);
    setFraudSettingsLoading(true);

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const rows = snapshot.docs.map((row) => ({ id: row.id, ...row.data() }));
        setUsers(sortByLatest(rows, 'updatedAt'));
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Could not load employees.');
      },
    );

    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        const rows = snapshot.docs.map((row) => ({ id: row.id, ...row.data() }));
        setTransactions(sortByLatest(rows, 'timestamp'));
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Could not load transactions.');
        setLoading(false);
      },
    );

    const fraudSettingsRef = doc(db, 'fraudSettings', 'global');
    const unsubFraudSettings = onSnapshot(
      fraudSettingsRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setFraudSettings(mergeFraudSettings(DEFAULT_FRAUD_SETTINGS, snapshot.data()));
          setFraudSettingsLoading(false);
          return;
        }

        const defaults = mergeFraudSettings(DEFAULT_FRAUD_SETTINGS);
        setFraudSettings(defaults);
        setFraudSettingsLoading(false);

        try {
          await setDoc(
            fraudSettingsRef,
            {
              ...defaults,
              updatedBy: user?.uid || null,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        } catch (settingsError) {
          console.warn('Could not seed default fraud settings:', settingsError);
        }
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Could not load fraud settings.');
        setFraudSettingsLoading(false);
      },
    );

    return () => {
      unsubUsers();
      unsubTransactions();
      unsubFraudSettings();
    };
  }, [user, hasAdminAccess]);

  const saveFraudSettings = useCallback(async (settingsUpdate) => {
    const normalizedSettings = mergeFraudSettings(
      DEFAULT_FRAUD_SETTINGS,
      fraudSettings,
      settingsUpdate || {},
    );

    await setDoc(
      doc(db, 'fraudSettings', 'global'),
      {
        ...normalizedSettings,
        updatedBy: user?.uid || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [fraudSettings, user?.uid]);

  const upsertEmployee = useCallback(async (employee) => {
    const employeeId = employee.uid || employee.id;
    if (!employeeId) throw new Error('Employee id is required');

    await setDoc(
      doc(db, 'users', employeeId),
      {
        uid: employeeId,
        name: employee.name || 'Employee',
        email: employee.email || '',
        role: employee.role || 'employee',
        department: employee.department || 'General',
        walletAssigned: Number(employee.walletAssigned || 0),
        walletBalance: Number(employee.walletBalance || employee.walletAssigned || 0),
        walletSpent: Number(employee.walletSpent || 0),
        active: employee.active ?? true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  const archiveEmployee = useCallback(async (employeeId) => {
    await setDoc(
      doc(db, 'users', employeeId),
      {
        active: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  const deleteEmployeeProfile = useCallback(async (employeeId) => {
    await deleteDoc(doc(db, 'users', employeeId));
  }, []);

  const setUserRole = useCallback(async ({ userId, role }) => {
    if (!['admin', 'employee', 'manager'].includes(role)) {
      throw new Error('Invalid role');
    }

    await setDoc(doc(db, 'users', userId), {
      role,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, []);

  const allocateWallet = useCallback(async ({ employeeId, amount, mode = 'set' }) => {
    const safeAmount = Number(amount);
    if (!Number.isFinite(safeAmount) || safeAmount < 0) {
      throw new Error('Budget amount must be zero or higher');
    }

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', employeeId);
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error('Employee profile not found');

      const userData = snap.data();
      const currentAssigned = Number(userData.walletAssigned || 0);
      const currentBalance = Number(userData.walletBalance || 0);
      const currentSpent = Number(userData.walletSpent || 0);

      const nextAssigned = mode === 'add' ? currentAssigned + safeAmount : safeAmount;
      const nextBalance = mode === 'add'
        ? currentBalance + safeAmount
        : Math.max(nextAssigned - currentSpent, 0);

      transaction.set(
        userRef,
        {
          walletAssigned: nextAssigned,
          walletBalance: nextBalance,
          period: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
  }, []);

  const saveEmployeeBudgetCategories = useCallback(async ({ employeeId, categories }) => {
    const normalizedCategories = sanitizeBudgetCategories(categories);
    const categoryTotal = Object.values(normalizedCategories).reduce((sum, value) => sum + Number(value || 0), 0);

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', employeeId);
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error('Employee profile not found');

      const userData = snap.data();
      const spent = Number(userData.walletSpent || 0);
      const walletAssigned = Number(categoryTotal.toFixed(2));
      const walletBalance = Math.max(walletAssigned - spent, 0);

      transaction.set(
        userRef,
        {
          budgetCategories: normalizedCategories,
          budgetCategoryTotal: walletAssigned,
          walletAssigned,
          walletBalance,
          period: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
  }, []);

  const updateTransactionStatus = useCallback(async ({ transactionId, status }) => {
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new Error('Unsupported status');
    }

    let previousStatus = null;
    let transactionData = null;

    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, 'transactions', transactionId);
      const txSnap = await transaction.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');

      const txData = txSnap.data();
      previousStatus = txData.status;
      transactionData = txData;
      if (previousStatus === status) return;

      const nextDecision = decisionFromStatus(status);

      transaction.set(
        txRef,
        {
          status,
          decision: nextDecision,
          autoDecision: false,
          decisionSource: 'manual',
          manualReviewRequired: status === 'pending',
          decisionReason: `Manually ${status} by admin review.`,
          verificationMode: txData.verificationMode || fraudSettings.verificationMode,
          overridden: false,
          overrideBaseDecision: null,
          overrideHistory: Array.isArray(txData.overrideHistory) ? txData.overrideHistory : [],
          reviewedAt: serverTimestamp(),
          reviewedBy: user?.uid || null,
        },
        { merge: true },
      );
    });

    if (status !== 'rejected' || previousStatus === 'rejected') {
      return;
    }

    const userId = transactionData?.userId;
    if (!userId) return;

    // Best-effort wallet rollback. Even if this fails, transaction rejection remains saved.
    try {
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const amount = Number(transactionData?.amount || 0);
        const nextBalance = Math.max(Number(userData.walletBalance || 0) - amount, 0);
        const nextSpent = Math.max(Number(userData.walletSpent || 0) - amount, 0);

        transaction.set(
          userRef,
          {
            walletBalance: nextBalance,
            walletSpent: nextSpent,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      });
    } catch (walletErr) {
      console.warn('Rejected transaction, but wallet rollback failed:', walletErr);
    }
  }, [fraudSettings.verificationMode, user?.uid]);

  const overrideTransactionDecision = useCallback(async ({ transactionId, decision, reason = '' }) => {
    if (!Object.values(FRAUD_DECISIONS).includes(decision)) {
      throw new Error('Unsupported override decision');
    }

    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, 'transactions', transactionId);
      const txSnap = await transaction.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');

      const txData = txSnap.data();
      const previousDecision = txData.decision || decisionFromStatus(txData.status);
      const overrideBaseDecision = txData.overrideBaseDecision || previousDecision;
      const overrideHistory = Array.isArray(txData.overrideHistory) ? txData.overrideHistory : [];

      const auditAction = decision === FRAUD_DECISIONS.APPROVED
        ? 'OVERRIDE_APPROVE'
        : decision === FRAUD_DECISIONS.REJECTED
          ? 'OVERRIDE_REJECT'
          : 'OVERRIDE_UNDECIDED';

      const auditEntry = {
        action: auditAction,
        previousDecision,
        newDecision: decision,
        adminId: user?.uid || null,
        timestamp: new Date().toISOString(),
        reason: reason || `Decision overridden to ${decision}.`,
      };

      transaction.set(
        txRef,
        {
          decision,
          status: statusFromDecision(decision),
          autoDecision: false,
          decisionSource: 'override',
          manualReviewRequired: decision === FRAUD_DECISIONS.UNDECIDED,
          decisionReason: reason || `Admin override to ${decision}.`,
          overridden: true,
          overrideBaseDecision,
          overrideHistory: [...overrideHistory, auditEntry],
          reviewedAt: serverTimestamp(),
          reviewedBy: user?.uid || null,
        },
        { merge: true },
      );
    });
  }, [user?.uid]);

  const revertTransactionDecision = useCallback(async ({ transactionId, reason = '' }) => {
    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, 'transactions', transactionId);
      const txSnap = await transaction.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');

      const txData = txSnap.data();
      const currentDecision = txData.decision || decisionFromStatus(txData.status);
      const baseDecision = txData.overrideBaseDecision || currentDecision;
      const overrideHistory = Array.isArray(txData.overrideHistory) ? txData.overrideHistory : [];

      if (!txData.overridden || currentDecision === baseDecision) {
        throw new Error('No active override to revert.');
      }

      const auditEntry = {
        action: 'OVERRIDE_REVERT',
        previousDecision: currentDecision,
        newDecision: baseDecision,
        adminId: user?.uid || null,
        timestamp: new Date().toISOString(),
        reason: reason || `Override reverted back to ${baseDecision}.`,
      };

      transaction.set(
        txRef,
        {
          decision: baseDecision,
          status: statusFromDecision(baseDecision),
          autoDecision: false,
          decisionSource: 'manual',
          manualReviewRequired: baseDecision === FRAUD_DECISIONS.UNDECIDED,
          decisionReason: reason || `Override reverted to ${baseDecision}.`,
          overridden: false,
          overrideBaseDecision: null,
          overrideHistory: [...overrideHistory, auditEntry],
          reviewedAt: serverTimestamp(),
          reviewedBy: user?.uid || null,
        },
        { merge: true },
      );
    });
  }, [user?.uid]);

  // ── Mark as Fraud ─────────────────────────────────
  // Admin action to flag a transaction as fraudulent.
  // Sets fraudStatus to 'fraud' and rejects the transaction.
  const markAsFraud = useCallback(async (transactionId) => {
    const txRef = doc(db, 'transactions', transactionId);
    await setDoc(
      txRef,
      {
        decision: FRAUD_DECISIONS.REJECTED,
        fraudStatus: 'fraud',
        status: 'rejected',
        decisionSource: 'manual',
        manualReviewRequired: false,
        overridden: false,
        decisionReason: 'Manually flagged as fraud by admin.',
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || null,
      },
      { merge: true },
    );
  }, [user?.uid]);

  const totals = useMemo(() => {
    const scopedUsers = hasAdminAccess ? users : [];
    const scopedTransactions = hasAdminAccess ? transactions : [];
    const employeeRows = scopedUsers.filter((row) => (row.role || 'employee') === 'employee');

    const totalAssigned = employeeRows.reduce((sum, row) => sum + Number(row.walletAssigned || 0), 0);
    const totalSpent = employeeRows.reduce((sum, row) => sum + Number(row.walletSpent || 0), 0);

    const pendingCount = scopedTransactions.filter((row) => row.status === 'pending').length;
    const approvedCount = scopedTransactions.filter((row) => (row.decision || decisionFromStatus(row.status)) === FRAUD_DECISIONS.APPROVED).length;
    const rejectedCount = scopedTransactions.filter((row) => (row.decision || decisionFromStatus(row.status)) === FRAUD_DECISIONS.REJECTED).length;
    const undecidedCount = scopedTransactions.filter((row) => (row.decision || decisionFromStatus(row.status)) === FRAUD_DECISIONS.UNDECIDED).length;
    const approvedAmount = scopedTransactions
      .filter((row) => row.status === 'approved')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalBalance = Math.max(totalAssigned - approvedAmount, 0);
    const highRiskThreshold = Number(fraudSettings.thresholds?.highRisk || 85);
    const highRiskCount = scopedTransactions.filter((row) => Number(row.fraudScore ?? row.riskScore ?? 0) >= highRiskThreshold).length;

    return {
      totalAssigned,
      totalBalance,
      totalSpent,
      pendingCount,
      approvedCount,
      rejectedCount,
      undecidedCount,
      highRiskCount,
      approvedAmount,
      transactionCount: scopedTransactions.length,
      employeeCount: employeeRows.length,
      // Fraud totals
      fraudCount: scopedTransactions.filter((row) => row.fraudStatus === 'fraud').length,
      reviewCount: scopedTransactions.filter((row) => row.fraudStatus === 'review').length,
      flaggedCount: scopedTransactions.filter((row) => row.fraudStatus === 'fraud' || row.fraudStatus === 'review').length,
    };
  }, [fraudSettings.thresholds?.highRisk, hasAdminAccess, users, transactions]);

  const scopedUsers = hasAdminAccess ? users : [];
  const scopedTransactions = hasAdminAccess ? transactions : [];
  const scopedLoading = hasAdminAccess ? (loading || fraudSettingsLoading) : false;
  const scopedError = hasAdminAccess ? error : '';

  return (
    <AdminDataContext.Provider
      value={{
        users: scopedUsers,
        transactions: scopedTransactions,
        loading: scopedLoading,
        error: scopedError,
        totals,
        fraudSettings,
        saveFraudSettings,
        allocateWallet,
        saveEmployeeBudgetCategories,
        updateTransactionStatus,
        overrideTransactionDecision,
        revertTransactionDecision,
        markAsFraud,
        archiveEmployee,
        deleteEmployeeProfile,
        upsertEmployee,
        setUserRole,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  return useContext(AdminDataContext);
}
