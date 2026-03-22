// ============================================
// ExpensAI — Expense Card Component
// ============================================
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/dummyData';
import StatusBadge from './StatusBadge';
import { formatCurrency, timeAgo } from '../utils/smartFeatures';
import { motion } from 'framer-motion';

export default function ExpenseCard({ expense, index = 0, showEmployee = false }) {
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === expense.category) || categories[7];

  return (
    <motion.div
      className="expense-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/expense/${expense.id}`)}
      whileTap={{ scale: 0.98 }}
    >
      <div className="expense-card-icon" style={{ background: `${category.color}20`, color: category.color }}>
        <span>{category.icon}</span>
      </div>
      <div className="expense-card-info">
        <div className="expense-card-top">
          <h4 className="expense-card-vendor">{expense.vendor}</h4>
          <span className="expense-card-amount">{formatCurrency(expense.amount)}</span>
        </div>
        <div className="expense-card-bottom">
          <span className="expense-card-meta">
            {showEmployee ? expense.employeeName : category.label} · {timeAgo(expense.submittedAt)}
          </span>
          <StatusBadge status={expense.status} />
        </div>
      </div>
    </motion.div>
  );
}
