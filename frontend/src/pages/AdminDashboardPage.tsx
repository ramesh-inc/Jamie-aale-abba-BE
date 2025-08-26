import { useState, useEffect } from 'react';
import { AuthTokenManager } from '../utils/auth';
import AdminRegistrationForm from '../components/auth/AdminRegistrationForm';
import TeacherRegistrationForm from '../components/auth/TeacherRegistrationForm';
import AdminFirstTimePasswordChange from '../components/auth/AdminFirstTimePasswordChange';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProgressChart from '../components/dashboard/ProgressChart';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import AdminSettings from '../components/settings/AdminSettings';
import ClassManagement from '../components/admin/ClassManagement';
import { adminApi } from '../services/api';
import type { AdminUser, TeacherUser } from '../types/auth';

type TabType = 'home' | 'messages' | 'student-account' | 'reports' | 'create-admin' | 'create-teacher' | 'manage-admins' | 'manage-teachers' | 'settings' | 'class-management';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 mx-auto">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Action</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationModalProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ message, type, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          {type === 'success' ? (
            <div className="flex-shrink-0 w-10 h-10 mx-auto">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-10 h-10 mx-auto">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className={`text-lg font-medium ${type === 'success' ? 'text-green-900' : 'text-red-900'} mb-2`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditTeacherModalProps {
  teacher: TeacherUser;
  onSave: (updatedTeacher: TeacherUser) => void;
  onCancel: () => void;
}

const EditTeacherModal: React.FC<EditTeacherModalProps> = ({ teacher, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    email: teacher.email,
    phone_number: teacher.phone_number || '',
    employee_id: teacher.teacher_profile?.employee_id || '',
    subjects: teacher.teacher_profile?.subjects || '',
    qualification: teacher.teacher_profile?.qualification || '',
    experience_years: teacher.teacher_profile?.experience_years || 0,
    hire_date: teacher.teacher_profile?.hire_date || '',
    is_active: teacher.is_active
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTeacher: TeacherUser = {
      ...teacher,
      first_name: formData.first_name,
      last_name: formData.last_name,
      full_name: `${formData.first_name} ${formData.last_name}`,
      email: formData.email,
      phone_number: formData.phone_number,
      is_active: formData.is_active,
      teacher_profile: {
        ...teacher.teacher_profile!,
        employee_id: formData.employee_id,
        subjects: formData.subjects,
        qualification: formData.qualification,
        experience_years: formData.experience_years,
        hire_date: formData.hire_date,
      }
    };
    
    onSave(updatedTeacher);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Teacher</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                Experience (Years)
              </label>
              <input
                type="number"
                id="experience_years"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="subjects" className="block text-sm font-medium text-gray-700">
              Subjects
            </label>
            <input
              type="text"
              id="subjects"
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Mathematics, Physics, Chemistry"
              required
            />
          </div>

          <div>
            <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">
              Qualification
            </label>
            <input
              type="text"
              id="qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Master of Science in Mathematics"
            />
          </div>

          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">
              Hire Date
            </label>
            <input
              type="date"
              id="hire_date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active Account
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [adminStats, setAdminStats] = useState({ admins: 0, teachers: 0 });
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

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

      // Filter admins for Manage Admins section:
      // - Show all admins (active and inactive) for management purposes
      // - This allows admins to see who has been deactivated
      setAdmins(adminResponse.admins);
      
      // Filter teachers for Manage Teachers section:
      // - Show if teacher_profile.is_active is true (regardless of user is_active)
      // - Hide if teacher_profile.is_active is false (completely deleted)
      const visibleTeachers = teacherResponse.teachers.filter(teacher => 
        teacher.teacher_profile?.is_active !== false
      );
      setTeachers(visibleTeachers);
      
      // Count only active admins and teachers for stats
      const activeAdminsCount = adminResponse.admins.filter(admin => admin.is_active).length;
      const activeTeachersCount = teacherResponse.teachers.filter(teacher => 
        teacher.is_active && teacher.teacher_profile?.is_active
      ).length;
      
      setAdminStats({
        admins: activeAdminsCount,
        teachers: activeTeachersCount,
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

  const handleEditTeacher = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setEditingTeacher(teacher);
      setShowEditTeacherModal(true);
    }
  };

  const handleDeleteTeacher = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    const teacherName = teacher ? teacher.full_name : 'this teacher';
    
    setConfirmMessage(`Are you sure you want to delete "${teacherName}"? This will deactivate their account and they will no longer be able to access the system.`);
    setConfirmAction(() => async () => {
      try {
        await adminApi.deleteTeacher(teacherId);
        loadStats(); // Refresh the data
        showNotification(`Teacher "${teacherName}" has been successfully deleted.`, 'success');
        
        // Force a page refresh to ensure all components get updated data
        // This ensures that any cached teacher data in other components is refreshed
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Give time for the success message to be seen
      } catch (error) {
        console.error('Error deleting teacher:', error);
        showNotification('Failed to delete teacher. Please try again.', 'error');
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteAdmin = (adminId: number) => {
    const admin = admins.find(a => a.id === adminId);
    const adminName = admin ? admin.full_name : 'this administrator';
    
    // Check if trying to delete super admin or self
    if (admin?.is_superuser || admin?.admin_profile?.admin_level === 'super_admin') {
      showNotification('Cannot delete super administrator accounts.', 'error');
      return;
    }
    
    if (admin?.id === user?.id) {
      showNotification('Cannot delete your own account.', 'error');
      return;
    }
    
    setConfirmMessage(`Are you sure you want to delete "${adminName}"? This will deactivate their account and they will no longer be able to access the system.`);
    setConfirmAction(() => async () => {
      try {
        await adminApi.deleteAdmin(adminId);
        loadStats(); // Refresh the data
        showNotification(`Administrator "${adminName}" has been successfully deleted.`, 'success');
        
        // Force a page refresh to ensure all components get updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Give time for the success message to be seen
      } catch (error: any) {
        console.error('Error deleting admin:', error);
        const errorMessage = error.response?.data?.error || 'Failed to delete administrator. Please try again.';
        showNotification(errorMessage, 'error');
      }
    });
    setShowConfirmModal(true);
  };

  const handleUpdateTeacher = async (updatedTeacher: TeacherUser) => {
    try {
      await adminApi.updateTeacher(updatedTeacher.id, {
        firstName: updatedTeacher.first_name,
        lastName: updatedTeacher.last_name,
        email: updatedTeacher.email,
        phoneNumber: updatedTeacher.phone_number,
        subjects: updatedTeacher.teacher_profile?.subjects,
        employeeId: updatedTeacher.teacher_profile?.employee_id,
        qualification: updatedTeacher.teacher_profile?.qualification,
        experienceYears: updatedTeacher.teacher_profile?.experience_years,
        hireDate: updatedTeacher.teacher_profile?.hire_date,
        isActive: updatedTeacher.is_active,
      });
      loadStats(); // Refresh the data
      setShowEditTeacherModal(false);
      setEditingTeacher(null);
      showNotification(`Teacher "${updatedTeacher.full_name}" has been successfully updated.`, 'success');
      
      // If teacher status was changed, refresh page to update all components
      if (updatedTeacher.is_active !== teachers.find(t => t.id === updatedTeacher.id)?.is_active) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      showNotification('Failed to update teacher. Please try again.', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
      setShowConfirmModal(false);
      setConfirmAction(null);
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
      case 'class-management':
        return <ClassManagement />;

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* Only show delete button for non-super admins and not for self */}
                        {!admin.is_superuser && 
                         admin.admin_profile?.admin_level !== 'super_admin' && 
                         admin.id !== user?.id && 
                         admin.is_active && (
                          <button 
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Deactivate admin account"
                          >
                            Delete
                          </button>
                        )}
                        {/* Show disabled state for super admins or self */}
                        {(admin.is_superuser || 
                          admin.admin_profile?.admin_level === 'super_admin' || 
                          admin.id === user?.id || 
                          !admin.is_active) && (
                          <span className="text-gray-400 cursor-not-allowed" title={
                            admin.is_superuser || admin.admin_profile?.admin_level === 'super_admin' 
                              ? 'Cannot delete super admin' 
                              : admin.id === user?.id 
                              ? 'Cannot delete your own account' 
                              : 'Account already inactive'
                          }>
                            Delete
                          </span>
                        )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                          (teacher.is_active && teacher.teacher_profile?.is_active) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(teacher.is_active && teacher.teacher_profile?.is_active) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditTeacher(teacher.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className={`${
                            (teacher.is_active && teacher.teacher_profile?.is_active)
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!(teacher.is_active && teacher.teacher_profile?.is_active)}
                        >
                          Delete
                        </button>
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
      case 'class-management': return 'Class Management';
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
      case 'class-management': return 'Manage nursery classes, students, and teacher assignments';
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
      
      {/* Edit Teacher Modal */}
      {showEditTeacherModal && editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          onSave={handleUpdateTeacher}
          onCancel={() => {
            setShowEditTeacherModal(false);
            setEditingTeacher(null);
          }}
        />
      )}
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />
      )}
      
      {/* Notification Modal */}
      {notification && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </DashboardLayout>
  );
}