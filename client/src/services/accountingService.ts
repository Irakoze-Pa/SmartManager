import { apiClient } from './apiClient';
export interface LedgerAccount { _id:string; code:string; name:string; type:'asset'|'liability'|'equity'|'revenue'|'expense'; normalBalance:'debit'|'credit' }
export interface AccountingDashboard { ledger:{debits:number;credits:number};receivables:{total:number;overdue:number};payables:{total:number;overdue:number};assets:{cost:number;bookValue:number};budgets:number;audits:Array<{_id:string;action:string;entityType:string;occurredAt:string}> }
export interface TrialBalanceRow { _id:string;code:string;name:string;debit:number;credit:number }
export const getAccountingDashboard=async():Promise<AccountingDashboard>=>(await apiClient.get('/accounting/dashboard')).data;
export const bootstrapAccounting=async():Promise<void>=>{await apiClient.post('/accounting/bootstrap');};
export const getAccounts=async():Promise<LedgerAccount[]>=>(await apiClient.get<{items:LedgerAccount[]}>('/accounting/accounts')).data.items;
export const getAccountingList=async<T>(path:string,params?:Record<string,string>):Promise<T[]>=>(await apiClient.get<{items:T[]}>(`/accounting/${path}`,{params})).data.items;
export const createAccountingItem=async(path:string,input:unknown):Promise<void>=>{await apiClient.post(`/accounting/${path}`,input);};
export const getStatements=async():Promise<{incomeStatement:{revenue:number;expenses:number;netProfit:number};balanceSheet:{assets:number;liabilities:number;equity:number;retainedEarnings:number;balance:number}}>=>(await apiClient.get('/accounting/statements')).data;
export const getTrialBalance=async():Promise<{items:TrialBalanceRow[];totalDebit:number;totalCredit:number}>=>(await apiClient.get('/accounting/trial-balance')).data;
