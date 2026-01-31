export interface ApiUser {
  _id: string;
  name: string;
  email?: string;
  picture?: string;
  role: string;
  qualification?: string;
  subject?: string;
  [key: string]: unknown;
}

export interface UsersListResponse {
  success?: boolean;
  data: ApiUser[];
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: unknown;
}
