import { Schema, model, type InferSchemaType } from 'mongoose';

export const productUnits = ['piece', 'box', 'kg', 'litre', 'metre', 'bag', 'set'] as const;
const productSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 50 },
  imageUrl: { type: String, trim: true, maxlength: 500_000, default: '' },
  unit: { type: String, enum: productUnits, required: true },
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  packageName: { type: String, trim: true, maxlength: 40, default: '' },
  packageSize: { type: Number, min: 0.001 },
  packageSellingPrice: { type: Number, min: 0 },
  reorderLevel: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true, versionKey: false });
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });
productSchema.index({ businessId: 1, name: 1 });
export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel = model<Product>('Product', productSchema);

