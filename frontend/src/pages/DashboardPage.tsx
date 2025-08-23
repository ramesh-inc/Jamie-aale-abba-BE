import { useState } from 'react';
import { useAuth } from '../utils/auth';
import DashboardLayout from '../components/layout/DashboardLayout';
import ParentSettings from '../components/settings/ParentSettings';

type TabType = 'home' | 'children' | 'activities' | 'messages' | 'attendance' | 'payments' | 'settings';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');


  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">My Children</h3>
                <p className="text-gray-600 mb-4">View and manage your children's profiles</p>
                <button 
                  onClick={() => setActiveTab('children')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  View Children
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Messages</h3>
                <p className="text-gray-600 mb-4">Communicate with teachers and staff</p>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Messages
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Activities</h3>
                <p className="text-gray-600 mb-4">See your child's daily activities</p>
                <button 
                  onClick={() => setActiveTab('activities')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  View Activities
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Attendance</h3>
                <p className="text-gray-600 mb-4">Check your child's attendance record</p>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Attendance
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Payments</h3>
                <p className="text-gray-600 mb-4">Manage fees and payment history</p>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
                >
                  View Payments
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Settings</h3>
                <p className="text-gray-600 mb-4">Update your account information</p>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
                >
                  Open Settings
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return <ParentSettings />;

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{getPageTitle(activeTab)}</h2>
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500">This feature is coming soon...</p>
            </div>
          </div>
        );
    }
  };

  const getPageTitle = (tab: TabType) => {
    switch (tab) {
      case 'home': return 'Parent Dashboard';
      case 'children': return 'My Children';
      case 'activities': return 'Activities';
      case 'messages': return 'Messages';
      case 'attendance': return 'Attendance';
      case 'payments': return 'Payments';
      case 'settings': return 'Settings';
      default: return 'Parent Dashboard';
    }
  };

  const getPageSubtitle = (tab: TabType) => {
    switch (tab) {
      case 'home': return 'Welcome to your parent dashboard';
      case 'children': return 'View and manage your children\'s profiles';
      case 'activities': return 'Track your child\'s daily activities and progress';
      case 'messages': return 'Communicate with teachers and staff';
      case 'attendance': return 'Check your child\'s attendance records';
      case 'payments': return 'Manage fees and payment history';
      case 'settings': return 'Update your account information and preferences';
      default: return undefined;
    }
  };

  return (
    <DashboardLayout
      activeItem={activeTab}
      onItemSelect={(itemId: string) => setActiveTab(itemId as TabType)}
      title={getPageTitle(activeTab)}
      subtitle={getPageSubtitle(activeTab)}
    >
      {renderTabContent()}
    </DashboardLayout>
  );
};

export default DashboardPage;