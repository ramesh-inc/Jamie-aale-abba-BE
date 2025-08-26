import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentRegistrationForm } from '../components/auth/ParentRegistrationForm';
import groupImage from '../assets/page_images/groupImage.png';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegistrationSuccess = (email: string) => {
    // Navigate to success page with email
    navigate('/registration-success', { 
      state: { email }, 
      replace: true 
    });
  };

  return (
    <div className="min-h-screen bg-brand-light-gray flex items-center justify-center p-4">
      {/* Main Container - White Background */}
      <div className="bg-white rounded-lg shadow-xl flex max-w-6xl w-full overflow-hidden">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <ParentRegistrationForm onSuccess={handleRegistrationSuccess} />
        </div>

        {/* Right Side - Group Image */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-6">
          <img 
            src={groupImage} 
            alt="Jamie Aale Abba School Group" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};