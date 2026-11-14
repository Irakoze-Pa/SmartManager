import type { AccountStatement, Customer } from '../types/api';
import { apiClient } from './apiClient';

export const getCustomers = async (): Promise<Customer[]> =>
  (await apiClient.get<{ items: Customer[] }>('/customers')).data.items;

export type CustomerInput = Pick<Customer, 'name' | 'customerType' | 'companyName' | 'companyRegistrationNumber' | 'companyTin' | 'phone' | 'email' | 'notes'>;

export const createCustomer = async (input: CustomerInput): Promise<Customer> =>
  (await apiClient.post<{ customer: Customer }>('/customers', input)).data.customer;

export const updateCustomer = async (id: string, input: CustomerInput): Promise<Customer> =>
  (await apiClient.patch<{ customer: Customer }>(`/customers/${id}`, input)).data.customer;

export const deleteCustomer = async (id: string): Promise<void> => {
  await apiClient.delete(`/customers/${id}`);
};

export const setCustomerStatus = async (id: string, isActive: boolean): Promise<void> => {
  await apiClient.patch(`/customers/${id}/status`, { isActive });
};

export const recordCreditPayment = async (id: string, input: { amount: number; method: 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'bank_transfer' }): Promise<void> => {
  await apiClient.post(`/customers/${id}/payments`, input);
};

export const getCustomerStatement = async (id: string): Promise<AccountStatement> => {
  const { statement } = (await apiClient.get<{ statement: { customer: AccountStatement['party']; totalSales: number; totalPaid: number; balanceDue: number; transactions: AccountStatement['transactions'] } }>(`/customers/${id}/statement`)).data;
  return { party: statement.customer, total: statement.totalSales, paid: statement.totalPaid, balanceDue: statement.balanceDue, transactions: statement.transactions };
};
