import axios from 'axios';
import type { PlatformAdmin, PlatformBusiness, PlatformSummary, PlatformUser, RegisterRequest, SubscriptionPlan, SubscriptionStatus } from '../types/api';

const baseURL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:7310/api';
const platformApi = axios.create({ baseURL, timeout: 10_000, headers: { 'Content-Type': 'application/json' } });
platformApi.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('smartshop_platform_session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
platformApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.localStorage.removeItem('smartshop_platform_session');
      window.dispatchEvent(new Event('smartshop:platform-session-expired'));
    }
    return Promise.reject(error);
  },
);

export const platformLogin = async (email: string, password: string): Promise<{ token: string; admin: PlatformAdmin }> =>
  (await platformApi.post('/platform/auth/login', { email, password })).data;
export const getPlatformMe = async (): Promise<{ admin: PlatformAdmin }> => (await platformApi.get('/platform/auth/me')).data;
export const getPlatformSummary = async (): Promise<PlatformSummary> => (await platformApi.get('/platform/summary')).data;
export const getPlatformBusinesses = async (): Promise<{ items: PlatformBusiness[] }> => (await platformApi.get('/platform/businesses')).data;
export const createPlatformBusiness = async (input: RegisterRequest): Promise<void> => {
  await platformApi.post('/platform/businesses', input);
};
export const getPlatformUsers = async (): Promise<{ items: PlatformUser[] }> => (await platformApi.get('/platform/users')).data;
export const updateBusinessStatus = async (id: string, status: PlatformBusiness['status']): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${id}/status`, { status });
};
export const updateBusinessSubscription = async (id: string, input: { plan: SubscriptionPlan; status: SubscriptionStatus; currentPeriodEnd: string }): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${id}/subscription`, input);
};
export const resetPlatformUserPassword = async (businessId: string, userId: string, password: string): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${businessId}/users/${userId}/password`, { password });
};

