// ============================================
// ExpensAI — Login Screen
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { IoMailOutline, IoLockClosedOutline, IoLogoGoogle, IoEyeOutline, IoEyeOffOutline, IoArrowForward } from 'react-icons/io5';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('jyoti.sharma@acmecorp.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('employee');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(selectedRole);
      navigate(selectedRole === 'admin' ? '/admin' : '/home');
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      login(selectedRole);
      navigate(selectedRole === 'admin' ? '/admin' : '/home');
    }, 1000);
  };

  return (
    <div className="login-screen">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon-lg">⚡</span>
          </div>
          <h1 className="login-title">ExpensAI</h1>
          <p className="login-subtitle">Corporate Expense Management</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <button
            className={`role-btn ${selectedRole === 'employee' ? 'active' : ''}`}
            onClick={() => setSelectedRole('employee')}
          >
            Employee
          </button>
          <button
            className={`role-btn ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => setSelectedRole('admin')}
          >
            Manager
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <IoMailOutline className="input-icon" />
            <input
              type="email"
              placeholder="Corporate email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <IoLockClosedOutline className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked /> Remember me
            </label>
            <a href="#" className="link-text">Forgot password?</a>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>Sign In <IoArrowForward /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>or continue with</span>
        </div>

        {/* Google Login */}
        <button className="btn btn-google btn-full" onClick={handleGoogleLogin} disabled={isLoading}>
          <IoLogoGoogle /> Sign in with Google
        </button>

        <p className="login-footer">
          By signing in, you agree to Acme Corp's <a href="#">expense policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
