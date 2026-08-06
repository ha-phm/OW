import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios'; // 1. Import AxiosError
import { authService, LoginPayload } from '@/services/auth.service';
import { SignupFormValues } from '../schema/client.schema';
import { toast } from 'sonner';

// 2. Định nghĩa kiểu dữ liệu trả về từ Backend khi có lỗi (Backend Error Response)
interface ErrorResponse {
  message?: string;
  // Bạn có thể thêm các field khác nếu backend trả về (vd: statusCode, error...)
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
    // 3. Thay 'any' bằng 'AxiosError<ErrorResponse>'
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
    // Áp dụng tương tự cho Signup
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
    // Dùng onSettled: Dù API logout có thành công hay lỗi mạng,
    // ta vẫn xóa token ở client và đẩy về trang login
    onSettled: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
    },
  });
}
