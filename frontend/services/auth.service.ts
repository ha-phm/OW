import { apiPost } from '@/lib/api';

import { SignupFormValues } from '../schema/client.schema'; 


export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return await apiPost<AuthResponse, LoginPayload>('/auth/login', payload);
  },

  signup: async (payload: SignupFormValues): Promise<void> => {
    return await apiPost<void, SignupFormValues>('/auth/signup', payload);
  },

  logout: async (): Promise<void> => {
    return await apiPost<void, Record<string, never>>('/auth/logout', {});
  }
};