import { useState } from 'react';
import { useAuth } from '../utils/auth';
import DashboardLayout from '../components/layout/DashboardLayout';
import ParentSettings from '../components/settings/ParentSettings';
import ChildrenManagement from '../components/parent/ChildrenManagement';
import LearningActivitiesChart from '../components/parent/LearningActivitiesChart';
import AttendanceChart from '../components/parent/AttendanceChart';

type TabType = 'home' | 'children' | 'activities' | 'messages' | 'attendance' | 'payments' | 'settings';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);


  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.first_name}!
              </h2>
              <p className="text-gray-600">
                Track your children's learning progress and stay connected with their development.
              </p>
            </div>

            {/* Children Cards and Learning Activities Chart */}
            <div className="grid grid-cols-1 gap-6">
              {/* Children Cards - Hidden for now */}
              {/* <div className="lg:col-span-1">
                <DashboardChildrenCards 
                  selectedChildId={selectedChildId ?? undefined}
                  onChildSelect={setSelectedChildId}
                />
              </div> */}
              
              {/* Learning Activities Chart */}
              <div className="w-full">
                <LearningActivitiesChart 
                  selectedChildId={selectedChildId ?? undefined}
                  onChildSelect={setSelectedChildId}
                />
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="mt-6">
              <AttendanceChart 
                selectedChildId={selectedChildId ?? undefined}
                onChildSelect={setSelectedChildId}
              />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#546848', opacity: 0.1 }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#546848' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">My Children</h3>
                    <p className="text-xs text-gray-600">Manage profiles</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('children')}
                  className="w-full mt-3 text-xs text-white py-2 rounded-md transition-colors"
                  style={{ backgroundColor: '#546848' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#495c42'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#546848'}
                >
                  View All
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Messages</h3>
                    <p className="text-xs text-gray-600">Chat with teachers</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="w-full mt-3 text-xs bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Messages
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Attendance</h3>
                    <p className="text-xs text-gray-600">Daily records</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className="w-full mt-3 text-xs bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Records
                </button>
              </div>

            </div>
          </div>
        );
      
      case 'children':
        return <ChildrenManagement />;

      case 'activities':
        return (
          <div className="space-y-6">
            <LearningActivitiesChart 
              selectedChildId={selectedChildId ?? undefined}
              onChildSelect={setSelectedChildId}
            />
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <AttendanceChart 
              selectedChildId={selectedChildId ?? undefined}
              onChildSelect={setSelectedChildId}
            />
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