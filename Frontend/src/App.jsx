import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './features/auth/Auth.context';
import { ProtectedRoute, DoctorRoute, PatientRoute, PublicRoute } from './components/ProtectedRoute';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import VerifyEmailPage from './features/auth/pages/VerifyEmailPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import DoctorSearchPage from './features/doctor/pages/DoctorSearchPage';
import DoctorPublicProfilePage from './features/doctor/pages/DoctorPublicProfilePage';
import MedicineSearchPage from './features/medicine/pages/MedicineSearchPage';

// Authenticated Pages
import AppointmentsPage from './features/appointments/pages/AppointmentsPage';
import ChatPage from './features/chat/pages/ChatPage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';

// Patient-Only Pages
import PatientDashboard from './features/patient/pages/PatientDashboard';
import PatientProfilePage from './features/patient/pages/PatientProfilePage';

// Doctor-Only Pages
import DoctorDashboard from './features/doctor/pages/DoctorDashboard';
import DoctorProfilePage from './features/doctor/pages/DoctorProfilePage';
import DoctorAvailabilityPage from './features/doctor/pages/DoctorAvailabilityPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* ── Public Routes ─────────────────────────────────────────── */}
              <Route path="/" element={<LandingPage />} />

              {/* Redirect logged-in users away from login/register */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected info pages — login required */}
              <Route path="/doctors" element={<ProtectedRoute><DoctorSearchPage /></ProtectedRoute>} />
              <Route path="/doctors/:id" element={<ProtectedRoute><DoctorPublicProfilePage /></ProtectedRoute>} />
              <Route path="/medicines" element={<ProtectedRoute><MedicineSearchPage /></ProtectedRoute>} />

              {/* ── Shared Protected Routes (any authenticated user) ──────── */}
              <Route
                path="/appointments"
                element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>}
              />
              <Route
                path="/chat"
                element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
              />
              <Route
                path="/notifications"
                element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
              />

              {/* ── Patient-Only Routes ───────────────────────────────────── */}
              <Route
                path="/patient/dashboard"
                element={<PatientRoute><PatientDashboard /></PatientRoute>}
              />
              <Route
                path="/patient/profile"
                element={<PatientRoute><PatientProfilePage /></PatientRoute>}
              />

              {/* ── Doctor-Only Routes ────────────────────────────────────── */}
              <Route
                path="/doctor/dashboard"
                element={<DoctorRoute><DoctorDashboard /></DoctorRoute>}
              />
              <Route
                path="/doctor/profile"
                element={<DoctorRoute><DoctorProfilePage /></DoctorRoute>}
              />
              <Route
                path="/doctor/availability"
                element={<DoctorRoute><DoctorAvailabilityPage /></DoctorRoute>}
              />

              {/* ── Legacy / convenience redirects ───────────────────────── */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/profile" element={<Navigate to="/" replace />} />

              {/* ── Catch-all ─────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
