import { Schema, model, type InferSchemaType } from 'mongoose';

const productionOrderSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  finishedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  finishedQuantity: { type: Number, required: true, min: 0.001 },
  status: { type: String, enum: ['planned', 'in_progress', 'quality_check', 'completed', 'cancelled'], required: true, default: 'completed', index: true },
  stageHistory: [{ status: { type: String, enum: ['planned', 'in_progress', 'quality_check', 'completed'], required: true }, note: { type: String, trim: true, maxlength: 250, default: '' }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, changedAt: { type: Date, default: Date.now, required: true } }],
  recipeId: { type: Schema.Types.ObjectId, ref: 'BillOfMaterials' },
  materials: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true, min: 0.001 }, unitCost: { type: Number, required: true, min: 0, default: 0 } }],
  estimatedMaterialCost: { type: Number, required: true, min: 0, default: 0 },
  actualMaterialCost: { type: Number, min: 0 },
  extraCost: { type: Number, min: 0, default: 0 },
  actualQuantity: { type: Number, min: 0 },
  acceptedQuantity: { type: Number, min: 0 },
  rejectedQuantity: { type: Number, min: 0 },
  qualityStatus: { type: String, enum: ['pending', 'passed', 'partial', 'failed'], default: 'pending', required: true },
  qualityNotes: { type: String, trim: true, maxlength: 250, default: '' },
  reference: { type: String, required: true, trim: true, maxlength: 60 },
  notes: { type: String, trim: true, maxlength: 250, default: '' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });
productionOrderSchema.index({ businessId: 1, createdAt: -1 });
export type ProductionOrder = InferSchemaType<typeof productionOrderSchema>;
export const ProductionOrderModel = model<ProductionOrder>('ProductionOrder', productionOrderSchema);
