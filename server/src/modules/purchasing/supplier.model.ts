import { Schema, model, type InferSchemaType } from 'mongoose';

const supplierSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
  contactName: { type: String, trim: true, maxlength: 120, default: '' },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true, versionKey: false });

supplierSchema.index({ businessId: 1, name: 1 }, { unique: true });

export type Supplier = InferSchemaType<typeof supplierSchema>;
export const SupplierModel = model<Supplier>('Supplier', supplierSchema);
