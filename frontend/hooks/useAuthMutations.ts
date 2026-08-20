import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios'; 
import { authService, LoginPayload } from '@/services/auth.service';
import { SignupFormValues } from '../schema/client.schema';
import { toast } from 'sonner';


interface ErrorResponse {
  message?: string;
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      toast.success('Đăng nhập thành công!');
      router.push('/dashboard');
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const message = error.response?.data?.message || 'Đăng nhập thất bại!';
      toast.error(message);
    },
  });
}

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: SignupFormValues) => authService.signup(payload),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    },
    
    onError: (error: AxiosError<ErrorResponse>) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký!';
      toast.error(message);
    }
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
    },
  });
}
