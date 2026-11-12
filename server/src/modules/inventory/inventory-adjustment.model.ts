import { Schema, model, type InferSchemaType } from 'mongoose';

const inventoryAdjustmentSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  change: { type: Number, required: true },
  quantityBefore: { type: Number, required: true, min: 0 },
  quantityAfter: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 250 },
}, { timestamps: true, versionKey: false });
inventoryAdjustmentSchema.index({ businessId: 1, branchId: 1, createdAt: -1 });
export type InventoryAdjustment = InferSchemaType<typeof inventoryAdjustmentSchema>;
export const InventoryAdjustmentModel = model<InventoryAdjustment>('InventoryAdjustment', inventoryAdjustmentSchema);

