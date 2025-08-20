import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

const TeacherDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if teacher needs to change password first
    if (user?.teacher_profile?.password_change_required) {
      navigate('/teacher-change-password', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <img src="/src/assets/logo.png" alt="ClassDojo Nursery" className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-semibold text-gray-800">ClassDojo Nursery - Teacher Portal</h1>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Teacher Dashboard</h2>
          <p className="text-gray-600">Manage your classes and students</p>
        </div>

        {/* Teacher Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <p className="text-gray-800">{user?.phone_number || 'Not provided'}</p>
            </div>
            {user?.teacher_profile && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Employee ID</label>
                  <p className="text-gray-800">{user.teacher_profile.employee_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Subjects</label>
                  <p className="text-gray-800">{user.teacher_profile.subjects}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Experience</label>
                  <p className="text-gray-800">{user.teacher_profile.experience_years} years</p>
                </div>
                {user.teacher_profile.qualification && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-600">Qualification</label>
                    <p className="text-gray-800">{user.teacher_profile.qualification}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">My Classes</h3>
            <p className="text-gray-600 mb-4">View and manage your assigned classes</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              View Classes
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Students</h3>
            <p className="text-gray-600 mb-4">Manage student profiles and progress</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              View Students
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Attendance</h3>
            <p className="text-gray-600 mb-4">Mark and track student attendance</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Take Attendance
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Activities</h3>
            <p className="text-gray-600 mb-4">Plan and record learning activities</p>
            <button className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors">
              Manage Activities
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Messages</h3>
            <p className="text-gray-600 mb-4">Communicate with parents and staff</p>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              View Messages
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Reports</h3>
            <p className="text-gray-600 mb-4">Generate student and class reports</p>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboardPage;