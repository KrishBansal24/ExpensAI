// ============================================
// ExpensAI — Bottom Navigation Component
// ============================================
import { NavLink, useLocation } from 'react-router-dom';
import { IoHomeOutline, IoHome, IoWalletOutline, IoWallet, IoAddCircleOutline, IoAddCircle, IoNotificationsOutline, IoNotifications, IoPersonOutline, IoPerson } from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/home', label: 'Home', IconOutline: IoHomeOutline, IconFilled: IoHome },
  { path: '/wallet', label: 'Wallet', IconOutline: IoWalletOutline, IconFilled: IoWallet },
  { path: '/add-expense', label: 'Add', IconOutline: IoAddCircleOutline, IconFilled: IoAddCircle },
  { path: '/notifications', label: 'Alerts', IconOutline: IoNotificationsOutline, IconFilled: IoNotifications },
  { path: '/profile', label: 'Profile', IconOutline: IoPersonOutline, IconFilled: IoPerson },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useApp();

  // Don't show nav on onboarding, login, or admin screens
  const hiddenPaths = ['/', '/login', '/admin'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, label, IconOutline, IconFilled }) => {
        const isActive = location.pathname === path;
        const Icon = isActive ? IconFilled : IconOutline;

        return (
          <NavLink key={path} to={path} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
            <div className="bottom-nav-icon-wrapper">
              {isActive && (
                <motion.div
                  className="bottom-nav-indicator"
                  layoutId="bottomNavIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="bottom-nav-icon" />
              {label === 'Alerts' && unreadCount > 0 && (
                <span className="bottom-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
