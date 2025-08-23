import { useParams } from 'react-router-dom';
import PasswordResetForm from '../components/auth/PasswordResetForm';

export default function PasswordResetPage() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is missing the required token.
            </p>
            <button
              onClick={() => window.location.href = '/forgot-password'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PasswordResetForm token={token} />;
}