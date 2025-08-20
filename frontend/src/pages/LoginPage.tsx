import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import type { LoginData, LoginResponse } from '../types/auth';
import FormField from '../components/ui/FormField';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    user_type: 'parent',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleUserTypeSelect = (userType: 'parent' | 'teacher') => {
    setFormData(prev => ({ ...prev, user_type: userType }));
    setErrors({});
  };

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

    try {
      const response: LoginResponse = await loginUser(formData);
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Navigate to appropriate dashboard based on user type
      if (response.user.user_type === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      const errorData = (error as any)?.response?.data;
      
      if (errorData?.user_type_mismatch) {
        // Handle user type mismatch error
        setErrors({ 
          general: errorData.error,
          userTypeMismatch: 'true',
          actualUserType: errorData.actual_user_type || 'unknown'
        });
      } else if (errorData?.non_field_errors) {
        // Handle Django serializer errors
        setErrors({ general: errorData.non_field_errors[0] });
      } else if (typeof errorData === 'string') {
        setErrors({ general: errorData });
      } else if (errorData?.error) {
        setErrors({ general: errorData.error });
      } else if (errorData?.message) {
        setErrors({ general: errorData.message });
      } else {
        setErrors({ general: 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r rounded-full mx-auto mb-4 flex items-center justify-center">
            <img src="/src/assets/logo.png" alt="ClassDojo Nursery" className="w-24 h-24" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login to your account</h1>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* User Type Selection Buttons */}
          <div className="mb-6">
            <p className="text-gray-700 text-center mb-4 font-medium">Select your account type:</p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => handleUserTypeSelect('teacher')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.user_type === 'teacher'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login as Teacher
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeSelect('parent')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.user_type === 'parent'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login as Parent
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error Message */}
              {errors.general && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-800 text-sm">{errors.general}</p>
                  {/* Show correct login button for user type mismatch */}
                  {errors.userTypeMismatch === 'true' && (
                    <div className="mt-3">
                      {errors.actualUserType === 'teacher' && (
                        <button
                          type="button"
                          onClick={() => handleUserTypeSelect('teacher')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Login as Teacher
                        </button>
                      )}
                      {errors.actualUserType === 'parent' && (
                        <button
                          type="button"
                          onClick={() => handleUserTypeSelect('parent')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Login as Parent
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Email Field */}
            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email || errors.non_field_errors?.[0]}
              required
              placeholder="Enter your email address"
            />

            {/* Password Field */}
            <FormField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              placeholder="Enter your password"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-green to-brand-gold text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-brand-green font-medium hover:underline"
              >
                Sign up here
              </button>
            </p>
            <p className="text-sm">
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-brand-gold font-medium hover:underline"
              >
                Forgot your password?
              </button>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@classdojo-nursery.com" className="text-brand-green hover:underline">
              support@classdojo-nursery.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;