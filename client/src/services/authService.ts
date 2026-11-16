import type { AuthResponse, Identity, LoginRequest, RegisterRequest } from '../types/api';
import { apiClient } from './apiClient';

export const registerBusiness = async (input: RegisterRequest): Promise<AuthResponse> =>
  (await apiClient.post<AuthResponse>('/auth/register', input)).data;

export const login = async (input: LoginRequest): Promise<AuthResponse> =>
  // The production API runs on a scale-to-zero host and can need time to wake.
  (await apiClient.post<AuthResponse>('/auth/login', input, { timeout: 90_000 })).data;

export const getCurrentIdentity = async (): Promise<Identity> =>
  (await apiClient.get<Identity>('/auth/me')).data;

export const updateBusinessProfile = async (input: { name: string; logoUrl: string; phone: string; email: string; address: string; tin: string; registrationNumber?: string; businessType?: 'sole_trader' | 'limited_company' | 'partnership' | 'cooperative' | 'other'; industry?: Identity['business']['industry'] }): Promise<Identity['business']> =>
  (await apiClient.patch<{ business: Identity['business'] }>('/auth/business', input)).data.business;

