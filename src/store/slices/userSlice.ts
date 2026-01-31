import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/user';

export interface IUserSliceState {
  accessToken: string | null;
  user: User | null;
  recentChatUsers: string[];
}

const initialState: IUserSliceState = {
  accessToken: null,
  user: null,
  recentChatUsers: [],
};

export const userSlice = createSlice({
  name: 'userSlice',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logoutAction: state => {
      state.accessToken = null;
      state.user = null;
      // Keep recentChatUsers on logout so they persist for next login
    },
    addRecentChatUser: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state.recentChatUsers.includes(id)) {
        state.recentChatUsers = [id, ...state.recentChatUsers].slice(0, 10);
      }
    },
    clearRecentChatUsers: state => {
      state.recentChatUsers = [];
    },
    resetUserState: () => initialState,
  },
});

export const {
  setCredentials,
  logoutAction,
  resetUserState,
  addRecentChatUser,
  clearRecentChatUsers,
} = userSlice.actions;

export default userSlice.reducer;
