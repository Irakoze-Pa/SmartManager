import type { CompletedSale, PaymentMethod, SaleSummary } from '../types/api';
import { apiClient } from './apiClient';

export interface SalesAnalytics {
  daily: Array<{ date: string; revenue: number; transactions: number }>;
  topProducts: Array<{ productId: string; name: string; sku: string; quantity: number; revenue: number }>;
}

export const getSalesAnalytics = async (branchId?: string): Promise<SalesAnalytics> =>
  (await apiClient.get<SalesAnalytics>('/sales/analytics', { params: branchId ? { branchId } : undefined })).data;

export const getSales = async (branchId?: string): Promise<SaleSummary[]> =>
  (await apiClient.get<{ items: SaleSummary[] }>('/sales', { params: branchId ? { branchId } : undefined })).data.items;

export const getSale = async (id: string): Promise<CompletedSale> =>
  (await apiClient.get<{ sale: CompletedSale }>(`/sales/${id}`)).data.sale;

export const createSale = async (input: { branchId: string; items: Array<{ productId: string; quantity: number; saleUnit: 'base' | 'package'; unitPrice: number }>; paymentMethod: PaymentMethod; amountPaid: number; depositMethod?: Exclude<PaymentMethod, 'credit'>; customerId?: string }): Promise<CompletedSale> =>
  (await apiClient.post<{ sale: CompletedSale }>('/sales', input)).data.sale;
