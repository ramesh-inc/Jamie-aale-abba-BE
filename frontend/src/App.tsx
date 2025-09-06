import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RegisterPage } from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import DashboardPage from './pages/DashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherPasswordChangePage from './pages/TeacherPasswordChangePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PasswordResetPage from './pages/PasswordResetPage';
import NewsFeedPage from './pages/NewsFeedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthTokenManager } from './utils/auth';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  const isAuthenticated = AuthTokenManager.isAuthenticated();
  
  // Helper function to get appropriate dashboard path
  const getDashboardPath = () => {
    if (!isAuthenticated) return "/login";
    
    const userData = AuthTokenManager.getUser();
    if (userData?.user_type === 'teacher') {
      // Check if teacher needs to change password first
      if (userData.teacher_profile?.password_change_required) {
        return "/teacher-change-password";
      }
      return "/teacher-dashboard";
    }
    if (userData?.user_type === 'admin') {
      return "/admin-dashboard";
    }
    return "/dashboard";
  };

  return (
    <NotificationProvider>
      <Router>
        <div className="App">
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <RegisterPage />
            } 
          />
          
          {/* Email Verification Route - Public */}
          <Route 
            path="/verify-email/:token" 
            element={<EmailVerificationPage />} 
          />
          
          {/* Password Reset Routes - Public */}
          <Route 
            path="/forgot-password" 
            element={
              isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <ForgotPasswordPage />
            } 
          />
          <Route 
            path="/reset-password/:token" 
            element={
              isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <PasswordResetPage />
            } 
          />
          
          {/* Registration Success Route - Public */}
          <Route 
            path="/registration-success" 
            element={<RegistrationSuccessPage />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredUserType="parent">
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teacher-dashboard" 
            element={
              <ProtectedRoute requiredUserType="teacher">
                <TeacherDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teacher-change-password" 
            element={
              <ProtectedRoute requiredUserType="teacher">
                <TeacherPasswordChangePage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requiredUserType="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/newsfeed" 
            element={
              <ProtectedRoute requiredUserType="teacher">
                <NewsFeedPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              <Navigate to={getDashboardPath()} replace />
            } 
          />
          
          {/* Catch all - redirect to appropriate page */}
          <Route 
            path="*" 
            element={
              <Navigate to={getDashboardPath()} replace />
            } 
          />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;