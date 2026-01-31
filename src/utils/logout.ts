import { store } from '../store';
import { resetUserState } from '../store/slices/userSlice';
import {
  authApi,
  usersApi,
  coursesApi,
  quizzesApi,
  teacherApi,
  moodleApi,
  messagesApi,
} from '../store/api';

/**
 * Complete logout utility – calls logout API and resets all API caches.
 */
export const performCompleteLogout = async (
  options: {
    callLogoutApi?: boolean;
    resetApiCaches?: boolean;
    onLogoutComplete?: () => void;
  } = {},
) => {
  const {
    callLogoutApi = true,
    resetApiCaches = true,
    onLogoutComplete,
  } = options;

  try {
    if (callLogoutApi) {
      store.dispatch(authApi.endpoints.logout.initiate()).catch((err: unknown) => {
        console.warn('Logout API call failed:', err);
      });
    }

    if (resetApiCaches) {
      store.dispatch(authApi.util.resetApiState());
      store.dispatch(usersApi.util.resetApiState());
      store.dispatch(coursesApi.util.resetApiState());
      store.dispatch(quizzesApi.util.resetApiState());
      store.dispatch(teacherApi.util.resetApiState());
      store.dispatch(moodleApi.util.resetApiState());
      store.dispatch(messagesApi.util.resetApiState());
    }

    store.dispatch(resetUserState());

    if (onLogoutComplete) {
      onLogoutComplete();
    }

    console.log('✅ Complete logout successful');
  } catch (error) {
    console.error('❌ Logout failed:', error);
    throw error;
  }
};
