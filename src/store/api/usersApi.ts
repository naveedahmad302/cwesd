import { createApi } from '@reduxjs/toolkit/query/react';
import type { UsersListResponse, UpdateProfilePayload, ApiUserList } from '../../types/users.types';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

export interface AnalyticsResponse {
  success: boolean;
  data: {
    course: {
      courseId: string;
      moodleId: number;
      totalActivities: number;
      completedActivities: number;
      remainingActivities: number;
      progressPercentage: number;
    };
    sections: Array<{
      sectionNumber: number;
      sectionName: string;
      totalActivities: number;
      completedActivities: number;
    }>;
    quizzes: {
      totalQuizzesGiven: number;
      totalQuizAttempts: number;
      avgQuizPercentage: number;
      remainingQuizzes: number;
    };
  };
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Teachers', 'Students', 'Admins', 'Profile'],
  endpoints: build => ({
    getTeachers: build.query<UsersListResponse, void>({
      query: () => ({ url: API_ENDPOINTS.USERS.TEACHERS }),
      providesTags: ['Teachers'],
    }),
    getStudents: build.query<UsersListResponse, void>({
      query: () => ({ url: API_ENDPOINTS.USERS.STUDENTS }),
      providesTags: ['Students'],
    }),
    getAdmins: build.query<UsersListResponse, void>({
      query: () => ({ url: API_ENDPOINTS.USERS.ADMINS }),
      providesTags: ['Admins'],
    }),
    updateProfile: build.mutation<
      { success?: boolean; data?: unknown },
      { userId: string; data: UpdateProfilePayload }
    >({
      query: ({ userId, data }) => ({
        url: API_ENDPOINTS.USERS.UPDATE_PROFILE(userId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile', 'Teachers', 'Students'],
    }),
    getAnalytics: build.query<AnalyticsResponse, void>({
      query: () => ({ url: API_ENDPOINTS.USERS.ANALYTICS }),
      providesTags: ['Profile'],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useLazyGetTeachersQuery,
  useGetStudentsQuery,
  useLazyGetStudentsQuery,
  useGetAdminsQuery,
  useLazyGetAdminsQuery,
  useUpdateProfileMutation,
  useGetAnalyticsQuery,
  useLazyGetAnalyticsQuery,
} = usersApi;
