// ExpensAI — Admin Dashboard Screen
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { employees } from '../data/dummyData';
import ExpenseCard from '../components/ExpenseCard';
import { formatCurrency } from '../utils/smartFeatures';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoArrowBack, IoFilterOutline, IoCheckmarkCircle,
  IoCloseCircle, IoWalletOutline, IoHourglassOutline,
  IoTrendingUpOutline, IoChevronDown
} from 'react-icons/io5';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { expenses, updateExpenseStatus } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [actionExpense, setActionExpense] = useState(null);

  // Stats
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const approvedTotal = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  // Filtered list
  let filtered = [...expenses];
  if (statusFilter !== 'all') filtered = filtered.filter((e) => e.status === statusFilter);
  if (employeeFilter !== 'all') filtered = filtered.filter((e) => e.employeeId === employeeFilter);

  const handleApprove = (id) => { updateExpenseStatus(id, 'approved'); setActionExpense(null); };
  const handleReject = (id) => { updateExpenseStatus(id, 'rejected', 'Does not comply with company policy.'); setActionExpense(null); };

  // Simple bar chart data
  const categoryTotals = {};
  expenses.forEach((e) => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });
  const maxCatTotal = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div className="screen admin-screen">
      <div className="screen-header">
        <button className="icon-btn" onClick={() => navigate('/home')}><IoArrowBack /></button>
        <h2 className="screen-title">Manager Dashboard</h2>
        <div style={{ width: 40 }} />
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <motion.div className="admin-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <IoWalletOutline className="admin-stat-icon" style={{ color: '#3B82F6' }} />
          <p className="admin-stat-value">{formatCurrency(totalExpenses)}</p>
          <p className="admin-stat-label">Total Expenses</p>
        </motion.div>
        <motion.div className="admin-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <IoHourglassOutline className="admin-stat-icon" style={{ color: '#F59E0B' }} />
          <p className="admin-stat-value">{pendingCount}</p>
          <p className="admin-stat-label">Pending</p>
        </motion.div>
        <motion.div className="admin-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <IoTrendingUpOutline className="admin-stat-icon" style={{ color: '#10B981' }} />
          <p className="admin-stat-value">{formatCurrency(approvedTotal)}</p>
          <p className="admin-stat-label">Approved</p>
        </motion.div>
      </div>

      {/* Spending by Category Chart */}
      <div className="admin-chart-section">
        <h3 className="section-title">Spending by Category</h3>
        <div className="bar-chart">
          {Object.entries(categoryTotals).map(([cat, total]) => (
            <div key={cat} className="bar-row">
              <span className="bar-label">{cat}</span>
              <div className="bar-track">
                <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${(total / maxCatTotal) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
              <span className="bar-value">{formatCurrency(total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="filter-group">
          <IoFilterOutline />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <IoChevronDown className="filter-chevron" />
        </div>
        <div className="filter-group">
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="filter-select">
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <IoChevronDown className="filter-chevron" />
        </div>
      </div>

      {/* Expense List with Actions */}
      <div className="admin-expenses">
        <h3 className="section-title">Expenses ({filtered.length})</h3>
        {filtered.map((exp, i) => (
          <div key={exp.id} className="admin-expense-row">
            <ExpenseCard expense={exp} index={i} showEmployee />
            {exp.status === 'pending' && (
              <AnimatePresence>
                <motion.div className="admin-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button className="action-btn approve" onClick={() => handleApprove(exp.id)} title="Approve">
                    <IoCheckmarkCircle /> Approve
                  </button>
                  <button className="action-btn reject" onClick={() => handleReject(exp.id)} title="Reject">
                    <IoCloseCircle /> Reject
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
            {exp.flagged && <div className="flag-banner">⚠️ {exp.flagReason}</div>}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state"><p>No expenses match your filters.</p></div>}
      </div>
    </div>
  );
}
