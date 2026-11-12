import type { PurchaseOrder, Supplier } from '../types/api';
import { apiClient } from './apiClient';

export const getSuppliers = async (): Promise<Supplier[]> =>
  (await apiClient.get<{ items: Supplier[] }>('/purchasing/suppliers')).data.items;

export const createSupplier = async (input: { name: string; contactName: string; phone: string; email: string }): Promise<Supplier> =>
  (await apiClient.post<{ supplier: Supplier }>('/purchasing/suppliers', input)).data.supplier;

export const setSupplierStatus = async (id: string, isActive: boolean): Promise<void> => {
  await apiClient.patch(`/purchasing/suppliers/${id}/status`, { isActive });
};

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> =>
  (await apiClient.get<{ items: PurchaseOrder[] }>('/purchasing/orders')).data.items;

export const createPurchaseOrder = async (input: { branchId: string; supplierId: string; items: Array<{ productId: string; quantity: number; unitCost: number }> }): Promise<void> => {
  await apiClient.post('/purchasing/orders', input);
};

export const receivePurchaseOrder = async (id: string): Promise<void> => {
  await apiClient.post(`/purchasing/orders/${id}/receive`);
};

export const cancelPurchaseOrder = async (id: string): Promise<void> => {
  await apiClient.post(`/purchasing/orders/${id}/cancel`);
};
