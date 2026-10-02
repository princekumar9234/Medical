import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/Auth.context';
import LoadingSpinner from './ui/LoadingSpinner';

// Requires authentication
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

// Requires specific role
export const RoleRoute = ({ children, role }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;

  return children;
};

// Public only (redirect if already logged in)
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }

  return children;
};
