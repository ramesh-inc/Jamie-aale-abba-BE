import React, { useState } from 'react';
import { useAuth } from '../../utils/auth';
import { AuthTokenManager } from '../../utils/auth';
import { userApi } from '../../services/api';
import PasswordChangeModal from './PasswordChangeModal';

interface AdminSettingsProps {
  onSuccess?: (user: any) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await userApi.updateProfile(formData);
      AuthTokenManager.setUser(updatedUser.user);
      setSuccess('Profile updated successfully!');
      
      if (onSuccess) {
        onSuccess(updatedUser.user);
      }
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordChangeSuccess = () => {
    setSuccess('Password changed successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        
        <div className="p-6">
          {/* Avatar Section */}
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-purple-600 text-xl font-bold">
                {user?.first_name?.charAt(0) || 'A'}
              </span>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              Change avatar
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
            {/* Full Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* Login Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login Details
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                placeholder="+1 234 567 897"
              />
            </div>

            {/* Admin Level (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Level
              </label>
              <input
                type="text"
                value={user?.admin_profile?.admin_level || user?.user_type || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
              />
              <p className="text-xs text-gray-500 mt-1">Admin level cannot be changed</p>
            </div>

            {/* Language Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language Preference
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                defaultValue="English UK"
              >
                <option>English UK</option>
                <option>English US</option>
                <option>Français</option>
                <option>Español</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Password Change</h3>
        </div>
        
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium">••••••••••••</span>
          </div>
          <button
            onClick={handleChangePassword}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Change
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        userType="admin"
      />
    </div>
  );
};

export default AdminSettings;