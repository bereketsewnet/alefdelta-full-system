import axios from 'axios';

// Ensure API_URL always ends with /api
const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sacco-api.alefdelta.com/api';
  // Remove trailing slash if present
  const cleanUrl = baseUrl.replace(/\/$/, '');
  // Add /api if not already present
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Don't attach token for login or public endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/otp')) {
      return config;
    }

    const userStr = localStorage.getItem('user_session');
    if (userStr) {
      try {
        const session = JSON.parse(userStr);
        if (session.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('user_session');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any; // We'll decode this from the token or fetch it
}

export default api;

