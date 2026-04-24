import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('evergreen_token');
    const storedUser  = localStorage.getItem('evergreen_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('evergreen_token', tokenData);
    localStorage.setItem('evergreen_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('evergreen_token');
    localStorage.removeItem('evergreen_user');
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('evergreen_user', JSON.stringify(merged));
  };

  const isLeader     = user?.role === 'leader';
  const isMember     = user?.role === 'member';
  const isSuperAdmin = user?.role === 'superadmin';
  const isLeaderOrAdmin = isLeader || isSuperAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isLeader, isMember, isSuperAdmin, isLeaderOrAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
