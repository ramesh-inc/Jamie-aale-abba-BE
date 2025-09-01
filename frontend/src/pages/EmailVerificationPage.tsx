import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      handleEmailVerification(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [token]);

  const handleEmailVerification = async (verificationToken: string) => {
    try {
      setStatus('loading');
      const response = await verifyEmail(verificationToken);
      
      // Store tokens if provided (automatic login after verification)
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      setStatus('success');
      setMessage(response.message);
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error: unknown) {
      console.error('Email verification failed:', error);
      const errorData = (error as any)?.response?.data;
      
      if (errorData?.error?.includes('expired')) {
        setStatus('expired');
        setMessage('Your verification link has expired.');
      } else {
        setStatus('error');
        setMessage(errorData?.error || 'Email verification failed. Please try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      setMessage('Please enter your email address to resend verification.');
      return;
    }

    try {
      setIsResending(true);
      await resendVerification(userEmail);
      setMessage('Verification email sent successfully! Please check your inbox.');
    } catch (error: unknown) {
      console.error('Resend verification failed:', error);
      const errorData = (error as any)?.response?.data;
      setMessage(errorData?.error || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-r rounded-full mx-auto mb-6 flex items-center justify-center">
            <img src="/src/assets/logo.png" alt="JAA-LMS" className="w-16 h-16" />
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Verifying Your Email</h1>
              <LoadingSpinner />
              <p className="text-gray-600 mt-4">Please wait while we verify your email address...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">Email Verified Successfully!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you to dashboard in a few seconds...</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard Now
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Registering Again
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div>
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-yellow-600 mb-4">Link Expired</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {/* Resend verification form */}
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || !userEmail}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@jamiaaaleabba.co.uk" className="text-blue-600 hover:underline">
                support@jamiaaaleabba.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;