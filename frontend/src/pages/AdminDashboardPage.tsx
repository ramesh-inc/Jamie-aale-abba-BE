import { useState, useEffect } from 'react';
import { AuthTokenManager } from '../utils/auth';
import AdminRegistrationForm from '../components/auth/AdminRegistrationForm';
import TeacherRegistrationForm from '../components/auth/TeacherRegistrationForm';
import AdminFirstTimePasswordChange from '../components/auth/AdminFirstTimePasswordChange';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProgressChart from '../components/dashboard/ProgressChart';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import AdminSettings from '../components/settings/AdminSettings';
import { adminApi } from '../services/api';
import type { AdminUser, TeacherUser } from '../types/auth';

type TabType = 'home' | 'messages' | 'student-account' | 'reports' | 'create-admin' | 'create-teacher' | 'manage-admins' | 'manage-teachers' | 'settings';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [adminStats, setAdminStats] = useState({ admins: 0, teachers: 0 });
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [user, setUser] = useState(() => AuthTokenManager.getUser());
  const isSuper = user?.is_superuser || user?.admin_profile?.admin_level === 'super_admin';
  const isAdmin = user?.admin_profile?.admin_level === 'admin';
  
  // Check if user must change password
  useEffect(() => {
    if (user?.must_change_password) {
      setShowPasswordChange(true);
    }
  }, [user?.must_change_password]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [adminResponse, teacherResponse] = await Promise.all([
        adminApi.getAdmins(),
        adminApi.getTeachers(),
      ]);

      setAdmins(adminResponse.admins);
      setTeachers(teacherResponse.teachers);
      setAdminStats({
        admins: adminResponse.count,
        teachers: teacherResponse.count,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCreated = (newAdmin: AdminUser) => {
    setAdmins(prev => [...prev, newAdmin]);
    setAdminStats(prev => ({ ...prev, admins: prev.admins + 1 }));
    setActiveTab('home');
  };

  const handleTeacherCreated = (newTeacher: TeacherUser) => {
    setTeachers(prev => [...prev, newTeacher]);
    setAdminStats(prev => ({ ...prev, teachers: prev.teachers + 1 }));
    setActiveTab('home');
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChange(false);
    // Update user data to clear must_change_password flag
    if (user) {
      const updatedUser = { ...user, must_change_password: false };
      AuthTokenManager.setUser(updatedUser);
      setUser(updatedUser);
    }
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart Area */}
            <div className="lg:col-span-2">
              <ProgressChart />
            </div>
            
            {/* Activity Timeline */}
            <div className="lg:col-span-1">
              <ActivityTimeline />
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Admin Accounts</h3>
                <p className="text-3xl font-bold text-blue-600">{adminStats.admins}</p>
                <p className="text-sm text-blue-700 mt-1">Total administrators</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Teacher Accounts</h3>
                <p className="text-3xl font-bold text-green-600">{adminStats.teachers}</p>
                <p className="text-sm text-green-700 mt-1">Total teachers</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-purple-600">245</p>
                <p className="text-sm text-purple-700 mt-1">Active students</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Total Classes</h3>
                <p className="text-3xl font-bold text-orange-600">12</p>
                <p className="text-sm text-orange-700 mt-1">Active classes</p>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">Messages feature coming soon...</p>
            </div>
          </div>
        );

      case 'student-account':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Accounts</h2>
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-500">Student management feature coming soon...</p>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports</h2>
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500">Reports feature coming soon...</p>
            </div>
          </div>
        );

      case 'settings':
        return <AdminSettings />;

      case 'create-admin':
        return (isSuper || isAdmin) ? (
          <AdminRegistrationForm 
            onSuccess={handleAdminCreated}
            onCancel={() => setActiveTab('home')}
          />
        ) : (
          <div className="bg-red-50 border border-red-300 rounded-md p-4">
            <p className="text-red-800">Insufficient permissions to create admin accounts.</p>
          </div>
        );

      case 'create-teacher':
        return (
          <TeacherRegistrationForm 
            onSuccess={handleTeacherCreated}
            onCancel={() => setActiveTab('home')}
          />
        );

      case 'manage-admins':
        return (isSuper || isAdmin) ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage Administrators</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {admin.admin_profile?.admin_level || 'admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-300 rounded-md p-4">
            <p className="text-red-800">Insufficient permissions to manage admin accounts.</p>
          </div>
        );

      case 'manage-teachers':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{teacher.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {teacher.teacher_profile?.employee_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {teacher.teacher_profile?.subjects || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPageTitle = (tab: TabType) => {
    switch (tab) {
      case 'home': return 'Dashboard Overview';
      case 'messages': return 'Messages';
      case 'student-account': return 'Student Accounts';
      case 'reports': return 'Reports';
      case 'create-admin': return 'Create Admin Account';
      case 'create-teacher': return 'Create Teacher Account';
      case 'manage-admins': return 'Manage Administrators';
      case 'manage-teachers': return 'Manage Teachers';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = (tab: TabType) => {
    switch (tab) {
      case 'home': return 'Welcome to your administration dashboard';
      case 'create-admin': return 'Create new administrator accounts for your institution';
      case 'create-teacher': return 'Create new teacher accounts and assign permissions';
      case 'manage-admins': return 'View and manage existing administrator accounts';
      case 'manage-teachers': return 'View and manage existing teacher accounts';
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderTabContent()
      )}
      
      {/* First-time password change modal */}
      {showPasswordChange && (
        <AdminFirstTimePasswordChange
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </DashboardLayout>
  );
}