import { NavLink } from 'react-router-dom';
import { IoGridOutline, IoReceiptOutline, IoSettingsOutline, IoLogOutOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span style={{ color: '#F59E0B', marginRight: '8px' }}>⚡</span> ExpensAI Admin
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <IoGridOutline className="nav-icon" /> Dashboard
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <IoReceiptOutline className="nav-icon" /> All Expenses
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <IoSettingsOutline className="nav-icon" /> Settings
        </NavLink>
      </nav>
      
      <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)' }}>
        <button onClick={logout} className="nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', marginBottom: 0 }}>
          <IoLogOutOutline className="nav-icon" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
