import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resendVerification } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  
  // Get email from location state (passed from registration form)
  const email = location.state?.email || '';

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Email address not found. Please register again.');
      return;
    }

    try {
      setIsResending(true);
      setResendMessage('');
      await resendVerification(email);
      setResendMessage('Verification email sent successfully! Please check your inbox.');
    } catch (error: any) {
      console.error('Resend verification failed:', error);
      const errorData = error.response?.data;
      
      if (errorData?.error?.includes('wait')) {
        setResendMessage('Please wait before requesting another verification email.');
      } else {
        setResendMessage(errorData?.error || 'Failed to resend verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-r rounded-full mx-auto mb-6 flex items-center justify-center">
            <img src="/src/assets/logo.png" alt="ClassDojo Nursery" className="w-16 h-16" />
          </div>

          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h1>
          
          <p className="text-gray-600 mb-6 text-lg">
            Thank you for registering with ClassDojo! We've sent a verification email to:
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-blue-800">{email}</p>
          </div>

          <div className="text-left bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Your account will be activated automatically</li>
              <li>You'll be redirected to your dashboard</li>
            </ol>
          </div>

          {/* Resend Verification */}
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or:
            </p>
            
            {resendMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                resendMessage.includes('successfully') 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {resendMessage}
              </div>
            )}
            
            <button
              onClick={handleResendVerification}
              disabled={isResending || !email}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isResending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Resending...</span>
                </>
              ) : (
                'Resend Verification Email'
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Login Page
            </button>
            
            <button
              onClick={() => navigate('/register')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Register Different Account
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@classdojo-nursery.com" className="text-blue-600 hover:underline">
                support@classdojo-nursery.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;