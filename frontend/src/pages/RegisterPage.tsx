import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentRegistrationForm } from '../components/auth/ParentRegistrationForm';

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
    <div className="min-h-screen bg-brand-light-gray flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <ParentRegistrationForm onSuccess={handleRegistrationSuccess} />
      </div>

      {/* Right Side - Decorative Images */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background Circles */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-brand-gold rounded-full opacity-20"></div>
        <div className="absolute top-40 right-40 w-16 h-16 bg-brand-green rounded-full opacity-30"></div>
        <div className="absolute bottom-40 right-60 w-24 h-24 bg-brand-gold rounded-full opacity-25"></div>
        
        {/* Image Placeholders */}
        <div className="absolute top-32 right-16 w-48 h-48 bg-white rounded-full shadow-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-center text-blue-600">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
              </svg>
              <p className="text-sm font-medium">Learning</p>
            </div>
          </div>
        </div>

        <div className="absolute top-80 right-32 w-40 h-40 bg-white rounded-full shadow-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <div className="text-center text-green-600">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <p className="text-sm font-medium">Education</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 right-20 w-36 h-36 bg-white rounded-full shadow-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
            <div className="text-center text-yellow-600">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              <p className="text-sm font-medium">Progress</p>
            </div>
          </div>
        </div>

        <div className="absolute top-60 right-80 w-28 h-28 bg-brand-green rounded-full opacity-40"></div>
      </div>
    </div>
  );
};