import { Schema, model, type InferSchemaType } from 'mongoose';

const platformPaymentSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['RWF'], default: 'RWF', required: true },
    method: { type: String, enum: ['cash', 'mtn_momo', 'airtel_money', 'bank_transfer', 'card', 'other'], required: true },
    reference: { type: String, trim: true, maxlength: 120, default: '' },
    paidAt: { type: Date, required: true, index: true },
    plan: { type: String, enum: ['trial', 'starter', 'growth', 'enterprise'], required: true },
    billingInterval: { type: String, enum: ['monthly', 'yearly'], required: true, default: 'monthly' },
    periodEnd: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'PlatformAdmin', required: true },
  },
  { timestamps: true, versionKey: false },
);

platformPaymentSchema.index({ createdAt: -1 });

export type PlatformPayment = InferSchemaType<typeof platformPaymentSchema>;
export const PlatformPaymentModel = model<PlatformPayment>('PlatformPayment', platformPaymentSchema);
