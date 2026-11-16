import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:7310/api' : '');
export const apiBaseUrl = configuredApiUrl
  ? (configuredApiUrl.replace(/\/+$/, '').endsWith('/api') ? configuredApiUrl.replace(/\/+$/, '') : `${configuredApiUrl.replace(/\/+$/, '')}/api`)
  : '';

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
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'The SmartManager service is taking longer than expected to respond. It may be waking up—please try again shortly.';
  if (error.code === 'ERR_NETWORK') return `SmartManager cannot reach its API service${apiBaseUrl ? ` at ${apiBaseUrl}` : ''}. Your internet may be connected while the service is unavailable. Please try again shortly.`;
  const data: unknown = error.response?.data;
  if (typeof data !== 'object' || data === null || !('error' in data)) return fallback;
  const apiError = data.error;
  if (typeof apiError !== 'object' || apiError === null || !('message' in apiError)) return fallback;
  const message = typeof apiError.message === 'string' ? apiError.message : fallback;
  if ('details' in apiError && typeof apiError.details === 'object' && apiError.details !== null) {
    const detail = Object.entries(apiError.details).flatMap(([field, messages]) => Array.isArray(messages) ? messages.map(String).map((item) => `${field}: ${item}`) : []).at(0);
    if (detail) return `${message} (${detail})`;
  }
  return message;
};

