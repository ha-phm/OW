// hooks/useSignup.ts — bản DUY NHẤT nên giữ
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { authService } from '@/services/auth.service';
import { SignupFormValues } from '../schema/client.schema';
import { toast } from 'sonner';

interface ErrorResponse { message?: string }

export function useSignup() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: SignupFormValues) => authService.signup(payload),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký!');
    },
  });
}