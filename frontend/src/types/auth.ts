export interface ParentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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
  user_type?: 'parent' | 'teacher';
}

export interface TeacherProfile {
  employee_id: string;
  subjects: string;
  qualification: string;
  experience_years: number;
  hire_date: string;
  is_active: boolean;
  password_change_required: boolean;
  created_at: string;
}

export interface TeacherPasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  user_type: 'parent' | 'teacher' | 'admin';
  is_email_verified: boolean;
  is_active: boolean;
  date_joined?: string;
  teacher_profile?: TeacherProfile;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginError {
  error: string;
  user_type_mismatch?: boolean;
  actual_user_type?: 'parent' | 'teacher' | 'admin';
  expected_user_type?: 'parent' | 'teacher';
}