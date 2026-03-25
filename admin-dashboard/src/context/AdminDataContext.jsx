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

const AdminDataContext = createContext();

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !hasAdminAccess) return undefined;

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

    return () => {
      unsubUsers();
      unsubTransactions();
    };
  }, [user, hasAdminAccess]);

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

  const updateTransactionStatus = useCallback(async ({ transactionId, status }) => {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('Unsupported status');
    }

    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, 'transactions', transactionId);
      const txSnap = await transaction.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');

      const txData = txSnap.data();
      const currentStatus = txData.status;
      if (currentStatus === status) return;

      transaction.set(
        txRef,
        {
          status,
          autoDecision: false,
          decisionSource: 'manual',
          manualReviewRequired: false,
          decisionReason: `Manually ${status} by admin review.`,
          reviewedAt: serverTimestamp(),
          reviewedBy: user?.uid || null,
        },
        { merge: true },
      );

      if (status !== 'rejected' || currentStatus === 'rejected') {
        return;
      }

      const userId = txData.userId;
      if (!userId) return;

      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const amount = Number(txData.amount || 0);
      const nextBalance = Number(userData.walletBalance || 0) + amount;
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
  }, [user?.uid]);

  const totals = useMemo(() => {
    const scopedUsers = hasAdminAccess ? users : [];
    const scopedTransactions = hasAdminAccess ? transactions : [];
    const employeeRows = scopedUsers.filter((row) => (row.role || 'employee') === 'employee');

    const totalAssigned = employeeRows.reduce((sum, row) => sum + Number(row.walletAssigned || 0), 0);
    const totalBalance = employeeRows.reduce((sum, row) => sum + Number(row.walletBalance || 0), 0);
    const totalSpent = employeeRows.reduce((sum, row) => sum + Number(row.walletSpent || 0), 0);

    const pendingCount = scopedTransactions.filter((row) => row.status === 'pending').length;
    const approvedAmount = scopedTransactions
      .filter((row) => row.status === 'approved')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return {
      totalAssigned,
      totalBalance,
      totalSpent,
      pendingCount,
      approvedAmount,
      transactionCount: scopedTransactions.length,
      employeeCount: employeeRows.length,
    };
  }, [hasAdminAccess, users, transactions]);

  const scopedUsers = hasAdminAccess ? users : [];
  const scopedTransactions = hasAdminAccess ? transactions : [];
  const scopedLoading = hasAdminAccess ? loading : false;
  const scopedError = hasAdminAccess ? error : '';

  return (
    <AdminDataContext.Provider
      value={{
        users: scopedUsers,
        transactions: scopedTransactions,
        loading: scopedLoading,
        error: scopedError,
        totals,
        allocateWallet,
        updateTransactionStatus,
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
