import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    const token = authService.getToken();
    if (savedUser && token) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    return res;
  };

  const register = async (fullName, email, password, confirmPassword, role) => {
    return await authService.register(fullName, email, password, confirmPassword, role);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isManager = user?.role === 'MANAGER';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
