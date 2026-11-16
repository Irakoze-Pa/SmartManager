import { apiClient } from './apiClient';
export interface LedgerAccount { _id:string; code:string; name:string; type:'asset'|'liability'|'equity'|'revenue'|'expense'; normalBalance:'debit'|'credit' }
export interface FinancialAccount { _id:string;name:string;type:'cash'|'bank'|'mobile_money'|'card_clearing';provider:string;accountNumber:string;currency:string;openingBalance:number;currentBalance:number;isActive:boolean;ledgerAccountId:string|{_id:string;code:string;name:string} }
export interface Reconciliation { _id:string;financialAccountId:string|{_id:string;name:string;type:string;currency:string};statementDate:string;statementBalance:number;bookBalance:number;difference:number;note:string;status:'matched'|'adjustment_required';createdAt:string }
export interface AccountTransfer { _id:string;transferNumber:string;fromAccountId:string|{_id:string;name:string;type:string;currency:string};toAccountId:string|{_id:string;name:string;type:string;currency:string};amount:number;transferredAt:string;reference:string;note:string;createdAt:string }
export interface AccountingDashboard { ledger:{debits:number;credits:number};receivables:{total:number;overdue:number};payables:{total:number;overdue:number};assets:{cost:number;bookValue:number};budgets:number;audits:Array<{_id:string;action:string;entityType:string;occurredAt:string}> }
export interface TrialBalanceRow { _id:string;code:string;name:string;debit:number;credit:number }
export const getAccountingDashboard=async():Promise<AccountingDashboard>=>(await apiClient.get('/accounting/dashboard')).data;
export const bootstrapAccounting=async():Promise<void>=>{await apiClient.post('/accounting/bootstrap');};
export const getAccounts=async():Promise<LedgerAccount[]>=>(await apiClient.get<{items:LedgerAccount[]}>('/accounting/accounts')).data.items;
export const getFinancialAccounts=async():Promise<FinancialAccount[]>=>(await apiClient.get<{items:FinancialAccount[]}>('/accounting/treasury')).data.items;
export const getReconciliations=async():Promise<Reconciliation[]>=>(await apiClient.get<{items:Reconciliation[]}>('/accounting/treasury/reconciliations')).data.items;
export const reconcileFinancialAccount=async(input:{financialAccountId:string;statementDate:string;statementBalance:number;note:string}):Promise<void>=>{await apiClient.post('/accounting/treasury/reconcile',input);};
export const getAccountTransfers=async():Promise<AccountTransfer[]>=>(await apiClient.get<{items:AccountTransfer[]}>('/accounting/treasury/transfers')).data.items;
export const transferFunds=async(input:{fromAccountId:string;toAccountId:string;amount:number;transferredAt:string;reference:string;note:string}):Promise<void>=>{await apiClient.post('/accounting/treasury/transfers',input);};
export const getAccountingList=async<T>(path:string,params?:Record<string,string>):Promise<T[]>=>(await apiClient.get<{items:T[]}>(`/accounting/${path}`,{params})).data.items;
export const createAccountingItem=async(path:string,input:unknown):Promise<void>=>{await apiClient.post(`/accounting/${path}`,input);};
export const getStatements=async():Promise<{incomeStatement:{revenue:number;expenses:number;netProfit:number};balanceSheet:{assets:number;liabilities:number;equity:number;retainedEarnings:number;balance:number}}>=>(await apiClient.get('/accounting/statements')).data;
export const getTrialBalance=async():Promise<{items:TrialBalanceRow[];totalDebit:number;totalCredit:number}>=>(await apiClient.get('/accounting/trial-balance')).data;
