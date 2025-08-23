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

// Convenience exports
export const registerParent = authApi.registerParent;
export const loginUser = authApi.login;
export const verifyEmail = authApi.verifyEmail;
export const resendVerification = authApi.resendVerification;

export default api;