import React from 'react';
import { useAuth } from '../utils/auth';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-brand-gold to-brand-green rounded-full flex items-center justify-center mr-3">
                <img src="/src/assets/logo.png" alt="ClassDojo Nursery" className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-semibold text-gray-800">ClassDojo Nursery</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.first_name}!
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Parent Dashboard</h2>
          <p className="text-gray-600">Manage your child's nursery experience</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-gray-800">{user?.first_name} {user?.last_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-800">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Phone Number</label>
              <p className="text-gray-800">{user?.phone_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">User Type</label>
              <p className="text-gray-800 capitalize">{user?.user_type}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">My Children</h3>
            <p className="text-gray-600 mb-4">View and manage your children's profiles</p>
            <button className="bg-brand-green text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
              View Children
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Messages</h3>
            <p className="text-gray-600 mb-4">Communicate with teachers and staff</p>
            <button className="bg-brand-gold text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
              View Messages
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Activities</h3>
            <p className="text-gray-600 mb-4">See your child's daily activities</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              View Activities
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;