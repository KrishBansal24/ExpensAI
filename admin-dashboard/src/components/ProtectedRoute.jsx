import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, hasAdminAccess } = useAuth();

  if (loading) {
    return <div className="screen-center">Checking access...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAdminAccess) {
    return (
      <div className="screen-center">
        <div className="card" style={{ maxWidth: 460 }}>
          <h2 style={{ marginBottom: 8 }}>Access denied</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Your account is authenticated but does not have admin permissions in the users collection.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
