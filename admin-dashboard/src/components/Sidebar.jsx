import { NavLink } from 'react-router-dom';
import {
  IoBarChartOutline,
  IoGridOutline,
  IoLogOutOutline,
  IoPeopleOutline,
  IoSwapHorizontalOutline,
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IoGridOutline },
  { to: '/employees', label: 'Employees', icon: IoPeopleOutline },
  { to: '/transactions', label: 'Transactions', icon: IoSwapHorizontalOutline },
  { to: '/analytics', label: 'Analytics', icon: IoBarChartOutline },
];

export default function Sidebar() {
  const { logout } = useAuth();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span style={{ color: 'var(--color-warning)', marginRight: '8px' }}>⚡</span>
        ExpensAI Control
      </div>
      
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon className="nav-icon" /> {item.label}
            </NavLink>
          );
        })}
      </nav>
      
      <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)' }}>
        <button onClick={logout} className="nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', marginBottom: 0 }}>
          <IoLogOutOutline className="nav-icon" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
