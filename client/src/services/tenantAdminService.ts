import type { TenantBranch, TenantStaff, UserRole } from '../types/api';
import { apiClient } from './apiClient';

export const getBranches = async (): Promise<TenantBranch[]> => (await apiClient.get<{ items: TenantBranch[] }>('/tenant-admin/branches')).data.items;
export const createBranch = async (input: { name: string; code: string }): Promise<void> => { await apiClient.post('/tenant-admin/branches', input); };
export const setBranchStatus = async (id: string, isActive: boolean): Promise<void> => { await apiClient.patch(`/tenant-admin/branches/${id}/status`, { isActive }); };
export const getStaff = async (): Promise<TenantStaff[]> => (await apiClient.get<{ items: TenantStaff[] }>('/tenant-admin/staff')).data.items;
export const createStaff = async (input: { firstName: string; lastName: string; email: string; password: string; role: Exclude<UserRole, 'owner'>; branchId: string }): Promise<void> => { await apiClient.post('/tenant-admin/staff', input); };
export const setStaffStatus = async (id: string, isActive: boolean): Promise<void> => { await apiClient.patch(`/tenant-admin/staff/${id}/status`, { isActive }); };
export const updateStaff = async (id: string, input: { role: Exclude<UserRole, 'owner'>; branchId: string; isActive: boolean }): Promise<void> => { await apiClient.patch(`/tenant-admin/staff/${id}`, input); };

