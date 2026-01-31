import axios from 'axios';
import { API_BASE_URL } from '@env';

// Create centralized Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      console.log('3333333 - FormData detected, setting multipart/form-data')
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (config.data && typeof config.data === 'object') {
      console.log('4444444 - Object detected, setting application/json')
      config.headers['Content-Type'] = 'application/json';
    }
    // Log the full config for debugging
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      dataType: config.data?.constructor?.name,
    });
    // You can add token logic here if needed in the future
    return config;
  },
  (error) => {
    console.log('666666', error)
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    console.log('Response error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
    });
    
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

// Helper functions for assignments endpoints
export const assignmentsAPI = {
  getMySubmission: (moodleId: string, sectionNumber: string, instance: string) =>
    apiClient.get(`/api/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/my-submission`),
  
  getSubmissions: (moodleId: string, sectionNumber: string, instance: string) =>
    apiClient.get(`/api/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/submissions`),
  
  draftAssignment: (moodleId: string, sectionNumber: string, instance: string, data: any) =>
    apiClient.post(`/api/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/draft`, data),
  
  submitAssignment: (moodleId: string, sectionNumber: string, instance: string, data: any) =>
    apiClient.post(`/api/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/submit`, data),
};

// Helper function to transform Moodle submission response to component format
export const transformSubmissionData = (apiResponse: any) => {
  if (!apiResponse?.success) {
    return {
      submissionStatus: 'new' as const,
      submittedFiles: [],
      submissionDate: '',
      lastModifiedDate: '',
    };
  }

  const { lastAttempt } = apiResponse;
  const submittedFiles: any[] = [];

  // Extract files from submission plugins
  if (lastAttempt?.submission?.plugins) {
    lastAttempt.submission.plugins.forEach((plugin: any) => {
      if (plugin.type === 'file' && plugin.fileareas) {
        plugin.fileareas.forEach((filearea: any) => {
          if (filearea.files && filearea.files.length > 0) {
            filearea.files.forEach((file: any) => {
              submittedFiles.push({
                id: file.filename || `file-${Date.now()}`,
                name: file.filename,
                size: formatFileSize(file.filesize),
                type: file.mimetype || 'application/octet-stream',
                url: file.fileurl,
              });
            });
          }
        });
      }
    });
  }

  // Format dates
  const submissionDate = lastAttempt?.submission?.timecreated 
    ? new Date(lastAttempt.submission.timecreated * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  const lastModifiedDate = lastAttempt?.submission?.timemodified
    ? new Date(lastAttempt.submission.timemodified * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  return {
    submissionStatus: apiResponse.status as 'new' | 'submitted' | 'draft',
    submittedFiles,
    submissionDate,
    lastModifiedDate,
  };
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
