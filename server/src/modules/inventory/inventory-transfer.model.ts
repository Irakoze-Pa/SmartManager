import { Schema, model, type InferSchemaType } from 'mongoose';

const transferItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
}, { _id: false });
const transferSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  fromBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  toBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  transferredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transferNumber: { type: String, required: true },
  items: { type: [transferItemSchema], required: true, validate: [(items: unknown[]) => items.length > 0, 'Transfer requires an item'] },
  note: { type: String, trim: true, maxlength: 250, default: '' },
  status: { type: String, enum: ['completed'], required: true, default: 'completed' },
}, { timestamps: true, versionKey: false });
transferSchema.index({ businessId: 1, transferNumber: 1 }, { unique: true });
transferSchema.index({ businessId: 1, createdAt: -1 });
export type InventoryTransfer = InferSchemaType<typeof transferSchema>;
export const InventoryTransferModel = model<InventoryTransfer>('InventoryTransfer', transferSchema);
