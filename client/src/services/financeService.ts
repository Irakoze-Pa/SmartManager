import type { Expense, ExpenseCategory, FinanceSummary } from '../types/api';
import { apiClient } from './apiClient';
const params = (from: string, to: string, branchId?: string) => ({ from, to, ...(branchId ? { branchId } : {}) });
export const getFinanceSummary = async (from: string, to: string, branchId?: string): Promise<FinanceSummary> => (await apiClient.get('/finance/summary', { params: params(from, to, branchId) })).data;
export const getExpenses = async (from: string, to: string, branchId?: string): Promise<Expense[]> => (await apiClient.get<{ items: Expense[] }>('/finance/expenses', { params: params(from, to, branchId) })).data.items;
export const createExpense = async (input: { branchId: string; category: ExpenseCategory; description: string; amount: number; incurredAt: string }): Promise<void> => { await apiClient.post('/finance/expenses', input); };
