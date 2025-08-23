import { useState } from 'react';
import { authApi } from '../../services/api';
import type { TeacherPasswordChangeData } from '../../types/auth';
import FormField from '../ui/FormField';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TeacherPasswordChangeFormProps {
  onPasswordChanged: () => void;
}

const TeacherPasswordChangeForm: React.FC<TeacherPasswordChangeFormProps> = ({
  onPasswordChanged
}) => {
  const [formData, setFormData] = useState<TeacherPasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      await authApi.teacherChangePassword(formData);
      
      setSuccess(true);
      
      // Wait a moment to show success message, then notify parent
      setTimeout(() => {
        onPasswordChanged();
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Password change error:', error);
      
      const errorData = (error as any)?.response?.data;
      
      if (errorData) {
        // Handle field-specific errors
        if (typeof errorData === 'object' && !errorData.error && !errorData.message) {
          setErrors(errorData);
        } else if (errorData.error) {
          setErrors({ general: errorData.error });
        } else if (errorData.message) {
          setErrors({ general: errorData.message });
        } else {
          setErrors({ general: 'Password change failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Password change failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Changed Successfully!</h2>
          <p className="text-gray-600 mb-4">Your password has been updated. You now have full access to the teacher dashboard.</p>
          <LoadingSpinner size="sm" />
          <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0a2 2 0 102 2m0 0v2m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-2m2 0V9a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0a2 2 0 012 2"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Change Your Password</h1>
          <p className="text-gray-600">For security, please change your initial password before accessing the teacher dashboard.</p>
        </div>

        {/* Password Change Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Current Password Field */}
            <FormField
              label="Current Password"
              name="current_password"
              type="password"
              value={formData.current_password}
              onChange={handleChange}
              error={errors.current_password}
              required
              placeholder="Enter your current password"
            />

            {/* New Password Field */}
            <FormField
              label="New Password"
              name="new_password"
              type="password"
              value={formData.new_password}
              onChange={handleChange}
              error={errors.new_password}
              required
              placeholder="Enter your new password (min 8 characters)"
            />

            {/* Confirm Password Field */}
            <FormField
              label="Confirm New Password"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
              required
              placeholder="Confirm your new password"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Changing Password...</span>
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact your administrator or IT support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPasswordChangeForm;