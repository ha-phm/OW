import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios'; 
import { authService, LoginPayload } from '@/services/auth.service';
import { SignupFormValues } from '../schema/client.schema';
import { toast } from 'sonner';

// Bổ sung import setAccessToken từ file cấu hình axios của bạn
import { setAccessToken } from '@/api/api'; 

interface ErrorResponse {
  message?: string;
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      // 1. CHỈ LƯU ACCESS TOKEN VÀO RAM, XOÁ BỎ LOCALSTORAGE
      // Lấy data.accessToken hoặc data.access_token tuỳ theo backend trả về
      const token = data.accessToken || data.access_token || null;
      setAccessToken(token);
      
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
      // 2. XOÁ ACCESS TOKEN TRÊN RAM THAY VÌ LOCALSTORAGE
      setAccessToken(null);
      router.push('/login');
    },
  });
}