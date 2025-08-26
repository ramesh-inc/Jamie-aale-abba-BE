import axios from 'axios';
import type { 
  ParentRegistrationData, 
  RegistrationResponse, 
  LoginData, 
  LoginResponse, 
  TeacherPasswordChangeData,
  AdminPasswordChangeData,
  AdminRegistrationData,
  TeacherRegistrationData,
  AdminResponse,
  TeacherResponse,
  PasswordResetRequestData,
  PasswordResetConfirmData,
  TokenValidationResponse
} from '../types/auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  registerParent: async (data: ParentRegistrationData): Promise<RegistrationResponse> => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phoneNumber,
      password: data.password,
      confirm_password: data.confirmPassword,
    };

    const response = await api.post('/auth/register/parent/', payload);
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email/', { token });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await api.post('/auth/resend-verification/', { email });
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', data);
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/auth/health/');
    return response.data;
  },

  parentChangePassword: async (data: any) => {
    const response = await api.post('/auth/parent/change-password/', data);
    return response.data;
  },

  teacherChangePassword: async (data: TeacherPasswordChangeData) => {
    const response = await api.post('/auth/teacher/change-password/', data);
    return response.data;
  },

  adminChangePassword: async (data: AdminPasswordChangeData) => {
    const response = await api.post('/auth/admin/change-password/', data);
    return response.data;
  },

  // Password reset functions
  requestPasswordReset: async (data: PasswordResetRequestData) => {
    const response = await api.post('/auth/forgot-password/', data);
    return response.data;
  },

  confirmPasswordReset: async (data: PasswordResetConfirmData) => {
    const response = await api.post('/auth/reset-password/', data);
    return response.data;
  },

  validateResetToken: async (token: string): Promise<TokenValidationResponse> => {
    const response = await api.get(`/auth/validate-reset-token/${token}/`);
    return response.data;
  },
};

// Admin API functions (Super Admin only)
export const adminApi = {
  // Admin management
  createAdmin: async (data: AdminRegistrationData): Promise<AdminResponse> => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phoneNumber,
      password: data.password,
      confirm_password: data.confirmPassword,
      admin_level: data.adminLevel,
      permissions: data.permissions || {},
    };

    const response = await api.post('/admin/admins/register/', payload);
    return response.data;
  },

  getAdmins: async () => {
    const response = await api.get('/admin/admins/');
    return response.data;
  },

  getAdmin: async (adminId: number) => {
    const response = await api.get(`/admin/admins/${adminId}/`);
    return response.data;
  },

  updateAdmin: async (adminId: number, data: Partial<AdminRegistrationData>) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phoneNumber,
      admin_level: data.adminLevel,
      permissions: data.permissions,
      is_active: data.isActive,
    };

    const response = await api.put(`/admin/admins/${adminId}/`, payload);
    return response.data;
  },

  deleteAdmin: async (adminId: number) => {
    const response = await api.delete(`/admin/admins/${adminId}/`);
    return response.data;
  },

  resetAdminPassword: async (adminId: number, newPassword: string, confirmPassword: string) => {
    const response = await api.post(`/admin/admins/${adminId}/reset-password/`, {
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  // Teacher management
  createTeacher: async (data: TeacherRegistrationData): Promise<TeacherResponse> => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phoneNumber,
      password: data.password,
      confirm_password: data.confirmPassword,
      subjects: data.subjects,
      employee_id: data.employeeId,
      qualification: data.qualification,
      experience_years: data.experienceYears,
      hire_date: data.hireDate,
    };

    const response = await api.post('/admin/teachers/register/', payload);
    return response.data;
  },

  getTeachers: async () => {
    const response = await api.get('/admin/teachers/');
    return response.data;
  },

  getTeacher: async (teacherId: number) => {
    const response = await api.get(`/admin/teachers/${teacherId}/`);
    return response.data;
  },

  updateTeacher: async (teacherId: number, data: Partial<TeacherRegistrationData>) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phoneNumber,
      subjects: data.subjects,
      employee_id: data.employeeId,
      qualification: data.qualification,
      experience_years: data.experienceYears,
      hire_date: data.hireDate,
      is_active: data.isActive,
    };

    const response = await api.put(`/admin/teachers/${teacherId}/`, payload);
    return response.data;
  },

  deleteTeacher: async (teacherId: number) => {
    const response = await api.delete(`/admin/teachers/${teacherId}/`);
    return response.data;
  },

  resetTeacherPassword: async (teacherId: number, newPassword: string, confirmPassword: string) => {
    const response = await api.post(`/admin/teachers/${teacherId}/reset-password/`, {
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  // Class Management
  getClasses: async (params?: any) => {
    const response = await api.get('/admin/classes/', { params });
    return response.data;
  },

  createClass: async (data: any) => {
    const response = await api.post('/admin/classes/', data);
    return response.data;
  },

  getClass: async (classId: number) => {
    const response = await api.get(`/admin/classes/${classId}/`);
    return response.data;
  },

  updateClass: async (classId: number, data: any) => {
    const response = await api.put(`/admin/classes/${classId}/`, data);
    return response.data;
  },

  deleteClass: async (classId: number) => {
    const response = await api.delete(`/admin/classes/${classId}/`);
    return response.data;
  },

  // Bulk unassignment operations for class deletion
  unassignAllStudentsFromClass: async (classId: number) => {
    const response = await api.post(`/admin/classes/${classId}/unassign-all-students/`);
    return response.data;
  },

  unassignAllTeachersFromClass: async (classId: number) => {
    const response = await api.post(`/admin/classes/${classId}/unassign-all-teachers/`);
    return response.data;
  },

  // Student Management
  getStudents: async (params?: any) => {
    const response = await api.get('/admin/students/', { params });
    return response.data;
  },

  createStudent: async (data: any) => {
    const response = await api.post('/admin/students/', data);
    return response.data;
  },

  getStudent: async (studentId: number) => {
    const response = await api.get(`/admin/students/${studentId}/`);
    return response.data;
  },

  updateStudent: async (studentId: number, data: any) => {
    const response = await api.put(`/admin/students/${studentId}/`, data);
    return response.data;
  },

  deleteStudent: async (studentId: number) => {
    const response = await api.delete(`/admin/students/${studentId}/`);
    return response.data;
  },

  // Teacher-Student Assignments
  getTeacherAssignments: async (params?: any) => {
    const response = await api.get('/admin/teacher-assignments/', { params });
    return response.data;
  },

  assignStudentsToTeacher: async (data: {
    teacher_id: number;
    class_id: number;
    student_ids: number[];
    role?: string;
  }) => {
    const response = await api.post('/admin/assign-students/', data);
    return response.data;
  },

  reassignStudents: async (data: {
    student_ids: number[];
    from_class_id?: number;
    to_class_id: number;
  }) => {
    const response = await api.post('/admin/reassign-students/', data);
    return response.data;
  },

  removeStudentAssignment: async (studentId: number) => {
    const response = await api.delete(`/admin/remove-student-assignment/${studentId}/`);
    return response.data;
  },

  assignTeacherToClass: async (data: {
    teacher_id: number;
    class_id: number;
    role?: string;
  }) => {
    const response = await api.post('/admin/assign-teacher-to-class/', data);
    return response.data;
  },

  removeTeacherFromClass: async (teacherId: number, classId: number) => {
    const response = await api.delete(`/admin/remove-teacher-from-class/${teacherId}/${classId}/`);
    return response.data;
  },

  // Dashboard Statistics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats/');
    return response.data;
  },
};

// User profile API functions (Self-service for all user types)
export const userApi = {
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile/update/', data);
    return response.data;
  },
};

// Parent Child Management API functions (Parent access only)
export const parentApi = {
  // Get all children linked to parent account
  getChildren: async () => {
    const response = await api.get('/parent/children/');
    return response.data;
  },

  // Add a new child
  addChild: async (data: {
    student_name: string;
    date_of_birth: string;
    gender: string;
    avatar_url?: string;
    medical_conditions?: string;
    relationship_type: string;
    is_primary_contact?: boolean;
    pickup_authorized?: boolean;
  }) => {
    const response = await api.post('/parent/children/add/', data);
    return response.data;
  },

  // Get detailed information about a specific child
  getChildDetails: async (childId: number) => {
    const response = await api.get(`/parent/children/${childId}/`);
    return response.data;
  },

  // Update child information
  updateChild: async (childId: number, data: any) => {
    const response = await api.put(`/parent/children/${childId}/`, data);
    return response.data;
  },

  // Remove child from parent account (removes relationship, not child record)
  removeChild: async (childId: number) => {
    const response = await api.delete(`/parent/children/${childId}/remove/`);
    return response.data;
  },

  // Get summary of all children for dashboard
  getChildSummary: async () => {
    const response = await api.get('/parent/children/summary/');
    return response.data;
  },

  // Get available classes for enrollment
  getAvailableClasses: async () => {
    const response = await api.get('/parent/available-classes/');
    return response.data;
  },

  // Request enrollment for a child in a specific class
  requestEnrollment: async (childId: number, classId: number) => {
    const response = await api.post(`/parent/children/${childId}/request-enrollment/`, {
      class_id: classId
    });
    return response.data;
  },

  // Get learning activities data for a specific child and year
  getLearningActivities: async (childId: number, year: string) => {
    const response = await api.get(`/parent/children/${childId}/learning-activities/`, {
      params: { year }
    });
    return response.data;
  },
  // Get detailed daily activities for a specific child and date
  getDailyActivities: async (childId: number, date: string) => {
    const response = await api.get(`/parent/children/${childId}/daily-activities/`, {
      params: { date }
    });
    return response.data;
  },

  // Get attendance data for a specific child and year
  getAttendanceData: async (childId: number, year: string) => {
    const response = await api.get(`/parent/children/${childId}/attendance/`, {
      params: { year }
    });
    return response.data;
  },
};

// Teacher API functions
export const teacherApi = {
  // Attendance Management
  markAttendance: async (data: {
    class_id: number;
    attendance_date: string;
    attendance_records: Array<{
      student_id: number;
      status: 'present' | 'absent' | 'late';
      notes?: string;
    }>;
  }) => {
    const response = await api.post('/teacher/attendance/mark/', data);
    return response.data;
  },

  getAttendance: async (params?: {
    class_id?: number;
    attendance_date?: string;
    student_id?: number;
  }) => {
    const response = await api.get('/teacher/attendance/', { params });
    return response.data;
  },

  updateAttendance: async (attendanceId: number, data: {
    status?: 'present' | 'absent' | 'late';
    notes?: string;
  }) => {
    const response = await api.put(`/teacher/attendance/${attendanceId}/`, data);
    return response.data;
  },

  getMyClasses: async () => {
    const response = await api.get('/teacher/my-classes/');
    return response.data;
  },

  getClassStudents: async (classId: number) => {
    const response = await api.get(`/teacher/classes/${classId}/students/`);
    return response.data;
  },

  getClassStudentsWithParents: async (classId: number) => {
    const response = await api.get(`/teacher/classes/${classId}/students-with-parents/`);
    return response.data;
  },

  getMarkedAttendanceDates: async (classId: number) => {
    const response = await api.get(`/teacher/classes/${classId}/marked-dates/`);
    return response.data;
  },

  // Learning Activities
  recordLearningActivity: async (data: {
    class_id: number;
    activity_date: string;
    activity_type: string;
    title: string;
    description?: string;
    learning_objectives?: string;
    materials_used?: string;
    duration_minutes: number;
    student_records: Array<{
      student_id: number;
      participation_level: 'high' | 'medium' | 'low';
      notes?: string;
    }>;
  }) => {
    const response = await api.post('/teacher/learning-activities/record/', data);
    return response.data;
  },

  getTeacherActivities: async (params?: {
    date?: string;
    class_id?: number;
  }) => {
    const response = await api.get('/teacher/learning-activities/', { params });
    return response.data;
  },
};

// Convenience exports
export const registerParent = authApi.registerParent;
export const loginUser = authApi.login;
export const verifyEmail = authApi.verifyEmail;
export const resendVerification = authApi.resendVerification;

export default api;