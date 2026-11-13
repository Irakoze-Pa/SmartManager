export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  databaseTarget: 'atlas' | null;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'inventory';

export interface Identity {
  user: { id: string; firstName: string; lastName: string; email: string; role: UserRole };
  business: { id: string; name: string; slug: string; logoUrl: string; phone: string; email: string; address: string; tin: string; registrationNumber: string; businessType: string; industry: BusinessIndustry };
  branch: { id: string; name: string; code: string };
}

export interface AuthResponse extends Identity {
  token: string;
}

export interface RegisterRequest {
  businessName: string;
  logoUrl: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  tin: string;
  registrationNumber: string;
  businessType: 'sole_trader' | 'limited_company' | 'partnership' | 'cooperative' | 'other';
  industry: BusinessIndustry;
  branchName?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
export type BusinessIndustry = 'retail' | 'manufacturing' | 'real_estate' | 'restaurant' | 'building_materials' | 'logistics' | 'school' | 'construction';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PlatformAdmin { id: string; name: string; email: string }
export interface PlatformSummary { businesses: number; activeBusinesses: number; suspendedBusinesses: number; users: number; branches: number; sectors: Array<{ industry: BusinessIndustry; count: number }> }
export type SubscriptionPlan = 'trial' | 'starter' | 'growth' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';
export interface Subscription { plan: SubscriptionPlan; status: SubscriptionStatus; startedAt: string; currentPeriodEnd: string }
export interface PlatformBusiness { id: string; name: string; slug: string; industry: BusinessIndustry; businessType: string; status: 'active' | 'suspended'; subscription: Subscription; createdAt: string; users: number; branches: number }
export interface PlatformUser { id: string; firstName: string; lastName: string; email: string; role: UserRole; isActive: boolean; businessId: string; businessName: string }
export interface TenantBranch { id: string; name: string; code: string; isPrimary: boolean; isActive: boolean }
export interface TenantStaff { id: string; firstName: string; lastName: string; email: string; role: UserRole; isActive: boolean; branchId: string; branchName: string }
export type ProductUnit = 'piece' | 'box' | 'kg' | 'litre' | 'metre' | 'bag' | 'set';
export interface Category { id: string; name: string }
export interface Product { id: string; name: string; imageUrl?: string; sku: string; categoryId: string; categoryName: string; unit: ProductUnit; costPrice: number; sellingPrice: number; packageName?: string; packageSize?: number; packageSellingPrice?: number; reorderLevel: number; isActive: boolean }
export interface InventoryItem { branchId: string; branchName: string; productId: string; productName: string; sku: string; unit: ProductUnit; reorderLevel: number; quantity: number }
export type PaymentMethod = 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'bank_transfer' | 'credit' | 'mobile_money';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export interface SaleSummary { id: string; receiptNumber: string; branchId: string; total: number; amountPaid: number; balanceDue: number; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod; initialPaymentMethod?: Exclude<PaymentMethod, 'credit'>; itemCount: number; status: 'completed' | 'voided'; createdAt: string }
export interface SaleDocumentItem { name: string; sku: string; quantity: number; unitLabel: string; unitPrice: number; lineTotal: number }
export interface ShopBrand { name: string; logoUrl: string; phone: string; email: string; address: string; tin: string }
export interface CompletedSale { id: string; receiptNumber: string; subtotal: number; total: number; amountPaid: number; changeDue: number; balanceDue: number; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod; initialPaymentMethod?: Exclude<PaymentMethod, 'credit'>; creditPayments?: Array<{ amount: number; method: Exclude<PaymentMethod, 'credit'>; receivedAt: string }>; createdAt: string; customerName: string; cashierName: string; branchName: string; items: SaleDocumentItem[]; business: ShopBrand }
export interface Supplier { id: string; name: string; contactName: string; phone: string; email: string; isActive: boolean }
export interface PurchaseOrderItem { productId: string; name: string; sku: string; quantity: number; unitLabel?: string; packageSize?: number; unitCost: number; lineTotal: number }
export interface SupplierPayment { id: string; amount: number; method: 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'bank_transfer'; reference: string; paidAt: string }
export interface PurchaseOrder { id: string; orderNumber: string; supplierId: string; supplierName: string; branchId: string; branchName: string; items: PurchaseOrderItem[]; total: number; supplierPayments?: SupplierPayment[]; status: 'draft' | 'received' | 'cancelled'; createdAt: string; receivedAt?: string }
export interface Customer { id: string; name: string; phone: string; email: string; notes: string; isActive: boolean; visits: number; totalSpent: number; creditBalance: number; lastPurchaseAt?: string }
export interface AccountStatement { party: { id: string; name: string; phone: string; email: string }; total: number; paid: number; balanceDue: number; transactions: Array<{ id: string; date: string; reference: string; status?: string; type?: string; method?: string; total: number; paid: number; balance: number; payments: Array<{ amount: number; method: string; reference?: string; date: string }> }> }
export type ExpenseCategory = 'rent' | 'utilities' | 'transport' | 'wages' | 'marketing' | 'maintenance' | 'supplies' | 'tax' | 'other';
export interface Expense { id: string; branchId: string; branchName: string; category: ExpenseCategory; description: string; amount: number; incurredAt: string }
export interface FinanceSummary { from: string; to: string; revenue: number; cogs: number; grossProfit: number; operatingExpenses: number; netProfit: number; transactions: number }
export interface BusinessReport { from: string; to: string; daily: Array<{ date: string; revenue: number; transactions: number }>; topProducts: Array<{ productId: string; name: string; sku: string; quantity: number; revenue: number }>; payments: Array<{ method: PaymentMethod; total: number; transactions: number }>; lowStock: Array<{ branchId: string; branchName: string; productId: string; name: string; sku: string; unit: ProductUnit; quantity: number; reorderLevel: number }> }
export interface InventoryTransfer { id: string; transferNumber: string; fromBranchName: string; toBranchName: string; items: Array<{ productId: string; name: string; sku: string; quantity: number }>; note: string; status: 'completed'; createdAt: string }

