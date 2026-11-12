import { Schema, model, type InferSchemaType } from 'mongoose';

const purchaseOrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unitCost: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const purchaseOrderSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, required: true },
  items: { type: [purchaseOrderItemSchema], required: true, validate: [(items: unknown[]) => items.length > 0, 'Purchase order requires an item'] },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['draft', 'received', 'cancelled'], required: true, default: 'draft' },
  receivedAt: { type: Date },
}, { timestamps: true, versionKey: false });

purchaseOrderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ businessId: 1, createdAt: -1 });

export type PurchaseOrder = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model<PurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
