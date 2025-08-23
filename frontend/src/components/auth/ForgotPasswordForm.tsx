import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '../../services/api';
import type { PasswordResetRequestData } from '../../types/auth';

// Validation schema
const schema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const email = watch('email');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const resetData: PasswordResetRequestData = {
        email: data.email,
      };

      await authApi.requestPasswordReset(resetData);
      
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
              
              <p className="text-gray-600 mb-6">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                The link will expire in 1 hour for security reasons.
              </p>
              
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Enter your email address"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
              
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-gray-600 bg-gray-100 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed"
                >
                  Back to Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}