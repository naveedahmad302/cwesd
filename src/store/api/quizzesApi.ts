import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  QuizListResponse,
  QuizDetailResponse,
  CreateQuizPayload,
} from '../../types/quizzes.types';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';

export const quizzesApi = createApi({
  reducerPath: 'quizzesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Quizzes', 'Quiz'],
  endpoints: build => ({
    getQuizzes: build.query<QuizListResponse, void>({
      query: () => ({ url: API_ENDPOINTS.QUIZZES.LIST }),
      providesTags: ['Quizzes'],
    }),
    getQuizById: build.query<QuizDetailResponse, string>({
      query: quizId => ({ url: API_ENDPOINTS.QUIZZES.BY_ID(quizId) }),
      providesTags: (_result, _error, quizId) => [{ type: 'Quiz', id: quizId }],
    }),
    createQuiz: build.mutation<{ success?: boolean; data?: unknown }, CreateQuizPayload>({
      query: body => ({
        url: API_ENDPOINTS.QUIZZES.LIST,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Quizzes'],
    }),
    startAttempt: build.mutation<unknown, { quizId: string; studentId: string }>({
      query: ({ quizId, studentId }) => ({
        url: API_ENDPOINTS.QUIZZES.ATTEMPT(quizId),
        method: 'POST',
        body: { studentId },
      }),
    }),
    submitQuiz: build.mutation<
      unknown,
      { quizId: string; studentId: string; answers: number[] }
    >({
      query: ({ quizId, studentId, answers }) => ({
        url: API_ENDPOINTS.QUIZZES.SUBMIT(quizId),
        method: 'PUT',
        body: { studentId, answers },
      }),
      invalidatesTags: ['Quizzes', 'Quiz'],
    }),
  }),
});

export const {
  useGetQuizzesQuery,
  useLazyGetQuizzesQuery,
  useGetQuizByIdQuery,
  useLazyGetQuizByIdQuery,
  useCreateQuizMutation,
  useStartAttemptMutation,
  useSubmitQuizMutation,
} = quizzesApi;
