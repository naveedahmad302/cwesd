import axios from 'axios';
import { API_BASE_URL } from '@env';

// Create centralized Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // You can add token logic here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.error('Unauthorized access - token may be expired');
    }
    return Promise.reject(error);
  }
);

// Helper functions for auth endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
  
  logout: () =>
    apiClient.post('/api/auth/logout', {}),
};

// Helper functions for user endpoints
export const userAPI = {
  getTeachers: () =>
    apiClient.get('/api/users/teachers'),
};

export default apiClient;
