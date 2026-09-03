import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}


let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

const forceLogout = () => {
  if (typeof window !== 'undefined') {
    setAccessToken(null); // Xoá token trên RAM
    
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
};

// 3. TẠO AXIOS INSTANCE
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // BẮT BUỘC ĐỂ TRÌNH DUYỆT GỬI HTTP-ONLY COOKIE
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

// REQUEST INTERCEPTOR: Tự động đính kèm Access Token từ RAM vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Bắt lỗi 401 và tự động refresh token
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      if (status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // Xếp hàng chờ 
          return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axios(originalRequest).then((res) => res.data);
            })
            .catch((err: unknown) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Gọi API refresh token. 
          // Phải có withCredentials: true để trình duyệt gửi kèm HttpOnly Cookie
          const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
            withCredentials: true 
          });

  
          const newAccessToken = res.data.accessToken || res.data.access_token;

          // Lưu token mới vào RAM
          setAccessToken(newAccessToken);
          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          
          const retryResponse = await axios(originalRequest);
          return retryResponse.data;
          
        } catch (refreshError: unknown) {
          
          processQueue(refreshError, null);
          forceLogout();
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

// Các hàm Helpers bọc lại Axios
function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  return promise as Promise<T>;
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return unwrap<TResponse>(apiClient.get(path));
}

export function apiPost<TResponse, TBody>(path: string, body?: TBody): Promise<TResponse> {
  return unwrap<TResponse>(apiClient.post(path, body));
}

export function apiPatch<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  return unwrap<TResponse>(apiClient.patch(path, body));
}

export function apiDelete<TResponse>(path: string): Promise<TResponse> {
  return unwrap<TResponse>(apiClient.delete(path));
}