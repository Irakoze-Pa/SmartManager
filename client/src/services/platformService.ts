import axios from 'axios';
import { apiBaseUrl } from './apiClient';
import type { BillingInterval, PlatformAdmin, PlatformBusiness, PlatformPayment, PlatformSummary, PlatformUser, RegisterRequest, SubscriptionPlan, SubscriptionStatus } from '../types/api';

const platformApi = axios.create({ baseURL: apiBaseUrl, timeout: 10_000, headers: { 'Content-Type': 'application/json' } });
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
export const getPlatformBusinesses = async (params: { page?: number; limit?: number; search?: string; status?: string; plan?: string } = {}): Promise<{ items: PlatformBusiness[]; pagination: { page: number; limit: number; total: number; pages: number } }> => (await platformApi.get('/platform/businesses', { params })).data;
export const createPlatformBusiness = async (input: RegisterRequest): Promise<void> => {
  await platformApi.post('/platform/businesses', input);
};
export const updatePlatformBusiness = async (id: string, input: Pick<PlatformBusiness, 'name' | 'industry' | 'businessType' | 'phone' | 'email' | 'address' | 'tin' | 'registrationNumber'>): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${id}`, input);
};
export const deletePlatformBusiness = async (id: string): Promise<void> => {
  await platformApi.delete(`/platform/businesses/${id}`);
};
export const getPlatformUsers = async (): Promise<{ items: PlatformUser[] }> => (await platformApi.get('/platform/users')).data;
export const getPlatformPayments = async (params: { page?: number; limit?: number; search?: string } = {}): Promise<{ items: PlatformPayment[]; pagination: { page: number; limit: number; total: number; pages: number } }> => (await platformApi.get('/platform/payments', { params })).data;
export const recordPlatformPayment = async (businessId: string, input: { amount: number; method: PlatformPayment['method']; reference: string; paidAt: string; plan: SubscriptionPlan; billingInterval: BillingInterval; periodEnd: string }): Promise<{ payment: Pick<PlatformPayment, 'id' | 'businessId' | 'businessName' | 'amount' | 'currency' | 'method' | 'reference' | 'paidAt' | 'plan' | 'billingInterval' | 'periodEnd'> }> => {
  return (await platformApi.post(`/platform/businesses/${businessId}/payments`, input)).data;
};
export const updateBusinessStatus = async (id: string, status: PlatformBusiness['status']): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${id}/status`, { status });
};
export const updateBusinessSubscription = async (id: string, input: { plan: SubscriptionPlan; status: SubscriptionStatus; billingInterval: BillingInterval; currentPeriodEnd: string }): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${id}/subscription`, input);
};
export const resetPlatformUserPassword = async (businessId: string, userId: string, password: string): Promise<void> => {
  await platformApi.patch(`/platform/businesses/${businessId}/users/${userId}/password`, { password });
};

