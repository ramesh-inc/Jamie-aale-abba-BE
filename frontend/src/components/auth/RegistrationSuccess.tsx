import { useState } from 'react';
import { authApi } from '../../services/api';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RegistrationSuccessProps {
  email: string;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ email }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      await authApi.resendVerification(email);
      setResendMessage('Verification email sent successfully! Please check your inbox.');
    } catch (error: unknown) {
      setResendError((error as any)?.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-success-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Account Created Successfully!
        </h1>
        
        <p className="text-gray-600 mb-4">
          We've sent a verification email to:
        </p>
        
        <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded break-all">
          {email}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded">
          <p className="text-sm">
            <strong>Next steps:</strong>
          </p>
          <ol className="text-sm mt-2 space-y-1 text-left">
            <li>1. Check your email inbox (and spam folder)</li>
            <li>2. Click the verification link in the email</li>
            <li>3. Your account will be activated automatically</li>
            <li>4. You can then log in to access your parent dashboard</li>
          </ol>
        </div>

        {resendMessage && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
            {resendMessage}
          </div>
        )}

        {resendError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
            {resendError}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Didn't receive the email?
          </p>
          
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="btn-secondary flex items-center justify-center w-full"
          >
            {isResending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Resending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a
              href="mailto:support@classdojo.com"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};