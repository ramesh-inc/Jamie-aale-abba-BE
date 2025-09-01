import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminApi } from '../../services/api';
import { AuthTokenManager } from '../../utils/auth';
import LoadingSpinner from '../ui/LoadingSpinner';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  adminLevel: yup.string()
    .oneOf(['super_admin', 'admin', 'moderator'])
    .required('Admin level is required'),
  permissions: yup.object().optional(),
  isActive: yup.boolean().optional(),
});

interface AdminRegistrationFormProps {
  onSuccess?: (admin: any) => void;
  onCancel?: () => void;
}

export default function AdminRegistrationForm({ onSuccess, onCancel }: AdminRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const user = AuthTokenManager.getUser();
  const isSuper = user?.is_superuser || user?.admin_profile?.admin_level === 'super_admin';
  
  // Determine available admin levels based on current user's level
  const getAvailableAdminLevels = () => {
    if (isSuper) {
      return [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'moderator', label: 'Moderator' }
      ];
    } else {
      // Regular admins can only create admin and moderator accounts
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'moderator', label: 'Moderator' }
      ];
    }
  };
  
  const availableAdminLevels = getAvailableAdminLevels();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      adminLevel: 'admin',
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await adminApi.createAdmin(data);
      
      if (onSuccess) {
        onSuccess(response.admin);
      }
      
      reset();
    } catch (error: any) {
      console.error('Admin registration failed:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle various error response structures
        if (errorData.errors) {
          // Field-specific errors (object format)
          const firstError = (Object.values(errorData.errors) as string[][])[0]?.[0];
          setSubmitError(firstError || 'Registration failed. Please check your information.');
        } else if (errorData.password) {
          // Password-specific errors (array format)
          const passwordError = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
          setSubmitError(passwordError);
        } else if (errorData.non_field_errors) {
          // Non-field errors (array format)
          const nonFieldError = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
          setSubmitError(nonFieldError);
        } else if (errorData.error) {
          // General error field (string format)
          setSubmitError(errorData.error);
        } else if (errorData.message) {
          // Message field (string format)
          setSubmitError(errorData.message);
        } else if (typeof errorData === 'string') {
          // Direct string error
          setSubmitError(errorData);
        } else {
          // Fallback: try to extract any error from the object
          const allKeys = Object.keys(errorData);
          let errorMessage = 'Registration failed. Please try again.';
          
          for (const key of allKeys) {
            const value = errorData[key];
            if (Array.isArray(value) && value.length > 0) {
              errorMessage = value[0];
              break;
            } else if (typeof value === 'string') {
              errorMessage = value;
              break;
            }
          }
          
          setSubmitError(errorMessage);
        }
      } else {
        setSubmitError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Admin Account</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4">
            <p className="text-red-800 text-sm">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : ''}`}
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('lastName')}
              id="lastName"
              type="text"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : ''}`}
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-red-600 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phoneNumber')}
            id="phoneNumber"
            type="tel"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phoneNumber ? 'border-red-500' : ''}`}
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-sm">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="adminLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Level <span className="text-red-500">*</span>
          </label>
          <select
            {...register('adminLevel')}
            id="adminLevel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableAdminLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          {errors.adminLevel && (
            <p className="text-red-600 text-sm mt-1">{errors.adminLevel.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-2" />
                Creating Admin...
              </>
            ) : (
              'Create Admin Account'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}