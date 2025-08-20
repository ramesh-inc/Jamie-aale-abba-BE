import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import TeacherPasswordChangeForm from '../components/auth/TeacherPasswordChangeForm';

const TeacherPasswordChangePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePasswordChanged = () => {
    // Update user data to reflect that password change is no longer required
    if (user && user.teacher_profile) {
      const updatedUser = {
        ...user,
        teacher_profile: {
          ...user.teacher_profile,
          password_change_required: false
        }
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    // Redirect to teacher dashboard
    navigate('/teacher-dashboard', { replace: true });
  };

  return (
    <TeacherPasswordChangeForm onPasswordChanged={handlePasswordChanged} />
  );
};

export default TeacherPasswordChangePage;