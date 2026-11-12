import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:7310/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('smartshop_session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.localStorage.removeItem('smartshop_session');
      window.dispatchEvent(new Event('smartshop:tenant-session-expired'));
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;
  const data: unknown = error.response?.data;
  if (typeof data !== 'object' || data === null || !('error' in data)) return fallback;
  const apiError = data.error;
  if (typeof apiError !== 'object' || apiError === null || !('message' in apiError)) return fallback;
  return typeof apiError.message === 'string' ? apiError.message : fallback;
};

