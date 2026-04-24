import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirect to login if not authenticated
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center" style={{ height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Redirect to leader-login if not leader/superadmin
export const LeaderRoute = ({ children }) => {
  const { user, loading, isLeaderOrAdmin } = useAuth();
  if (loading) return <div className="flex justify-center items-center" style={{ height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/leader/login" replace />;
  if (!isLeaderOrAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// SuperAdmin only
export const SuperAdminRoute = ({ children }) => {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <div className="flex justify-center items-center" style={{ height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/leader/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/leader/dashboard" replace />;
  return children;
};
