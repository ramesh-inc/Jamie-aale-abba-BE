import type { User } from '../types/auth';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export class AuthTokenManager {
  // Store tokens and user data
  static setTokens(accessToken: string, refreshToken: string, user: User): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Get access token
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // Get refresh token
  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Get user data
  static getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Clear all auth data
  static clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Check if token is expired (basic check - in production you'd decode JWT)
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true; // If we can't decode, assume expired
    }
  }

  // Auto-logout if token is expired
  static checkTokenExpiry(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    if (this.isTokenExpired(token)) {
      this.clearAuth();
      return false;
    }
    return true;
  }
}

// Auth hook for React components
export const useAuth = () => {
  const user = AuthTokenManager.getUser();
  const isAuthenticated = AuthTokenManager.isAuthenticated();
  
  const login = (accessToken: string, refreshToken: string, userData: User) => {
    AuthTokenManager.setTokens(accessToken, refreshToken, userData);
  };

  const logout = () => {
    AuthTokenManager.clearAuth();
    window.location.href = '/login';
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkTokenExpiry: AuthTokenManager.checkTokenExpiry,
  };
};

export default AuthTokenManager;