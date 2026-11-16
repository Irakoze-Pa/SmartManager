import { apiClient } from './apiClient';

export interface ProductionOrder {
  id: string;
  branchId: string;
  reference: string;
  branchName: string;
  finishedProduct: { name: string; sku: string; unit: string };
  finishedQuantity: number;
  materials: Array<{ productId: { name: string; sku: string; unit: string }; quantity: number; unitCost?: number }>;
  notes: string;
  status: 'planned' | 'in_progress' | 'quality_check' | 'completed' | 'cancelled';
  stageHistory: Array<{ status: string; note: string; changedAt: string }>;
  estimatedMaterialCost: number;
  actualMaterialCost?: number;
  extraCost: number;
  actualQuantity?: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  qualityStatus: 'pending' | 'passed' | 'partial' | 'failed';
  qualityNotes: string;
  createdAt: string;
}

export interface ProductionInput {
  branchId: string;
  finishedProductId: string;
  finishedQuantity: number;
  reference: string;
  notes?: string;
  materials: Array<{ productId: string; quantity: number }>;
}

export interface BillOfMaterials {
  id: string;
  name: string;
  finishedProduct: { name: string; sku: string; unit: string };
  outputQuantity: number;
  materials: Array<{ productId: { _id?: string; id?: string; name: string; sku: string; unit: string }; quantity: number }>;
  notes: string;
}

export interface ProductionReport {
  from: string;
  to: string;
  summary: { completedOrders: number; plannedOutput: number; actualOutput: number; acceptedOutput: number; rejectedOutput: number; yieldPercent: number; estimatedMaterialCost: number; actualProductionCost: number; averageCycleHours: number };
  daily: Array<{ date: string; orders: number; accepted: number; rejected: number }>;
  quality: Array<{ reference: string; product: { name: string; sku: string; unit: string }; actualQuantity: number; acceptedQuantity: number; rejectedQuantity: number; status: string; completedAt: string }>;
}

export type BillOfMaterialsInput = { name: string; finishedProductId: string; outputQuantity: number; notes?: string; materials: Array<{ productId: string; quantity: number }> };

export const getProductionOrders = async () => (await apiClient.get<{ items: ProductionOrder[] }>('/manufacturing/orders')).data.items;
export const getProductionReport = async (from: string, to: string, branchId?: string) => (await apiClient.get<ProductionReport>('/manufacturing/reports/production', { params: { from, to, ...(branchId ? { branchId } : {}) } })).data;
export const recordProduction = async (input: ProductionInput) => (await apiClient.post('/manufacturing/batches', input)).data;
export const getBillsOfMaterials = async () => (await apiClient.get<{ items: BillOfMaterials[] }>('/manufacturing/recipes')).data.items;
export const createBillOfMaterials = async (input: BillOfMaterialsInput) => (await apiClient.post('/manufacturing/recipes', input)).data;
export const createWorkOrder = async (input: { branchId: string; recipeId: string; finishedQuantity: number; reference: string; notes?: string }) => (await apiClient.post('/manufacturing/orders', input)).data;
export const completeWorkOrder = async (orderId: string, input: { actualQuantity: number; acceptedQuantity: number; extraCost: number; qualityNotes?: string }) => (await apiClient.post(`/manufacturing/orders/${orderId}/complete`, input)).data;
export const updateWorkOrderStage = async (orderId: string, status: 'in_progress' | 'quality_check', note = '') => (await apiClient.post(`/manufacturing/orders/${orderId}/stage`, { status, note })).data;
