import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthTokenManager } from '../../utils/auth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredUserType?: 'parent' | 'teacher' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requiredUserType 
}) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [hasCorrectUserType, setHasCorrectUserType] = React.useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Check if tokens are valid and not expired
      const isValid = AuthTokenManager.checkTokenExpiry();
      const hasAuth = AuthTokenManager.isAuthenticated();
      
      setIsAuthenticated(isValid && hasAuth);
      
      // Check user type if required
      if (isValid && hasAuth && requiredUserType) {
        const userData = AuthTokenManager.getUser();
        setHasCorrectUserType(userData?.user_type === requiredUserType);
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [requiredUserType]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Redirect to appropriate dashboard if user type doesn't match
  if (!hasCorrectUserType) {
    const userData = AuthTokenManager.getUser();
    let correctPath = '/dashboard';
    
    if (userData?.user_type === 'teacher') {
      // Check if teacher needs to change password first
      if (userData.teacher_profile?.password_change_required) {
        correctPath = '/teacher-change-password';
      } else {
        correctPath = '/teacher-dashboard';
      }
    } else if (userData?.user_type === 'admin') {
      correctPath = '/admin-dashboard';
    }
    
    return (
      <Navigate 
        to={correctPath} 
        replace 
      />
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;