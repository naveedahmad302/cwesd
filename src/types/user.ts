import { E_USER_ROLE } from "./enums";

// --- Nested types from API (raw) ---
export interface MoodleDetailsApi {
  moodleSyncStatus: string | null;
  moodleCreatedAt: string | null;
  moodleSyncError: string | null;
  moodleLastSyncAttempt: string | null;
  moodlePassword: string | null;
  moodleId: number | null;
  moodleToken: string | null;
  moodleUsername: string | null;
}

export interface PresenceApi {
  isOnline: boolean;
  lastSeen: string | null;
}

export interface GoogleAuthApi {
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  tokenExpiry: string | null;
}

// Raw user from API (has _id, __v, etc.)
export interface ApiUser {
  _id: string;
  name: string;
  fatherName?: string;
  cnicPicFront?: string;
  cnicPicBack?: string;
  age?: number;
  qualification?: string;
  address?: string;
  permanentAddress?: string;
  contactNumber?: string;
  email: string;
  picture?: string;
  role: E_USER_ROLE;
  enrolledCourses?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  moodleDetails?: MoodleDetailsApi;
  presence?: PresenceApi;
  googleAuth?: GoogleAuthApi;
}

// App user (normalized from API - id instead of _id, no password/__v)
export type User = {
  id: string;
  name: string;
  fatherName?: string;
  cnicPicFront?: string;
  cnicPicBack?: string;
  age?: number;
  qualification?: string;
  address?: string;
  permanentAddress?: string;
  contactNumber?: string;
  email: string;
  picture?: string;
  role: E_USER_ROLE;
  enrolledCourses?: string[];
  createdAt?: string;
  updatedAt?: string;
  moodleDetails?: MoodleDetailsApi;
  presence?: PresenceApi;
  googleAuth?: GoogleAuthApi;
};

// API login request
export interface ILoginPayload {
  email: string;
  password: string;
}

// API login response
export interface ILoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: ApiUser;
}

export interface ISignupPayload {
  email: string;
  password: string;
  name: string;
  role?: E_USER_ROLE;
}

export interface ISignupResponse {
  accessToken: string;
  user: User;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ICheckPhoneExistsPayload {
  phone: string;
}

export interface ICheckPhoneExistsResponse {
  exists: boolean;
}
