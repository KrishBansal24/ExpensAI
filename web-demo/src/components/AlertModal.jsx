// ============================================
// ExpensAI — Alert Modal Component
// ============================================
import { motion, AnimatePresence } from 'framer-motion';
import { IoWarningOutline, IoAlertCircleOutline, IoInformationCircleOutline, IoCloseOutline } from 'react-icons/io5';

const iconMap = {
  warning: IoWarningOutline,
  critical: IoAlertCircleOutline,
  info: IoInformationCircleOutline,
  caution: IoWarningOutline,
};

export default function AlertModal({ isOpen, onClose, title, message, type = 'warning', onConfirm, confirmText = 'Continue', cancelText = 'Cancel' }) {
  const Icon = iconMap[type] || IoWarningOutline;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`modal-content modal-${type}`}
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}>
              <IoCloseOutline />
            </button>
            <div className={`modal-icon modal-icon-${type}`}>
              <Icon />
            </div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={onClose}>{cancelText}</button>
              {onConfirm && (
                <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
