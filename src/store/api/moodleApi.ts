import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  MoodleCourseSectionsApiResponse,
  AssignmentSubmissionResponse,
} from '../../types/moodle.types';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

type AssignmentDraftSubmitPayload = FormData | Record<string, unknown>;

export const moodleApi = createApi({
  reducerPath: 'moodleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Moodle'],
  endpoints: build => ({
    getCourseSections: build.query<MoodleCourseSectionsApiResponse, string>({
      query: moodleId => ({ url: API_ENDPOINTS.MOODLE.COURSE_SECTIONS(moodleId) }),
      providesTags: (_result, _error, moodleId) => [{ type: 'Moodle', id: moodleId }],
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
      { moodleId: string; sectionNumber: string; instance: string; data: AssignmentDraftSubmitPayload }
    >({
      query: ({ moodleId, sectionNumber, instance, data }) => ({
        url: API_ENDPOINTS.MOODLE.ASSIGNMENT_SUBMIT(moodleId, sectionNumber, instance),
        method: 'POST',
        body: data,
        formData: true,
        forceFormData: true,
      }),
      invalidatesTags: (_result, _error, { moodleId, sectionNumber, instance }) => [
        { type: 'Moodle', id: `${moodleId}-${sectionNumber}-${instance}` },
      ],
    }),
  }),
});

export const {
  useGetCourseSectionsQuery,
  useLazyGetCourseSectionsQuery,
  useGetMySubmissionQuery,
  useLazyGetMySubmissionQuery,
  useGetSubmissionsQuery,
  useLazyGetSubmissionsQuery,
  useDraftAssignmentMutation,
  useSubmitAssignmentMutation,
} = moodleApi;
