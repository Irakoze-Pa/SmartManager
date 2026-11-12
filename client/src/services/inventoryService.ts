import type { InventoryItem, InventoryTransfer, TenantBranch } from '../types/api';
import { apiClient } from './apiClient';
export const getInventory = async (branchId?: string): Promise<InventoryItem[]> => (await apiClient.get<{ items: InventoryItem[] }>('/inventory', { params: branchId ? { branchId } : undefined })).data.items;
export const getInventoryBranches = async (): Promise<TenantBranch[]> => (await apiClient.get<{ items: TenantBranch[] }>('/inventory/branches')).data.items;
export const adjustInventory = async (input: { branchId: string; productId: string; change: number; reason: string }): Promise<void> => { await apiClient.post('/inventory/adjustments', input); };
export const getInventoryTransfers = async (): Promise<InventoryTransfer[]> => (await apiClient.get<{ items: InventoryTransfer[] }>('/inventory/transfers')).data.items;
export const createInventoryTransfer = async (input: { fromBranchId: string; toBranchId: string; items: Array<{ productId: string; quantity: number }>; note: string }): Promise<void> => { await apiClient.post('/inventory/transfers', input); };

