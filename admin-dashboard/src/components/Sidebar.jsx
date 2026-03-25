import { NavLink } from 'react-router-dom';
import { IoGridOutline, IoReceiptOutline, IoLogOutOutline, IoPeopleOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          ⚡
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ExpensAI</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <IoGridOutline size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/expenses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <IoReceiptOutline size={20} />
          <span>Expenses</span>
        </NavLink>
        <NavLink to="/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <IoPeopleOutline size={20} />
          <span>Personnel</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--color-border)' }}>
        <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 0 }}>
          <IoLogOutOutline size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
