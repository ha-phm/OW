import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Hàm xử lý việc logout, phát sự kiện ra ngoài thay vì dùng window.location.href
const forceLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface PromiseCallback {
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: PromiseCallback[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp && decodedToken.exp < currentTime + 10) {
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (refreshToken && !isRefreshing) {
              isRefreshing = true;
              try {
                const res = await axios.post(`${API_URL}/auth/refresh`, {
                  refresh_token: refreshToken,
                });
                
                const { access_token, refresh_token: new_refresh_token } = res.data;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', new_refresh_token);
                
                token = access_token; // Cập nhật token mới
                processQueue(null, access_token);
              } catch (err) {
                processQueue(err, null);
                forceLogout();
              } finally {
                isRefreshing = false;
              }
            } else if (isRefreshing) {
              token = await new Promise<string | null>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              });
            }
          }
        } catch (error) {
          console.error('Invalid token format', error);
        }

        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return axios(originalRequest).then((res) => res.data);
            })
            .catch((err: unknown) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

        if (!refreshToken) {
          forceLogout();
          return Promise.reject(error);
        }

        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: new_refresh_token } = res.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', new_refresh_token);
          }

          processQueue(null, access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          const retryResponse = await axios(originalRequest);

          return retryResponse.data;
        } catch (refreshError: unknown) {
          processQueue(refreshError, null);
          forceLogout(); // Refresh thất bại -> Phát sự kiện logout
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      let message = 'Có lỗi xảy ra';
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }
      throw new ApiError(message, status);
    }

    throw new ApiError(error.message || 'Không thể kết nối đến máy chủ', 500);
  }
);

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

export async function apiDelete<TResponse>(path: string): Promise<TResponse> {
  const response = await apiClient.delete<TResponse>(path);
  return response as unknown as TResponse;
}