import { createContext, useContext, useState } from 'react';
import { currentEmployee } from '../data';

// Note: In a real app with Firebase, this would use onAuthStateChanged
const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Simulate an admin session
  const [user, setUser] = useState({
    ...currentEmployee,
    role: 'manager'
  });

  const login = () => {
    setUser({ ...currentEmployee, role: 'manager' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
