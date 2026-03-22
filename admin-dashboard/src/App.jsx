import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';

function AdminLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <TopNav />
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><AdminLayout><Employees /></AdminLayout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><AdminLayout><Transactions /></AdminLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AdminLayout><Analytics /></AdminLayout></ProtectedRoute>} />
      <Route path="/expenses" element={<Navigate to="/transactions" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminDataProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                },
              }}
            />
          </BrowserRouter>
        </AdminDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
