import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../lib/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiPost<LoginResponse, LoginPayload>('/auth/login', payload),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    },
  });
}