import type { CompletedSale, PaymentMethod, SaleSummary } from '../types/api';
import { apiClient } from './apiClient';

export const getSales = async (branchId?: string): Promise<SaleSummary[]> =>
  (await apiClient.get<{ items: SaleSummary[] }>('/sales', { params: branchId ? { branchId } : undefined })).data.items;

export const getSale = async (id: string): Promise<CompletedSale> =>
  (await apiClient.get<{ sale: CompletedSale }>(`/sales/${id}`)).data.sale;

export const createSale = async (input: { branchId: string; items: Array<{ productId: string; quantity: number; saleUnit: 'base' | 'package'; unitPrice: number }>; paymentMethod: PaymentMethod; amountPaid: number; depositMethod?: Exclude<PaymentMethod, 'credit'>; customerId?: string }): Promise<CompletedSale> =>
  (await apiClient.post<{ sale: CompletedSale }>('/sales', input)).data.sale;
