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
    deleteQuiz: build.mutation<{ success?: boolean }, string>({
      query: quizId => ({
        url: API_ENDPOINTS.QUIZZES.DELETE(quizId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Quizzes'],
    }),
    updateQuiz: build.mutation<{ success?: boolean; data?: unknown }, { quizId: string; data: Partial<CreateQuizPayload> }>({
      query: ({ quizId, data }) => ({
        url: API_ENDPOINTS.QUIZZES.UPDATE(quizId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Quizzes'],
    }),
    updateQuestion: build.mutation<{ success?: boolean; data?: unknown }, { 
      questionId: string; 
      data: {
        questionText: string;
        type: 'multiple_options' | 'true_false' | 'short_answer';
        options: Array<{ text: string; isCorrect: boolean }>;
        points: number;
        explanation: string;
        order: number;
      }
    }>({
      query: ({ questionId, data }) => ({
        url: API_ENDPOINTS.QUIZZES.QUESTIONS.UPDATE(questionId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Quizzes', 'Quiz'],
    }),
    addQuestion: build.mutation<{ success?: boolean; data?: unknown }, { 
      quizId: string; 
      data: {
        questionText: string;
        type: 'multiple_options' | 'true_false' | 'short_answer';
        options: Array<{ text: string; isCorrect: boolean }>;
        points: number;
        explanation: string;
        order: number;
      }
    }>({
      query: ({ quizId, data }) => ({
        url: API_ENDPOINTS.QUIZZES.QUESTIONS.ADD(quizId),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quizzes', 'Quiz'],
    }),
    deleteQuestion: build.mutation<{ success?: boolean }, string>({
      query: (questionId) => ({
        url: API_ENDPOINTS.QUIZZES.QUESTIONS.DELETE(questionId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Quizzes', 'Quiz'],
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
      { quizId: string; studentId: string; answers: Array<{questionId: string; selectedOptions: number[]}> }
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
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useUpdateQuestionMutation,
  useAddQuestionMutation,
  useDeleteQuestionMutation,
  useStartAttemptMutation,
  useSubmitQuizMutation,
} = quizzesApi;
