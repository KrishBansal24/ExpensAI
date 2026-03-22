// ============================================
// ExpensAI — Expense Detail Screen
// ============================================
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { categories } from '../data/dummyData';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, timeAgo } from '../utils/smartFeatures';
import { motion } from 'framer-motion';
import {
  IoArrowBack, IoLocationOutline, IoTimeOutline, IoPersonOutline,
  IoReceiptOutline, IoPricetagOutline, IoDocumentTextOutline,
  IoCheckmarkCircleOutline, IoCloseCircleOutline, IoHourglassOutline
} from 'react-icons/io5';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { expenses } = useApp();

  const expense = expenses.find((e) => e.id === id);
  if (!expense) {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="icon-btn" onClick={() => navigate(-1)}><IoArrowBack /></button>
          <h2 className="screen-title">Expense Not Found</h2>
          <div style={{ width: 40 }} />
        </div>
        <div className="empty-state"><p>This expense could not be found.</p></div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === expense.category) || categories[7];

  const timelineSteps = [
    {
      icon: <IoDocumentTextOutline />,
      label: 'Submitted',
      time: expense.submittedAt ? timeAgo(expense.submittedAt) : '—',
      active: true,
    },
    {
      icon: <IoHourglassOutline />,
      label: 'Under Review',
      time: expense.status !== 'pending' ? 'Reviewed' : 'Waiting...',
      active: expense.status !== 'pending',
    },
    {
      icon: expense.status === 'rejected' ? <IoCloseCircleOutline /> : <IoCheckmarkCircleOutline />,
      label: expense.status === 'rejected' ? 'Rejected' : expense.status === 'approved' ? 'Approved' : 'Decision',
      time: expense.reviewedAt ? timeAgo(expense.reviewedAt) : '—',
      active: expense.status !== 'pending',
    },
  ];

  return (
    <div className="screen detail-screen">
      {/* Header */}
      <div className="screen-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <IoArrowBack />
        </button>
        <h2 className="screen-title">Expense Details</h2>
        <div style={{ width: 40 }} />
      </div>

      {/* Amount Card */}
      <motion.div
        className="detail-amount-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="detail-category-icon" style={{ background: `${category.color}20`, color: category.color }}>
          <span style={{ fontSize: '2rem' }}>{category.icon}</span>
        </div>
        <h1 className="detail-amount">{formatCurrency(expense.amount)}</h1>
        <p className="detail-vendor">{expense.vendor}</p>
        <StatusBadge status={expense.status} />
      </motion.div>

      {/* Details Grid */}
      <motion.div
        className="detail-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="detail-item">
          <IoPricetagOutline className="detail-item-icon" />
          <div>
            <p className="detail-item-label">Category</p>
            <p className="detail-item-value">{category.icon} {category.label}</p>
          </div>
        </div>

        <div className="detail-item">
          <IoTimeOutline className="detail-item-icon" />
          <div>
            <p className="detail-item-label">Date & Time</p>
            <p className="detail-item-value">{expense.date} · {expense.time}</p>
          </div>
        </div>

        <div className="detail-item">
          <IoLocationOutline className="detail-item-icon" />
          <div>
            <p className="detail-item-label">Location</p>
            <p className="detail-item-value">{expense.location}</p>
            {expense.coordinates && (
              <p className="detail-item-sub">
                GPS: {expense.coordinates.lat.toFixed(4)}, {expense.coordinates.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        <div className="detail-item">
          <IoPersonOutline className="detail-item-icon" />
          <div>
            <p className="detail-item-label">Reviewed By</p>
            <p className="detail-item-value">{expense.reviewedBy || 'Pending review'}</p>
          </div>
        </div>

        {expense.notes && (
          <div className="detail-item full-width">
            <IoDocumentTextOutline className="detail-item-icon" />
            <div>
              <p className="detail-item-label">Notes</p>
              <p className="detail-item-value">{expense.notes}</p>
            </div>
          </div>
        )}

        {expense.rejectionReason && (
          <div className="detail-item full-width rejection-note">
            <IoCloseCircleOutline className="detail-item-icon" style={{ color: '#EF4444' }} />
            <div>
              <p className="detail-item-label" style={{ color: '#EF4444' }}>Rejection Reason</p>
              <p className="detail-item-value">{expense.rejectionReason}</p>
            </div>
          </div>
        )}

        {expense.flagged && (
          <div className="detail-item full-width flag-note">
            <IoReceiptOutline className="detail-item-icon" style={{ color: '#F59E0B' }} />
            <div>
              <p className="detail-item-label" style={{ color: '#F59E0B' }}>⚠️ Flagged</p>
              <p className="detail-item-value">{expense.flagReason}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Timeline */}
      <motion.div
        className="detail-timeline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="section-title">Status Timeline</h3>
        <div className="timeline">
          {timelineSteps.map((step, i) => (
            <div key={i} className={`timeline-step ${step.active ? 'active' : ''}`}>
              <div className={`timeline-dot ${step.active ? 'active' : ''}`}>
                {step.icon}
              </div>
              {i < timelineSteps.length - 1 && <div className={`timeline-line ${timelineSteps[i + 1].active ? 'active' : ''}`} />}
              <div className="timeline-info">
                <p className="timeline-label">{step.label}</p>
                <p className="timeline-time">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Expense ID */}
      <p className="detail-id">ID: {expense.id}</p>
    </div>
  );
}
