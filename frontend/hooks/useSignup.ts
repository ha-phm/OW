import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../lib/api';

interface SignupPayload {
  email: string;
  password: string;
}

interface SignupResponse {
  message: string;
  email: string;
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupPayload) =>
      apiPost<SignupResponse, SignupPayload>('/auth/register', payload),
  });
}