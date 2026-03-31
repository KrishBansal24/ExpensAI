import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

// Pages
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Employees from './pages/Employees';
import FraudDashboard from './pages/FraudDashboard';
import FraudSettings from './pages/FraudSettings';
import BudgetAllocation from './pages/BudgetAllocation';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function DashboardLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminDataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout><Dashboard /></DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <DashboardLayout><Expenses /></DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/employees" element={
                <ProtectedRoute>
                  <DashboardLayout><Employees /></DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/fraud" element={
                <ProtectedRoute>
                  <DashboardLayout><FraudDashboard /></DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/fraud-settings" element={
                <ProtectedRoute>
                  <DashboardLayout><FraudSettings /></DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/budget-allocation" element={
                <ProtectedRoute>
                  <DashboardLayout><BudgetAllocation /></DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AdminDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
