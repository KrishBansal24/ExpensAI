// ============================================
// ExpensAI — Home Dashboard Screen
// ============================================
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BudgetRing from '../components/BudgetRing';
import ExpenseCard from '../components/ExpenseCard';
import { formatCurrency, checkSpendingLimit } from '../utils/smartFeatures';
import { motion } from 'framer-motion';
import { IoAddOutline, IoTrendingUpOutline, IoWalletOutline, IoReceiptOutline, IoChevronForward, IoSettingsOutline } from 'react-icons/io5';

export default function Home() {
  const navigate = useNavigate();
  const { user, budget, myExpenses, role } = useApp();
  const remaining = budget.total - budget.spent;
  const spendingCheck = checkSpendingLimit(budget.spent, budget.total, 0);

  // Recent 5 expenses
  const recentExpenses = myExpenses.slice(0, 5);

  return (
    <div className="screen home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-left">
          <p className="home-greeting">Good afternoon,</p>
          <h2 className="home-name">{user?.name?.split(' ')[0] || 'User'} 👋</h2>
        </div>
        <div className="home-header-right">
          {role === 'employee' && (
            <button className="icon-btn" onClick={() => navigate('/admin')} title="Switch to Admin">
              <IoSettingsOutline />
            </button>
          )}
          <div className="avatar-sm" onClick={() => navigate('/profile')}>
            {user?.name?.[0] || 'J'}
          </div>
        </div>
      </div>

      {/* Budget Overview Card */}
      <motion.div
        className="budget-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="budget-card-header">
          <div>
            <p className="budget-card-label">Monthly Budget</p>
            <h3 className="budget-card-period">{budget.period}</h3>
          </div>
          <BudgetRing spent={budget.spent} total={budget.total} size={90} strokeWidth={8} />
        </div>

        <div className="budget-stats">
          <div className="budget-stat">
            <div className="budget-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
              <IoWalletOutline />
            </div>
            <div>
              <p className="budget-stat-label">Total Budget</p>
              <p className="budget-stat-value">{formatCurrency(budget.total)}</p>
            </div>
          </div>
          <div className="budget-stat">
            <div className="budget-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
              <IoTrendingUpOutline />
            </div>
            <div>
              <p className="budget-stat-label">Spent</p>
              <p className="budget-stat-value">{formatCurrency(budget.spent)}</p>
            </div>
          </div>
          <div className="budget-stat">
            <div className="budget-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
              <IoReceiptOutline />
            </div>
            <div>
              <p className="budget-stat-label">Remaining</p>
              <p className="budget-stat-value">{formatCurrency(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Spending alert */}
        {spendingCheck.level !== 'ok' && (
          <div className={`spending-alert spending-alert-${spendingCheck.level}`}>
            ⚠️ {spendingCheck.message}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <motion.button
          className="quick-action-btn"
          onClick={() => navigate('/wallet')}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18 }}
        >
          <IoWalletOutline />
          <span>Wallet</span>
        </motion.button>
        <motion.button
          className="quick-action-btn primary"
          onClick={() => navigate('/add-expense')}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <IoAddOutline />
          <span>Add Expense</span>
        </motion.button>
      </div>

      {/* Recent Transactions */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Recent Expenses</h3>
          <button className="section-link" onClick={() => {}}>
            View All <IoChevronForward />
          </button>
        </div>

        <div className="expense-list">
          {recentExpenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses yet. Add your first expense!</p>
            </div>
          ) : (
            recentExpenses.map((expense, i) => (
              <ExpenseCard key={expense.id} expense={expense} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
