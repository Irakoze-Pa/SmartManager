import type { Subscription } from '../types/api';
import { apiClient } from './apiClient';
export const getSubscription = async (): Promise<{ businessName: string; subscription?: Subscription }> => (await apiClient.get('/subscription')).data;
