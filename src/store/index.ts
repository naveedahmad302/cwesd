import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import rootReducer from './slices';
import {
  authApi,
  usersApi,
  coursesApi,
  eventsApi,
  quizzesApi,
  teacherApi,
  moodleApi,
  messagesApi,
} from './api';

// Configure the store
export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: __DEV__ ? { warnAfter: 128 } : false,
      serializableCheck: __DEV__
        ? false
        : {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredActionPaths: [
            'meta.arg',
            'payload.timestamp',
            'meta.baseQueryMeta.request',
            'meta.baseQueryMeta.response',
            'payload.navigation',
            'payload.route',
          ],
          ignoredPaths: [
            'items.dates',
            'navigation',
            'searchApi.queries',
            'searchApi.mutations',
          ],
        },
    }).concat(
      authApi.middleware,
      usersApi.middleware,
      coursesApi.middleware,
      eventsApi.middleware,
      quizzesApi.middleware,
      teacherApi.middleware,
      moodleApi.middleware,
      messagesApi.middleware,
    ),
});

// Create the persisted store
export const persistor = persistStore(store);

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
