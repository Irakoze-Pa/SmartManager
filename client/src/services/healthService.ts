import type { HealthResponse } from '../types/api';
import { apiClient } from './apiClient';

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};

