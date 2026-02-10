import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './middleware';

export interface Webinar {
  _id: string;
  title: string;
  start: string;
  end: string;
  meetLink: string;
  courseMoodleId: number;
  sectionMoodleNumber: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  presentCount: number;
  presentStudents: Array<{
    _id: string;
    email: string;
  }>;
}

export interface WebinarsResponse {
  success: boolean;
  webinars: Webinar[];
}

export const webinarsApi = createApi({
  reducerPath: 'webinarsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Webinars'],
  endpoints: build => ({
    getWebinars: build.query<WebinarsResponse, void>({
      query: () => '/webinars',
      providesTags: ['Webinars'],
    }),
  }),
});

export const { useGetWebinarsQuery, useLazyGetWebinarsQuery } = webinarsApi;
