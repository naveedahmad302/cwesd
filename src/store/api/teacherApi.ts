import { createApi } from '@reduxjs/toolkit/query/react';
import type { TeacherStatsResponse } from '../../types/teacher.types';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

export const teacherApi = createApi({
  reducerPath: 'teacherApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Teacher'],
  endpoints: build => ({
    getTeacherStats: build.query<TeacherStatsResponse, void>({
      query: () => ({ url: API_ENDPOINTS.TEACHER.STATS }),
      providesTags: ['Teacher'],
    }),
  }),
});

export const { useGetTeacherStatsQuery, useLazyGetTeacherStatsQuery } = teacherApi;
