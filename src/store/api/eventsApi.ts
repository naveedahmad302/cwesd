import { createApi } from '@reduxjs/toolkit/query/react';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

export interface Event {
  _id: string;
  id: string;
  title: string;
  start: string;
  end: string;
  meetLink?: string;
  courseMoodleId: number;
  sectionMoodleId?: string;
  sectionMoodleNumber?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface EventsResponse {
  success: boolean;
  message: string;
  events: Event[];
}

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Events'],
  endpoints: build => ({
    getEvents: build.query<EventsResponse, { courseId: string }>({
      query: ({ courseId }) => ({ url: API_ENDPOINTS.EVENTS.BY_COURSE(courseId) }),
      providesTags: ['Events'],
    }),
  }),
});

export const { useGetEventsQuery, useLazyGetEventsQuery } = eventsApi;
