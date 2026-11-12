import { Schema, model, type InferSchemaType } from 'mongoose';

const customerSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true, versionKey: false });

customerSchema.index({ businessId: 1, phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string', $gt: '' } } });
customerSchema.index({ businessId: 1, name: 1 });

export type Customer = InferSchemaType<typeof customerSchema>;
export const CustomerModel = model<Customer>('Customer', customerSchema);
