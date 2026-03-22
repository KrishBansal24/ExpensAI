import { useAuth } from '../context/AuthContext';
import { IoLogoGoogle } from 'react-icons/io5';

export default function Login() {
  const { login } = useAuth();
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--color-bg)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', color: '#F59E0B', marginBottom: '16px' }}>⚡</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>ExpensAI Admin</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Corporate Expense Management Portal
          </p>
        </div>
        
        <button 
          onClick={login}
          className="btn" 
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            padding: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <IoLogoGoogle size={20} />
          Sign in with Corporate Google
        </button>
        
        <p style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Authorized personnel only. By signing in, you agree to Acme Corp's security policies.
        </p>
      </div>
    </div>
  );
}
