import type { Customer } from '../types/api';
import { apiClient } from './apiClient';

export const getCustomers = async (): Promise<Customer[]> =>
  (await apiClient.get<{ items: Customer[] }>('/customers')).data.items;

export const createCustomer = async (input: { name: string; phone: string; email: string; notes: string }): Promise<Customer> =>
  (await apiClient.post<{ customer: Customer }>('/customers', input)).data.customer;

export const setCustomerStatus = async (id: string, isActive: boolean): Promise<void> => {
  await apiClient.patch(`/customers/${id}/status`, { isActive });
};

export const recordCreditPayment = async (id: string, input: { amount: number; method: 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'bank_transfer' }): Promise<void> => {
  await apiClient.post(`/customers/${id}/payments`, input);
};
