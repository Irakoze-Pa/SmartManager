import { Schema, model, type InferSchemaType } from 'mongoose';

const inventoryBalanceSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });
inventoryBalanceSchema.index({ businessId: 1, branchId: 1, productId: 1 }, { unique: true });
export type InventoryBalance = InferSchemaType<typeof inventoryBalanceSchema>;
export const InventoryBalanceModel = model<InventoryBalance>('InventoryBalance', inventoryBalanceSchema);

