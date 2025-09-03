import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { parentRegistrationSchema } from '../../utils/validation';
import { authApi } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ParentRegistrationData } from '../../types/auth';
import logo from '../../assets/logo.png';

interface ParentRegistrationFormProps {
  onSuccess?: (email: string) => void;
}

export const ParentRegistrationForm: React.FC<ParentRegistrationFormProps> = ({
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
  } = useForm<ParentRegistrationData>({
    resolver: yupResolver(parentRegistrationSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ParentRegistrationData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    clearErrors();

    try {
      await authApi.registerParent(data);
      
      // Registration successful
      if (onSuccess) {
        onSuccess(data.email);
      }
    } catch (error: unknown) {
      console.error('Registration failed:', error);

      if ((error as any)?.response?.data) {
        const errorData = (error as any).response.data;
        
        // Handle field-specific errors from our custom API error format
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            const fieldName = field === 'first_name' ? 'firstName' :
                            field === 'last_name' ? 'lastName' :
                            field === 'phone_number' ? 'phoneNumber' :
                            field === 'confirm_password' ? 'confirmPassword' :
                            field;
            
            if (fieldName in data) {
              setError(fieldName as keyof ParentRegistrationData, {
                type: 'server',
                message: (messages as string[])[0],
              });
            }
          });
        }
        // Handle direct field errors from Django REST Framework serializers
        else if (typeof errorData === 'object' && !errorData.message && !errorData.error) {
          Object.entries(errorData).forEach(([field, messages]) => {
            const fieldName = field === 'first_name' ? 'firstName' :
                            field === 'last_name' ? 'lastName' :
                            field === 'phone_number' ? 'phoneNumber' :
                            field === 'confirm_password' ? 'confirmPassword' :
                            field;
            
            if (fieldName in data) {
              setError(fieldName as keyof ParentRegistrationData, {
                type: 'server',
                message: Array.isArray(messages) ? messages[0] : messages as string,
              });
            }
          });
        }
        
        // Handle general error message
        if (errorData.message) {
          setSubmitError(errorData.message);
        }
      } else if ((error as any)?.message) {
        setSubmitError((error as any).message);
      } else {
        setSubmitError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <img 
            src={logo} 
            alt="Jamie Aale Abba Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Parent Account
        </h1>
        <p className="text-gray-600">
          Join Jamie Aale Abba - LMS to stay connected with your child's learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="form-label">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
            />
            {errors.firstName && (
              <p className="form-error">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="form-label">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('lastName')}
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
            />
            {errors.lastName && (
              <p className="form-error">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="form-label">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="Enter your email address"
            className={`form-input ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="form-error">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="form-label">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phoneNumber')}
            id="phoneNumber"
            type="tel"
            placeholder="Enter your phone number (e.g., 123-456-7890)"
            className={`form-input ${errors.phoneNumber ? 'border-red-500' : ''}`}
          />
          {errors.phoneNumber && (
            <p className="form-error">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="form-label">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            {...register('password')}
            id="password"
            type="password"
            placeholder="Create a strong password"
            className={`form-input ${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && (
            <p className="form-error">{errors.password.message}</p>
          )}
        </div>

        <div id="password-requirements" className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Password requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>At least 8 characters long</li>
            <li>One uppercase letter (A-Z)</li>
            <li>One lowercase letter (a-z)</li>
            <li>One number (0-9)</li>
            <li>One special character (e.g., !@#$%^&*)</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            {...register('confirmPassword')}
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        {submitError && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded" role="alert">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="btn-primary w-full flex items-center justify-center"
          aria-describedby={isSubmitting ? "submitting-status" : undefined}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              <span id="submitting-status">Creating Account...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </form>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};