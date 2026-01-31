import { createApi } from '@reduxjs/toolkit/query/react';
import type { CoursesResponse } from '../../types/course';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Courses'],
  endpoints: build => ({
    getCourses: build.query<CoursesResponse, void>({
      query: () => ({ url: API_ENDPOINTS.COURSES }),
      providesTags: ['Courses'],
    }),
  }),
});

export const { useGetCoursesQuery, useLazyGetCoursesQuery } = coursesApi;
