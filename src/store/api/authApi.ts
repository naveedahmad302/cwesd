import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  ILoginPayload,
  ILoginResponse,
  IChangePasswordPayload,
  ISignupPayload,
  ISignupResponse,
  User,
} from '../../types/user';
import { API_ENDPOINTS } from '../endpoints';
import { baseQueryWithReauth } from './middleware';
import { setCredentials } from '../slices/userSlice';

function normalizeLoginUser(raw: ILoginResponse['user']): User {
  return {
    id: raw._id,
    name: raw.name,
    fatherName: raw.fatherName,
    cnicPicFront: raw.cnicPicFront,
    cnicPicBack: raw.cnicPicBack,
    age: raw.age,
    qualification: raw.qualification,
    address: raw.address,
    permanentAddress: raw.permanentAddress,
    contactNumber: raw.contactNumber,
    email: raw.email,
    picture: raw.picture,
    role: raw.role,
    enrolledCourses: raw.enrolledCourses,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    moodleDetails: raw.moodleDetails,
    presence: raw.presence,
    googleAuth: raw.googleAuth,
  };
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User'],
  endpoints: build => ({
    login: build.mutation<ILoginResponse, ILoginPayload>({
      query: credentials => ({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.accessToken && data?.user) {
            dispatch(
              setCredentials({
                accessToken: data.accessToken,
                user: normalizeLoginUser(data.user),
              }),
            );
          }
        } catch {
          // Error handled in component
        }
      },
    }),
    logout: build.mutation<{ message: string }, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
    signup: build.mutation<ISignupResponse, ISignupPayload>({
      query: body => ({
        url: API_ENDPOINTS.AUTH.SIGNUP,
        method: 'POST',
        body,
      }),
    }),
    setForgotPassword: build.mutation<
      { message: string },
      { email?: string; phone?: string; password: string; verificationToken: string }
    >({
      query: body => ({
        url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: 'POST',
        body,
      }),
    }),
    changePassword: build.mutation<{ message: string }, IChangePasswordPayload>({
      query: body => ({
        url: API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: 'POST',
        body,
      }),
    }),
    deleteAccount: build.mutation<{ message: string }, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.DELETE_ACCOUNT,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useSignupMutation,
  useSetForgotPasswordMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
} = authApi;
