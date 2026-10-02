import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './features/auth/Auth.context';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import DoctorSearchPage from './features/doctor/pages/DoctorSearchPage';
import DoctorPublicProfilePage from './features/doctor/pages/DoctorPublicProfilePage';
import MedicineSearchPage from './features/medicine/pages/MedicineSearchPage';

// Authenticated Pages
import AppointmentsPage from './features/appointments/pages/AppointmentsPage';
import ChatPage from './features/chat/pages/ChatPage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';

// Patient Pages
import PatientDashboard from './features/patient/pages/PatientDashboard';
import PatientProfilePage from './features/patient/pages/PatientProfilePage';

// Doctor Pages
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
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/doctors" element={<DoctorSearchPage />} />
              <Route path="/doctors/:id" element={<DoctorPublicProfilePage />} />
              <Route path="/medicines" element={<MedicineSearchPage />} />

              {/* Shared Protected Routes */}
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <AppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Patient Protected Routes */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute>
                    <PatientProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Protected Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/profile"
                element={
                  <ProtectedRoute>
                    <DoctorProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/availability"
                element={
                  <ProtectedRoute>
                    <DoctorAvailabilityPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
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
