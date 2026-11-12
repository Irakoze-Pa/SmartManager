import type { BusinessReport } from '../types/api';
import { apiClient } from './apiClient';
export const getBusinessReport = async (from: string, to: string, branchId?: string): Promise<BusinessReport> =>
  (await apiClient.get('/reports', { params: { from, to, ...(branchId ? { branchId } : {}) } })).data;
