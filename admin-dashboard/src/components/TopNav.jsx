import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useAdminData } from '../context/AdminDataContext';

export default function TopNav() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { totals } = useAdminData();

  return (
    <header className="top-header">
      <div className="header-badge">Pending approvals: {totals.pendingCount}</div>

      <button onClick={toggleTheme} className="btn-icon" style={{ marginRight: '16px' }} title="Toggle Theme">
        {isDarkMode ? <IoSunnyOutline size={22} /> : <IoMoonOutline size={22} />}
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name || 'Manager'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{user?.role || 'admin'}</div>
        </div>
        <div style={{ 
          width: 40, height: 40, borderRadius: '50%', 
          background: 'var(--color-primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {user?.name?.charAt(0) || 'M'}
        </div>
      </div>
    </header>
  );
}
