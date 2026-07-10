import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DonorsPage from './pages/DonorsPage';
import EmergencyPage from './pages/EmergencyPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDonorsPage from './pages/admin/AdminDonorsPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminEmergencyPage from './pages/admin/AdminEmergencyPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminPasswordPage from './pages/AdminPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/verify-otp" element={<VerifyOtpPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="donors" element={<DonorsPage />} />
      <Route path="emergency" element={<EmergencyPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>
    <Route path="/admin" element={<ProtectedRoute><AdminPasswordPage /></ProtectedRoute>} />
    <Route path="/admin/dashboard" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index element={<AdminDashboardPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="donors" element={<AdminDonorsPage />} />
      <Route path="requests" element={<AdminRequestsPage />} />
      <Route path="emergency" element={<AdminEmergencyPage />} />
      <Route path="profile" element={<AdminProfilePage />} />
      <Route path="notifications" element={<AdminNotificationsPage />} />
    </Route>
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
