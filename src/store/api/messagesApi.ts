import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  SendMessagePayload,
  ChatResponse,
  Message,
  GetChatResponse,
  SendMessageResponse,
} from '../../types/messages.types';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';
// import { coursesApi } from './coursesApi';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Messages'],
  endpoints: build => ({
    getChat: build.query<GetChatResponse, { senderId: string; receiverId: string }>({
      query: ({ senderId, receiverId }) => ({
        url: API_ENDPOINTS.MESSAGES.CHAT_BY_USERS(senderId, receiverId),
      }),
      providesTags: (_result, _error, { senderId, receiverId }) => [
        { type: 'Messages', id: `${senderId}-${receiverId}` },
      ],
    }),
    getUserMessages: build.query<ChatResponse, string>({
      query: userId => ({ url: API_ENDPOINTS.MESSAGES.USER_MESSAGES(userId) }),
      providesTags: (_result, _error, userId) => [{ type: 'Messages', id: userId }],
    }),
    sendMessage: build.mutation<SendMessageResponse, SendMessagePayload>({
      query: body => ({
        url: API_ENDPOINTS.MESSAGES.SEND,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { senderId, receiverId }) => [
        { type: 'Messages', id: `${senderId}-${receiverId}` },
      ],
      // onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
      //   try {
      //     const { data } = await queryFulfilled;
      //     dispatch(coursesApi.util.invalidateTags(['Courses']));
      //   } catch (error) {
      //     console.error('Failed to send message:', error);
      //   }
      // },
    }),
    editMessage: build.mutation<
      SendMessageResponse,
      { senderId: string, receiverId: string, text: string, repliedTo?: string, messageId: string }
    >({
      query: ({ senderId, receiverId, text, repliedTo, messageId }) => ({
        url: API_ENDPOINTS.MESSAGES.EDIT(messageId),
        method: 'POST',
        body: { senderId, receiverId, text, repliedTo },
      }),
      invalidatesTags: ['Messages'],
    }),
    deleteMessage: build.mutation<
      { success?: boolean },
      { messageId: string; userId: string }
    >({
      query: ({ messageId, userId }) => ({
        url: API_ENDPOINTS.MESSAGES.DELETE(messageId),
        method: 'DELETE',
        body: { userId },
      }),
      invalidatesTags: ['Messages'],
    }),
    replyToMessage: build.mutation<
      { data?: Message; success?: boolean },
      { messageId: string; senderId: string; text: string }
    >({
      query: ({ messageId, senderId, text }) => ({
        url: API_ENDPOINTS.MESSAGES.REPLY(messageId),
        method: 'POST',
        body: { senderId, text },
      }),
      invalidatesTags: ['Messages'],
    }),
    clearChatMessages: build.mutation<{ success?: boolean }, { chatId: string; userId: string }>({
      query: ({ chatId, userId }) => ({
        url: API_ENDPOINTS.MESSAGES.CHAT_MESSAGES(chatId),
        method: 'DELETE',
        body: { userId },
      }),
      invalidatesTags: ['Messages'],
    }),
    deleteChat: build.mutation<{ success?: boolean }, { chatId: string; userId: string }>({
      query: ({ chatId, userId }) => ({
        url: API_ENDPOINTS.MESSAGES.CHAT(chatId),
        method: 'DELETE',
        body: { userId },
      }),
      invalidatesTags: ['Messages'],
    }),
  }),
});

export const {
  useGetChatQuery,
  useLazyGetChatQuery,
  useGetUserMessagesQuery,
  useLazyGetUserMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useReplyToMessageMutation,
  useClearChatMessagesMutation,
  useDeleteChatMutation,
} = messagesApi;
