import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import DashboardLayout from '../components/layout/DashboardLayout';
import TeacherSettings from '../components/settings/TeacherSettings';
import AttendanceMarking from '../components/teacher/AttendanceMarking';
import AttendanceViewing from '../components/teacher/AttendanceViewing';

type TabType = 'home' | 'classes' | 'students' | 'attendance' | 'attendance-view' | 'activities' | 'messages' | 'reports' | 'settings';

const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    // Check if teacher needs to change password first
    if (user?.teacher_profile?.password_change_required) {
      navigate('/teacher-change-password', { replace: true });
    }
  }, [user, navigate]);


  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Teacher Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">My Classes</h3>
                <p className="text-gray-600 mb-4">View and manage your assigned classes</p>
                <button 
                  onClick={() => setActiveTab('classes')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Classes
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Students</h3>
                <p className="text-gray-600 mb-4">Manage student profiles and progress</p>
                <button 
                  onClick={() => setActiveTab('students')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  View Students
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Mark Attendance</h3>
                <p className="text-gray-600 mb-4">Record daily student attendance</p>
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Mark Attendance
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">View Attendance</h3>
                <p className="text-gray-600 mb-4">Review attendance history and records</p>
                <button 
                  onClick={() => setActiveTab('attendance-view')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Records
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Activities</h3>
                <p className="text-gray-600 mb-4">Plan and record learning activities</p>
                <button 
                  onClick={() => setActiveTab('activities')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
                >
                  Manage Activities
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Messages</h3>
                <p className="text-gray-600 mb-4">Communicate with parents and staff</p>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
                >
                  View Messages
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Reports</h3>
                <p className="text-gray-600 mb-4">Generate student and class reports</p>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
                >
                  View Reports
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'attendance':
        return <AttendanceMarking />;
      
      case 'attendance-view':
        return <AttendanceViewing />;
      
      case 'settings':
        return <TeacherSettings />;

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
      case 'home': return 'Teacher Dashboard';
      case 'classes': return 'My Classes';
      case 'students': return 'Students';
      case 'attendance': return 'Mark Attendance';
      case 'attendance-view': return 'View Attendance';
      case 'activities': return 'Activities';
      case 'messages': return 'Messages';
      case 'reports': return 'Reports';
      case 'settings': return 'Settings';
      default: return 'Teacher Dashboard';
    }
  };

  const getPageSubtitle = (tab: TabType) => {
    switch (tab) {
      case 'home': return 'Welcome to your teacher dashboard';
      case 'classes': return 'Manage your assigned classes';
      case 'students': return 'View and manage student profiles';
      case 'attendance': return 'Record daily student attendance';
      case 'attendance-view': return 'Review attendance history and records';
      case 'activities': return 'Plan and record learning activities';
      case 'messages': return 'Communicate with parents and staff';
      case 'reports': return 'Generate student and class reports';
      case 'settings': return 'Update your profile and account settings';
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

export default TeacherDashboardPage;