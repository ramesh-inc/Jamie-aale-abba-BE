import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '../../services/api';
import type { AdminPasswordChangeData } from '../../types/auth';

// Validation schema
const schema = yup.object().shape({
  current_password: yup
    .string()
    .required('Current password is required'),
  new_password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface AdminFirstTimePasswordChangeProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function AdminFirstTimePasswordChange({ onSuccess, onCancel }: AdminFirstTimePasswordChangeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const passwordData: AdminPasswordChangeData = {
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      };

      await authApi.adminChangePassword(passwordData);
      
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Password change failed:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.details) {
        setError(err.response.data.details.join(', '));
      } else {
        setError('Password change failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Change Your Password
        </h2>
        
        <p className="text-sm text-gray-600 mb-6">
          You must change your password before accessing the system. Please choose a strong password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current_password"
              {...register('current_password')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.current_password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Enter your current password"
            />
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
            )}
          </div>

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
            />
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 bg-gray-100 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}