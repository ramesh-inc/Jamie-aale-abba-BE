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

export interface AdminPasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  email?: string;
  user_type?: 'parent' | 'teacher' | 'admin';
  error?: string;
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
  admin_profile?: AdminProfile;
  is_staff?: boolean;
  is_superuser?: boolean;
  must_change_password?: boolean;
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

// Admin types
export interface AdminProfile {
  admin_level: 'super_admin' | 'admin' | 'moderator';
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface AdminRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  adminLevel: 'super_admin' | 'admin' | 'moderator';
  permissions?: Record<string, any>;
  isActive?: boolean;
}

export interface AdminUser extends User {
  admin_profile?: AdminProfile;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AdminResponse {
  message: string;
  admin: AdminUser;
}

// Teacher types
export interface TeacherRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  subjects: string;
  employeeId?: string;
  qualification?: string;
  experienceYears: number;
  hireDate?: string;
  isActive?: boolean;
}

export interface TeacherUser extends User {
  teacher_profile?: TeacherProfile;
}

export interface TeacherResponse {
  message: string;
  teacher: TeacherUser;
}