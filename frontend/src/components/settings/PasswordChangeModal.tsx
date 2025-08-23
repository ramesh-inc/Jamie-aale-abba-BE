import React, { useState } from 'react';
import { authApi } from '../../services/api';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userType: 'parent' | 'teacher' | 'admin';
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userType
}) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use appropriate change password endpoint for each user type
      if (userType === 'teacher') {
        await authApi.teacherChangePassword(formData);
      } else if (userType === 'admin') {
        await authApi.adminChangePassword(formData);
      } else if (userType === 'parent') {
        await authApi.parentChangePassword(formData);
      } else {
        throw new Error('Invalid user type for password change');
      }
      
      setSuccess('Password changed successfully!');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Password change failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;