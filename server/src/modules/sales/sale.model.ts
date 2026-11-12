import { Schema, model, type InferSchemaType } from 'mongoose';

const saleItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  stockQuantity: { type: Number, required: true, min: 0.001 },
  unitLabel: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, required: true, min: 0, default: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const creditPaymentSchema = new Schema({
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ['cash', 'mtn_momo', 'airtel_money', 'card', 'bank_transfer'], required: true },
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receivedAt: { type: Date, required: true, default: Date.now },
}, { _id: true });

const saleSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
  customerName: { type: String, trim: true },
  receiptNumber: { type: String, required: true },
  items: { type: [saleItemSchema], required: true, validate: [(items: unknown[]) => items.length > 0, 'Sale requires an item'] },
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'credit', 'mobile_money'], required: true },
  amountPaid: { type: Number, required: true, min: 0 },
  changeDue: { type: Number, required: true, min: 0 },
  balanceDue: { type: Number, required: true, min: 0, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'unpaid'], required: true, default: 'paid' },
  creditPayments: { type: [creditPaymentSchema], default: [] },
  status: { type: String, enum: ['completed', 'voided'], required: true, default: 'completed' },
}, { timestamps: true, versionKey: false });

saleSchema.index({ businessId: 1, receiptNumber: 1 }, { unique: true });
saleSchema.index({ businessId: 1, branchId: 1, createdAt: -1 });
saleSchema.index({ businessId: 1, customerId: 1, balanceDue: 1 });

export type Sale = InferSchemaType<typeof saleSchema>;
export const SaleModel = model<Sale>('Sale', saleSchema);
