import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  MoodleCourseSectionsApiResponse,
  AssignmentSubmissionResponse,
} from '../../types/moodle.types';
import { API_ENDPOINTS } from '../endpoints';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';

type AssignmentDraftSubmitPayload = FormData | Record<string, unknown>;

// Moodle-specific base query with proper authentication
const moodleBaseQuery = fetchBaseQuery({
  baseUrl: 'https://cwesd.onrender.com/api',
  timeout: 300000,
  prepareHeaders: (headers: any, { getState }: { getState: any }) => {
    const token = getState()?.user?.accessToken;
    
    if (token) {
      // Moodle APIs typically use different authentication
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('moodlewsrestformat', 'json');
    }
    
    return headers;
  },
});

export const moodleApi = createApi({
  reducerPath: 'moodleApi',
  baseQuery: moodleBaseQuery,
  tagTypes: ['Moodle'],
  endpoints: build => ({
    getCourseSections: build.query<MoodleCourseSectionsApiResponse, string>({
      query: moodleId => ({ url: API_ENDPOINTS.MOODLE.COURSE_SECTIONS(moodleId) }),
      providesTags: (_result, _error, moodleId) => [{ type: 'Moodle', id: moodleId }],
    }),
    getCourseSectionContents: build.query<any, { courseId: string; sectionNumber: string }>({
      query: ({ courseId, sectionNumber }) => ({ 
        url: API_ENDPOINTS.MOODLE.COURSE_SECTION_CONTENTS(courseId, sectionNumber) 
      }),
      providesTags: (_result, _error, { courseId, sectionNumber }) => [{ 
        type: 'Moodle', 
        id: `${courseId}-${sectionNumber}-contents` 
      }],
    }),
    getMySubmission: build.query<
      AssignmentSubmissionResponse,
      { moodleId: string; sectionNumber: string; instance: string }
    >({
      query: ({ moodleId, sectionNumber, instance }) => ({
        url: API_ENDPOINTS.MOODLE.ASSIGNMENT_MY_SUBMISSION(moodleId, sectionNumber, instance),
      }),
      providesTags: (_result, _error, { moodleId, sectionNumber, instance }) => [
        { type: 'Moodle', id: `${moodleId}-${sectionNumber}-${instance}` },
      ],
    }),
    getSubmissions: build.query<
      unknown,
      { moodleId: string; sectionNumber: string; instance: string }
    >({
      query: ({ moodleId, sectionNumber, instance }) => ({
        url: API_ENDPOINTS.MOODLE.ASSIGNMENT_SUBMISSIONS(moodleId, sectionNumber, instance),
      }),
    }),
    getAssignments: build.query<
      any,
      { courseId: string; sectionNumber: string; courseIds?: string; includenotenrolled?: boolean }
    >({
      query: ({ courseId, sectionNumber, courseIds, includenotenrolled }) => {
        let url = API_ENDPOINTS.MOODLE.GET_ASSIGNMENTS(courseId, sectionNumber);
        const params = new URLSearchParams();
        
        if (courseIds) params.append('courseIds', courseIds);
        if (includenotenrolled !== undefined) params.append('includenotenrolled', includenotenrolled.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        return { url };
      },
      providesTags: (_result, _error, { courseId, sectionNumber }) => [
        { type: 'Moodle', id: `${courseId}-${sectionNumber}-assignments` }
      ],
    }),
    draftAssignment: build.mutation<
      { success?: boolean; message?: string; data?: unknown },
      { moodleId: string; sectionNumber: string; instance: string; data: AssignmentDraftSubmitPayload }
    >({
      query: ({ moodleId, sectionNumber, instance, data }) => ({
        url: API_ENDPOINTS.MOODLE.ASSIGNMENT_DRAFT(moodleId, sectionNumber, instance),
        method: 'POST',
        body: data,
        formData: true,
        forceFormData: true,
      }),
      invalidatesTags: (_result, _error, { moodleId, sectionNumber, instance }) => [
        { type: 'Moodle', id: `${moodleId}-${sectionNumber}-${instance}` },
      ],
    }),
    submitAssignment: build.mutation<
      { success?: boolean; message?: string; data?: { status?: string; submittedAt?: string } },
      { moodleId: string; sectionNumber: string; instance: string; data: AssignmentDraftSubmitPayload; params?: { id?: string } }
    >({
      query: ({ moodleId, sectionNumber, instance, data, params }) => {
        const baseUrl = API_ENDPOINTS.MOODLE.ASSIGNMENT_SUBMIT(moodleId, sectionNumber, instance);
        const url = params?.id ? `${baseUrl}?id=${params.id}` : baseUrl;
        
        return {
          url,
          method: 'POST',
          body: data,
          formData: true,
          forceFormData: true,
        };
      },
      invalidatesTags: (_result, _error, { moodleId, sectionNumber, instance }) => [
        { type: 'Moodle', id: `${moodleId}-${sectionNumber}-${instance}` },
      ],
    }),
  }),
});

export const {
  useGetCourseSectionsQuery,
  useLazyGetCourseSectionsQuery,
  useGetCourseSectionContentsQuery,
  useLazyGetCourseSectionContentsQuery,
  useGetMySubmissionQuery,
  useLazyGetMySubmissionQuery,
  useGetSubmissionsQuery,
  useLazyGetSubmissionsQuery,
  useGetAssignmentsQuery,
  useLazyGetAssignmentsQuery,
  useDraftAssignmentMutation,
  useSubmitAssignmentMutation,
} = moodleApi;
