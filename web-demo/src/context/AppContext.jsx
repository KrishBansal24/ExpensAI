import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]); // compatibility alias for older components
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const role = userProfile?.role || 'employee';

  const budget = {
    total: userProfile?.walletAssigned ?? 50000,
    period: userProfile?.period || 'March 2026'
  };
  
  const spent = transactions
    .filter((e) => e.status === 'pending' || e.status === 'approved')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const myExpenses = transactions;
  const wallet = {
    assigned: userProfile?.walletAssigned ?? budget.total,
    spent: userProfile?.walletSpent ?? spent,
    balance: userProfile?.walletBalance ?? Math.max((userProfile?.walletAssigned ?? budget.total) - spent, 0),
  };

  const ensureUserProfile = async (authUser, fallbackName) => {
    const userRef = doc(db, 'users', authUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return;
    }

    await setDoc(userRef, {
      uid: authUser.uid,
      name: authUser.displayName || fallbackName || 'Employee',
      email: authUser.email || '',
      role: 'employee',
      department: 'Engineering',
      walletAssigned: 50000,
      walletBalance: 50000,
      walletSpent: 0,
      period: 'March 2026',
    });
  };

  // --- AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        ensureUserProfile(currentUser).catch((error) => {
          console.error('Profile bootstrap error:', error);
        });
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || 'Employee',
          role: 'employee', 
          department: 'Engineering'
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setExpenses([]);
        setTransactions([]);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const registerUser = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await ensureUserProfile(userCredential.user, name);
    return userCredential;
  };
  const logoutUser = () => signOut(auth);
  const logout = logoutUser;

  // --- DB SYNC ---
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }
      const profileData = snapshot.data();
      setUserProfile(profileData);
    }, (error) => {
      console.error('Profile sync error:', error);
    });

    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid)
    );
    
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const liveTransactions = snapshot.docs
        .map(docItem => ({ id: docItem.id, ...docItem.data() }))
        .sort((a, b) => Date.parse(b?.timestamp || 0) - Date.parse(a?.timestamp || 0));
      setTransactions(liveTransactions);
      setExpenses(liveTransactions);
    }, (error) => {
      console.error('Transactions sync error:', error);
    });

    const unsubNotifications = onSnapshot(
      query(collection(db, 'transactions'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items = snapshot.docs
          .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
          .filter((item) => item.status === 'approved' || item.status === 'rejected')
          .slice(0, 20)
          .map((item) => ({
            id: item.id,
            title: item.status === 'approved' ? 'Transaction Approved' : 'Transaction Rejected',
            message: `${item.category || 'UPI'} payment of ₹${item.amount} is ${item.status}.`,
            date: item.timestamp,
            read: false,
          }));
        setNotifications(items);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubProfile();
      unsubNotifications();
    };
  }, [user]);

  const createWalletTransaction = async ({ amount, category, location, paymentMode = 'UPI' }) => {
    if (!user) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('Wallet profile missing');
        }

        const walletData = userSnap.data();
        const currentBalance = Number(walletData.walletBalance || 0);
        const currentSpent = Number(walletData.walletSpent || 0);
        if (numericAmount > currentBalance) {
          throw new Error('Insufficient wallet balance');
        }

        transaction.set(userRef, {
          walletBalance: currentBalance - numericAmount,
          walletSpent: currentSpent + numericAmount,
        }, { merge: true });
      });

      const docRef = await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userName: user.name,
        amount: numericAmount,
        category: category || 'General',
        status: 'pending',
        location: location || null,
        timestamp: new Date().toISOString(),
        paymentMode,
      });

      return docRef.id;
    } catch (e) {
      console.error('Error creating wallet transaction:', e);
      throw e;
    }
  };

  // Compatibility wrapper for existing AddExpense screen.
  const addExpense = async (expenseData) => {
    return createWalletTransaction({
      amount: expenseData.amount,
      category: expenseData.category,
      location: expenseData.coordinates ? { lat: expenseData.coordinates.lat, lng: expenseData.coordinates.lng } : null,
      paymentMode: 'UPI',
    });
  };

  const updateExpenseStatus = async (expenseId, status) => {
    await setDoc(doc(db, 'transactions', expenseId), { status }, { merge: true });
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <AppContext.Provider value={{
      user,
      userProfile,
      role,
      isLoading,
      loginUser,
      registerUser,
      logoutUser,
      logout,
      expenses,
      transactions,
      myExpenses,
      addExpense,
      createWalletTransaction,
      updateExpenseStatus,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      budget: { ...budget, spent },
      wallet,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
