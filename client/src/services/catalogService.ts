import type { Category, Product, ProductUnit } from '../types/api';
import { apiClient } from './apiClient';
export const getCategories = async (): Promise<Category[]> => (await apiClient.get<{ items: Category[] }>('/catalog/categories')).data.items;
export const createCategory = async (name: string): Promise<void> => { await apiClient.post('/catalog/categories', { name }); };
export const getProducts = async (): Promise<Product[]> => (await apiClient.get<{ items: Product[] }>('/catalog/products')).data.items;
export const getCatalogSummary = async (): Promise<{ products: number; activeProducts: number; categories: number }> => (await apiClient.get('/catalog/summary')).data;
export const createProduct = async (input: { name: string; imageUrl?: string; sku: string; categoryId: string; unit: ProductUnit; costPrice: number; sellingPrice: number; reorderLevel: number; packageName?: string; packageSize?: number; packageSellingPrice?: number }): Promise<void> => { await apiClient.post('/catalog/products', input); };
export const updateProduct = async (id: string, input: { name: string; imageUrl?: string; sku: string; categoryId: string; unit: ProductUnit; costPrice: number; sellingPrice: number; reorderLevel: number; packageName?: string; packageSize?: number; packageSellingPrice?: number }): Promise<void> => { await apiClient.patch(`/catalog/products/${id}`, input); };
export const setProductStatus = async (id: string, isActive: boolean): Promise<void> => { await apiClient.patch(`/catalog/products/${id}/status`, { isActive }); };
export const setProductPackage = async (id: string, input: { packageName: string; packageSize: number; packageSellingPrice: number }): Promise<void> => { await apiClient.patch(`/catalog/products/${id}/package`, input); };
export const setProductImage = async (id: string, imageUrl: string): Promise<void> => { await apiClient.patch(`/catalog/products/${id}/image`, { imageUrl }); };

