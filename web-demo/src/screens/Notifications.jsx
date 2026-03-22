// ============================================
// ExpensAI — Notifications Screen
// ============================================
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { timeAgo } from '../utils/smartFeatures';
import {
  IoCheckmarkCircleOutline, IoCloseCircleOutline, IoWarningOutline,
  IoAlertCircleOutline, IoInformationCircleOutline, IoCheckmarkDoneOutline
} from 'react-icons/io5';

const typeConfig = {
  approval: { icon: <IoCheckmarkCircleOutline />, color: '#10B981', bg: '#10B98115' },
  rejection: { icon: <IoCloseCircleOutline />, color: '#EF4444', bg: '#EF444415' },
  warning: { icon: <IoWarningOutline />, color: '#F59E0B', bg: '#F59E0B15' },
  fraud: { icon: <IoAlertCircleOutline />, color: '#8B5CF6', bg: '#8B5CF615' },
  info: { icon: <IoInformationCircleOutline />, color: '#3B82F6', bg: '#3B82F615' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useApp();

  const handleNotifClick = (notif) => {
    markNotificationRead(notif.id);
    if (notif.expenseId) {
      navigate(`/expense/${notif.expenseId}`);
    }
  };

  return (
    <div className="screen notifications-screen">
      {/* Header */}
      <div className="screen-header">
        <h2 className="screen-title">Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn-text" onClick={markAllNotificationsRead}>
            <IoCheckmarkDoneOutline /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <IoInformationCircleOutline style={{ fontSize: '3rem', color: 'var(--color-muted)' }} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.info;
            return (
              <motion.div
                key={notif.id}
                className={`notification-card ${!notif.read ? 'unread' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleNotifClick(notif)}
              >
                <div className="notification-icon" style={{ background: config.bg, color: config.color }}>
                  {config.icon}
                </div>
                <div className="notification-content">
                  <div className="notification-top">
                    <h4 className="notification-title">{notif.title}</h4>
                    {!notif.read && <div className="unread-dot" />}
                  </div>
                  <p className="notification-message">{notif.message}</p>
                  <p className="notification-time">{timeAgo(notif.timestamp)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
