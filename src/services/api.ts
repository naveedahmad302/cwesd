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
  
  getStudents: () =>
    apiClient.get('/api/users/students'),
  
  getAdmins: () =>
    apiClient.get('/api/users/admins'),
  
  updateProfile: (userId: string, profileData: any) =>
    apiClient.put(`/api/users/update/${userId}`, profileData),
};

// Helper functions for courses endpoints
export const coursesAPI = {
  getCourses: () =>
    apiClient.get('/api/courses'),
};

// Helper functions for quizzes endpoints
export const quizzesAPI = {
  getQuizzes: () =>
    apiClient.get('/api/quizzes'),
  getQuizById: (quizId: string) =>
    apiClient.get(`/api/quizzes/${quizId}`),
  createQuiz: (quizData: any) =>
    apiClient.post('/api/quizzes', quizData),
  startAttempt: (quizId: string, studentId: string) =>
    apiClient.post(`/api/quizzes/${quizId}/attempt`, { studentId }),
  submitQuiz: (quizId: string, studentId: string, answers: number[]) =>
    apiClient.put(`/api/quizzes/${quizId}/submit`, { studentId, answers }),
};

// Helper functions for course sections endpoints
export const courseSectionsAPI = {
  getCourseSections: (moodleId: string) =>
    apiClient.get(`/api/moodle/courses/${moodleId}/sections`),
};

// Helper functions for messages endpoints
export const messagesAPI = {
  send: (senderId: string, receiverId: string, text: string, repliedTo?: string) =>
    apiClient.post('/api/messages/send', { senderId, receiverId, text, repliedTo }),
  
  edit: (messageId: string, userId: string, text: string) =>
    apiClient.post(`/api/messages/edit/${messageId}`, { userId, text }),
  
  delete: (messageId: string, userId: string) =>
    apiClient.delete(`/api/messages/delete/${messageId}`, { data: { userId } }),
  
  reply: (messageId: string, senderId: string, text: string) =>
    apiClient.post(`/api/messages/reply/${messageId}`, { senderId, text }),
  
  clearChatMessages: (chatId: string, userId: string) =>
    apiClient.delete(`/api/messages/chat/${chatId}/messages`, { data: { userId } }),
  
  deleteChat: (chatId: string, userId: string) =>
    apiClient.delete(`/api/messages/chat/${chatId}`, { data: { userId } }),
  
  getChat: (senderId: string, receiverId: string) =>
    apiClient.get(`/api/messages/chat/${senderId}/${receiverId}`),
  
  getUserMessages: (userId: string) =>
    apiClient.get(`/api/messages/user/${userId}`),
};

export default apiClient;
