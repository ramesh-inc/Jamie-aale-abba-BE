export interface ParentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredLanguage: 'en' | 'si' | 'ta';
  password: string;
  confirmPassword: string;
}

export interface ApiError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

export interface RegistrationResponse {
  message: string;
  user_id: number;
  email: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  preferred_language: string;
  is_active: boolean;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: User;
}