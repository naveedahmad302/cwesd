import { persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
// import createSensitiveStorage from 'redux-persist-sensitive-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

import profile, { IUserSliceState } from './userSlice';
import appData, { IAppDataState } from './appData';
import {
  authApi,
  usersApi,
  coursesApi,
  quizzesApi,
  teacherApi,
  moodleApi,
  messagesApi,
} from '../api';

export interface PersistConfigI<T = undefined> {
  key: string;
  storage: any;
  whitelist?: Array<keyof T>;
  blacklist?: Array<keyof T>;
}

const userPersistConfig: PersistConfigI<IUserSliceState> = {
  key: 'user',
  storage: AsyncStorage,
};
const appDataPersistConfig: PersistConfigI<IAppDataState> = {
  key: 'appData',
  storage: AsyncStorage,
  blacklist: ['selectedCourse'], // selectedCourse is in-memory only; screen loads from Redux, not from persisted storage
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, profile),
  appData: persistReducer(appDataPersistConfig, appData),
  [authApi.reducerPath]: authApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [coursesApi.reducerPath]: coursesApi.reducer,
  [quizzesApi.reducerPath]: quizzesApi.reducer,
  [teacherApi.reducerPath]: teacherApi.reducer,
  [moodleApi.reducerPath]: moodleApi.reducer,
  [messagesApi.reducerPath]: messagesApi.reducer,
});

export default rootReducer;
