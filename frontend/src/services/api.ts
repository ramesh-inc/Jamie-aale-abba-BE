import axios from 'axios';
import type { ParentRegistrationData, RegistrationResponse, LoginData, LoginResponse, TeacherPasswordChangeData } from '../types/auth';

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

  teacherChangePassword: async (data: TeacherPasswordChangeData) => {
    const response = await api.post('/auth/teacher/change-password/', data);
    return response.data;
  },
};

// Convenience exports
export const registerParent = authApi.registerParent;
export const loginUser = authApi.login;
export const verifyEmail = authApi.verifyEmail;
export const resendVerification = authApi.resendVerification;

export default api;