import { Schema, model, type InferSchemaType } from 'mongoose';

const billOfMaterialsSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  finishedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  outputQuantity: { type: Number, required: true, min: 0.001 },
  materials: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true, min: 0.001 } }],
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  notes: { type: String, trim: true, maxlength: 250, default: '' },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true, versionKey: false });
billOfMaterialsSchema.index({ businessId: 1, name: 1 }, { unique: true });
billOfMaterialsSchema.index({ businessId: 1, finishedProductId: 1 });
export type BillOfMaterials = InferSchemaType<typeof billOfMaterialsSchema>;
export const BillOfMaterialsModel = model<BillOfMaterials>('BillOfMaterials', billOfMaterialsSchema);
