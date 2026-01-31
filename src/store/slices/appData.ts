import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SelectedCourse {
  id: string;
  title: string;
  instructor?: string;
  lessons?: number;
  duration?: string;
  level?: string;
  tags?: string[];
  status?: string;
  completedDate?: string;
  progress?: number;
  headerColor?: string;
  moodleId?: number;
  [key: string]: unknown;
}

export interface IAppDataState {
  isFirstTime: boolean;
  selectedCourse: SelectedCourse | null;
}

const initialState: IAppDataState = {
  isFirstTime: true,
  selectedCourse: null,
};

export const appDataSlice = createSlice({
  name: 'appData',
  initialState,
  reducers: {
    setFirstTimeAction: (state, action: PayloadAction<boolean>) => {
      state.isFirstTime = action.payload;
    },
    setSelectedCourse: (state, action: PayloadAction<SelectedCourse | null>) => {
      state.selectedCourse = action.payload;
    },
    clearSelectedCourse: state => {
      state.selectedCourse = null;
    },
  },
});

export const {
  setFirstTimeAction,
  setSelectedCourse,
  clearSelectedCourse,
} = appDataSlice.actions;

export default appDataSlice.reducer;
