import type { AccountStatement, PurchaseOrder, Supplier } from '../types/api';
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

export const createPurchaseOrder = async (input: { branchId: string; supplierId: string; items: Array<{ productId: string; quantity: number; unitCost: number; unitType: 'base' | 'package' }> }): Promise<void> => {
  await apiClient.post('/purchasing/orders', input);
};

export const receivePurchaseOrder = async (id: string): Promise<void> => {
  await apiClient.post(`/purchasing/orders/${id}/receive`);
};

export const recordSupplierPayment = async (id: string, input: { amount: number; method: 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'bank_transfer'; reference: string }): Promise<void> => {
  await apiClient.post(`/purchasing/orders/${id}/payments`, input);
};

export const getSupplierStatement = async (id: string): Promise<AccountStatement> => {
  const { statement } = (await apiClient.get<{ statement: { supplier: AccountStatement['party']; totalOrders: number; totalPaid: number; balanceDue: number; transactions: AccountStatement['transactions'] } }>(`/purchasing/suppliers/${id}/statement`)).data;
  return { party: statement.supplier, total: statement.totalOrders, paid: statement.totalPaid, balanceDue: statement.balanceDue, transactions: statement.transactions };
};

export const cancelPurchaseOrder = async (id: string): Promise<void> => {
  await apiClient.post(`/purchasing/orders/${id}/cancel`);
};
