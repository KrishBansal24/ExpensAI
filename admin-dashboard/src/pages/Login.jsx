import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { IoFlashOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, loginWithGoogle, authError, user } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
       navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--color-bg)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', color: '#F59E0B', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <IoFlashOutline />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>ExpensAI Admin Console</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Sign in with an admin profile to monitor wallets, expenses, and approvals.
          </p>
        </div>
        
        {(error || authError) && (
          <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '0.875rem' }}>
            {error || authError}
          </div>
        )}

        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', padding: '12px', marginBottom: '16px', fontSize: '0.95rem' }}
          disabled={googleLoading}
          onClick={handleGoogle}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FcGoogle size={20} />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>or sign in with email and password</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              padding: '12px', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)' 
            }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              padding: '12px', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)' 
            }}
          />
          <button 
            type="submit"
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600,
              opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In securely'}
          </button>
        </form>
        
        <p style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Authorized admin users only. Access is role-checked against the users collection in Firestore.
        </p>
      </div>
    </div>
  );
}
