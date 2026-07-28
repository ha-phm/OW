import axios, { AxiosError } from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Tạo một instance Axios dùng chung cho toàn bộ ứng dụng
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Interceptor cho Request: Tự động đính kèm Bearer Token nếu có
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor cho Response: Xử lý lỗi 401 và chuẩn hóa thông báo lỗi
apiClient.interceptors.response.use(
  (response) => response.data, // Trả thẳng về dữ liệu data cho gọn
  (error: AxiosError<{ message?: string | string[] }>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
      }

      // Xử lý thông báo lỗi từ NestJS (có thể là string hoặc mảng string[])
      let message = 'Có lỗi xảy ra';
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }

      throw new ApiError(message, status);
    }

    // Lỗi không kết nối được server hoặc lỗi mạng
    throw new ApiError(error.message || 'Không thể kết nối đến máy chủ', 500);
  }
);

// Các hàm helper gọi API gọn gàng
export async function apiPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await apiClient.post<TResponse>(path, body);
  return response as unknown as TResponse;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const response = await apiClient.get<TResponse>(path);
  return response as unknown as TResponse;
}

export async function apiPatch<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await apiClient.patch<TResponse>(path, body);
  return response as unknown as TResponse;
}

