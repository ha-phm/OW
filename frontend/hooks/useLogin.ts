// hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../lib/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string; // Trùng với key API NestJS trả về
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiPost<LoginResponse, LoginPayload>('/auth/login', payload),
    onSuccess: (data) => {
      // Tự động lưu token khi thành công
      // Tự động lưu token khi thành công
      localStorage.setItem('access_token', data.access_token);
    },
  });
}