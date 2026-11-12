import { apiClient } from './apiClient';
export interface RestaurantMenuItem { _id:string; name:string; category:string; price:number; available:boolean }
export interface RestaurantTable { _id:string; name:string; capacity:number; status:'available'|'occupied'|'reserved' }
export interface RestaurantOrder { _id:string; orderType:string; status:'new'|'preparing'|'ready'|'served'|'paid'|'cancelled'; total:number; items:Array<{name:string;quantity:number}>; createdAt:string }
export const getRestaurantData=async()=>{const [overview,menu,tables,orders]=await Promise.all([apiClient.get('/restaurant/overview'),apiClient.get('/restaurant/menu'),apiClient.get('/restaurant/tables'),apiClient.get('/restaurant/orders')]);return{overview:overview.data as {menuItems:number;tables:number;openOrders:number},menu:menu.data.items as RestaurantMenuItem[],tables:tables.data.items as RestaurantTable[],orders:orders.data.items as RestaurantOrder[]};};
export const addMenuItem=async(input:{branchId:string;name:string;category:string;price:number})=>{await apiClient.post('/restaurant/menu',input);};
export const addRestaurantTable=async(input:{branchId:string;name:string;capacity:number})=>{await apiClient.post('/restaurant/tables',input);};
export const updateRestaurantOrder=async(id:string,status:RestaurantOrder['status'])=>{await apiClient.patch(`/restaurant/orders/${id}/status`,{status});};
