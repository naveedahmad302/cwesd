import { createApi } from '@reduxjs/toolkit/query/react';
import type { UsersListResponse, UpdateProfilePayload } from '../../types/users.types';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

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
} = usersApi;
