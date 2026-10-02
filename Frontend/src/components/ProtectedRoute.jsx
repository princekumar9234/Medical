import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/Auth.context';
import LoadingSpinner from './ui/LoadingSpinner';

// ── Helpers ────────────────────────────────────────────────────────────────────
const isDoctor = (user) =>
  user?.role === 'doctor' || user?.role === 'DOCTOR';

const isPatient = (user) =>
  user?.role === 'patient' || user?.role === 'PATIENT';

// ── Requires authentication only ────────────────────────────────────────────────
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

// ── Requires DOCTOR role ─────────────────────────────────────────────────────────
export const DoctorRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated || !user) return <Navigate to="/login" state={{ from: location }} replace />;

  // If a patient tries to access a doctor route → send to patient dashboard
  if (isPatient(user)) return <Navigate to="/patient/dashboard" replace />;

  return children;
};

// ── Requires PATIENT role ────────────────────────────────────────────────────────
export const PatientRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated || !user) return <Navigate to="/login" state={{ from: location }} replace />;

  // If a doctor tries to access a patient route → send to doctor dashboard
  if (isDoctor(user)) return <Navigate to="/doctor/dashboard" replace />;

  return children;
};

// ── Requires specific role (generic) ─────────────────────────────────────────────
export const RoleRoute = ({ children, role }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;

  return children;
};

// ── Public only (redirect if already logged in) ────────────────────────────────────
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (isAuthenticated && user) {
    return <Navigate to={isDoctor(user) ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }

  return children;
};
