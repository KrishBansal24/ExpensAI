// ExpensAI — Profile Screen
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { currentEmployee } from '../data/dummyData';
import { motion } from 'framer-motion';
import {
  IoLogOutOutline, IoChevronForward, IoMailOutline,
  IoBriefcaseOutline, IoCalendarOutline, IoBusinessOutline,
  IoLocationOutline, IoNotificationsOutline, IoMoonOutline,
  IoShieldCheckmarkOutline, IoHelpCircleOutline
} from 'react-icons/io5';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, user } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const emp = user || currentEmployee;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="screen profile-screen">
      <div className="screen-header"><h2 className="screen-title">Profile</h2></div>

      <motion.div className="profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar">{emp.name?.[0] || 'J'}</div>
        <h2 className="profile-name">{emp.name}</h2>
        <p className="profile-designation">{emp.designation}</p>
        <span className="profile-id">{emp.id}</span>
      </motion.div>

      <motion.div className="profile-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="profile-section-title">Personal Information</h3>
        <div className="profile-info-item"><IoMailOutline className="profile-info-icon" /><div><p className="profile-info-label">Email</p><p className="profile-info-value">{emp.email}</p></div></div>
        <div className="profile-info-item"><IoBriefcaseOutline className="profile-info-icon" /><div><p className="profile-info-label">Department</p><p className="profile-info-value">{emp.department}</p></div></div>
        <div className="profile-info-item"><IoCalendarOutline className="profile-info-icon" /><div><p className="profile-info-label">Joined</p><p className="profile-info-value">{new Date(emp.joinDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>
        <div className="profile-info-item"><IoMailOutline className="profile-info-icon" /><div><p className="profile-info-label">Reports To</p><p className="profile-info-value">{emp.managerName}</p></div></div>
      </motion.div>

      <motion.div className="profile-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="profile-section-title">Company</h3>
        <div className="profile-info-item"><IoBusinessOutline className="profile-info-icon" /><div><p className="profile-info-label">Organization</p><p className="profile-info-value">{emp.company.name}</p></div></div>
        <div className="profile-info-item"><IoLocationOutline className="profile-info-icon" /><div><p className="profile-info-label">Office</p><p className="profile-info-value">{emp.company.address}</p></div></div>
      </motion.div>

      <motion.div className="profile-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="profile-section-title">Settings</h3>
        <div className="profile-menu-item"><IoNotificationsOutline className="profile-info-icon" /><span>Push Notifications</span><div className="toggle-switch on" /></div>
        <div className="profile-menu-item" onClick={toggleTheme}>
          <IoMoonOutline className="profile-info-icon" />
          <span>Dark Mode</span>
          <div className={`toggle-switch ${isDarkMode ? 'on' : ''}`} />
        </div>
        <div className="profile-menu-item"><IoShieldCheckmarkOutline className="profile-info-icon" /><span>Expense Policy</span><IoChevronForward className="profile-menu-arrow" /></div>
        <div className="profile-menu-item"><IoHelpCircleOutline className="profile-info-icon" /><span>Help & Support</span><IoChevronForward className="profile-menu-arrow" /></div>
      </motion.div>

      <motion.button className="btn btn-danger btn-full" onClick={handleLogout} whileTap={{ scale: 0.97 }}>
        <IoLogOutOutline /> Sign Out
      </motion.button>
      <p className="profile-version">ExpensAI v1.0.0 · Acme Corporation</p>
    </div>
  );
}
