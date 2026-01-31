import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { performCompleteLogout } from '../../utils';
import { E_APP_ENV } from '../../types';
import { showInfoToast } from '../../utils';

const CONFIG = {
  DEV: {
    ENV: E_APP_ENV.DEV,
    API_BASE_URL: 'https://cwesd.onrender.com/api',
  },
  PROD: {
    ENV: E_APP_ENV.PROD,
    API_BASE_URL: 'https://cwesd.onrender.com/api',
  },
};

export const APP_CONFIG = {
  ...CONFIG.DEV,
  // ...CONFIG.PROD,
};

const safeSerialize = (data: any): any => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
};

const baseQuery = fetchBaseQuery({
  baseUrl: APP_CONFIG.API_BASE_URL,
  timeout: 300000, // 5 minutes timeout
  prepareHeaders: (headers: any, { getState }: { getState: any }) => {
    const token = getState()?.user?.accessToken;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  const requestUrl = typeof args === 'string' ? args : args.url;
  const requestBody = typeof args === 'string' ? undefined : args.body;
  const requestParams =
    typeof args === 'string' ? undefined : (args as any).params;

  if (__DEV__) {
    console.log(
      '🌐 Network Request Started ====>>> ',
      requestUrl,
      '\nBody: ',
      requestBody ? safeSerialize(requestBody) : undefined,
      '\nParams: ',
      requestParams ? safeSerialize(requestParams) : undefined,
    );
  }

  try {
    let result = await baseQuery(args, api, extraOptions);
    const requestEndTime = Date.now();
    const duration = requestEndTime - requestStartTime;
    const isAuthEndpoint =
      typeof requestUrl === 'string' &&
      (requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/verify-otp'));

    // Handle 401 errors
    if (result.error && result.error.status === 401 && !isAuthEndpoint) {
      showInfoToast('Session expired, please login again');
      performCompleteLogout({ callLogoutApi: false });
    }

    // Enhanced error handling
    if (result.error) {
      console.error('❌ Network Request Error', {
        requestId,
        error: result.error,
        duration,
        timestamp: new Date().toISOString(),
      });

      result.error = {
        ...result.error,
        status: (result?.error?.data as any)?.status || result.error.status,
        message:
          (result.error.data as any)?.message ||
          (result.error.data as any)?.error ||
          'Something went wrong',
      } as any;

    }

    if (__DEV__) {
      console.log(
        '✅ Network Request Completed ===>>>',
        requestUrl,
        '\nResult: ',
        result.error ? safeSerialize(result.error) : safeSerialize(result.data),
        '\nDuration: ',
        duration,
      );
    }

    return result;
  } catch (error) {
    const requestEndTime = Date.now();
    const duration = requestEndTime - requestStartTime;

    if (__DEV__) {
      console.error('💥 Network Request Exception', {
        requestId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        fullError: safeSerialize(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    throw error;
  }
};
