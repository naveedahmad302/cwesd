// API Endpoints (baseUrl is .../api/v1)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHANGE_PASSWORD: '/auth/change-password',
    DELETE_ACCOUNT: '/auth/delete-account',
  },

  USERS: {
    TEACHERS: '/users/teachers',
    STUDENTS: '/users/students',
    ADMINS: '/users/admins',
    UPDATE_PROFILE: (userId: string) => `/users/update/${userId}`,
  },

  COURSES: '/courses',

  QUIZZES: {
    LIST: '/quizzes',
    BY_ID: (quizId: string) => `/quizzes/${quizId}`,
    ATTEMPT: (quizId: string) => `/quizzes/${quizId}/attempt`,
    SUBMIT: (quizId: string) => `/quizzes/${quizId}/submit`,
  },

  MOODLE: {
    COURSE_SECTIONS: (moodleId: string) => `/moodle/courses/${moodleId}/sections`,
    ASSIGNMENT_MY_SUBMISSION: (moodleId: string, sectionNumber: string, instance: string) =>
      `/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/my-submission`,
    ASSIGNMENT_SUBMISSIONS: (moodleId: string, sectionNumber: string, instance: string) =>
      `/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/submissions`,
    ASSIGNMENT_DRAFT: (moodleId: string, sectionNumber: string, instance: string) =>
      `/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/draft`,
    ASSIGNMENT_SUBMIT: (moodleId: string, sectionNumber: string, instance: string) =>
      `/moodle/courses/${moodleId}/sections/${sectionNumber}/assignments/${instance}/submit`,
  },

  MESSAGES: {
    SEND: '/messages/send',
    EDIT: (messageId: string) => `/messages/edit/${messageId}`,
    DELETE: (messageId: string) => `/messages/delete/${messageId}`,
    REPLY: (messageId: string) => `/messages/reply/${messageId}`,
    CHAT_MESSAGES: (chatId: string) => `/messages/chat/${chatId}/messages`,
    CHAT: (chatId: string) => `/messages/chat/${chatId}`,
    CHAT_BY_USERS: (senderId: string, receiverId: string) => `/messages/chat/${senderId}/${receiverId}`,
    USER_MESSAGES: (userId: string) => `/messages/user/${userId}`,
  },

  TEACHER: {
    STATS: '/teacher/stats',
  },
};
