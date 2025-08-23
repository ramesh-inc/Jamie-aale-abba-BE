import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '../../services/api';
import type { PasswordResetConfirmData, TokenValidationResponse } from '../../types/auth';

// Validation schema
const schema = yup.object().shape({
  new_password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface PasswordResetFormProps {
  token: string;
}

export default function PasswordResetForm({ token }: PasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<TokenValidationResponse | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setValidatingToken(true);
      const response = await authApi.validateResetToken(token);
      setTokenValidation(response);
    } catch (err: any) {
      console.error('Token validation failed:', err);
      setTokenValidation({ 
        valid: false, 
        error: 'Invalid or expired reset token' 
      });
    } finally {
      setValidatingToken(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!tokenValidation?.valid) return;

    setIsLoading(true);
    setError(null);

    try {
      const resetData: PasswordResetConfirmData = {
        token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      };

      await authApi.confirmPasswordReset(resetData);
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.new_password) {
        setError(err.response.data.new_password.join(', '));
      } else {
        setError('Password reset failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
              
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.href = '/forgot-password'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Request New Reset Link
                </button>
                
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
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
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h2>
              
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
            <p className="text-gray-600">
              Enter your new password for <strong>{tokenValidation.email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="new_password"
                {...register('new_password')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.new_password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Enter your new password"
                autoComplete="new-password"
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm_password"
                {...register('confirm_password')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirm_password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
              
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                disabled={isLoading}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}