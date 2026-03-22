// ============================================
// ExpensAI — Global Application Context
// ============================================
import { createContext, useContext, useState, useCallback } from 'react';
import { initialExpenses, initialNotifications, currentEmployee } from '../data/dummyData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // null = logged out
  const [role, setRole] = useState('employee'); // 'employee' | 'admin'
  const [expenses, setExpenses] = useState(initialExpenses);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [budget, setBudget] = useState(currentEmployee.budget);

  const login = useCallback((selectedRole = 'employee') => {
    setUser(currentEmployee);
    setRole(selectedRole);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRole('employee');
  }, []);

  const addExpense = useCallback((expense) => {
    const newExpense = {
      ...expense,
      id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      currency: '₹',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // Update budget spent
    setBudget((prev) => ({
      ...prev,
      spent: prev.spent + parseFloat(expense.amount),
    }));

    // Add notification
    const newNotif = {
      id: `NOT-${String(notifications.length + 1).padStart(3, '0')}`,
      type: 'info',
      title: 'Expense Submitted',
      message: `Your expense of ₹${parseFloat(expense.amount).toLocaleString()} at ${expense.vendor} has been submitted for review.`,
      expenseId: newExpense.id,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newExpense;
  }, [expenses.length, notifications.length]);

  const updateExpenseStatus = useCallback((expenseId, newStatus, reason = '') => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? {
              ...exp,
              status: newStatus,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Priya Mehta',
              ...(newStatus === 'rejected' ? { rejectionReason: reason } : {}),
            }
          : exp
      )
    );

    // Add notification for the status change
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense) {
      const notifType = newStatus === 'approved' ? 'approval' : 'rejection';
      const newNotif = {
        id: `NOT-${String(notifications.length + 1).padStart(3, '0')}`,
        type: notifType,
        title: newStatus === 'approved' ? 'Expense Approved' : 'Expense Rejected',
        message:
          newStatus === 'approved'
            ? `Expense of ₹${expense.amount.toLocaleString()} at ${expense.vendor} has been approved.`
            : `Expense of ₹${expense.amount.toLocaleString()} at ${expense.vendor} was rejected. ${reason}`,
        expenseId,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  }, [expenses, notifications.length]);

  const markNotificationRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const myExpenses = expenses.filter((e) => e.employeeId === currentEmployee.id);
  const mySpent = myExpenses
    .filter((e) => e.status !== 'rejected')
    .reduce((sum, e) => sum + e.amount, 0);

  const value = {
    user,
    role,
    expenses,
    notifications,
    budget: { ...budget, spent: mySpent },
    unreadCount,
    myExpenses,
    login,
    logout,
    addExpense,
    updateExpenseStatus,
    markNotificationRead,
    markAllNotificationsRead,
    setRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
