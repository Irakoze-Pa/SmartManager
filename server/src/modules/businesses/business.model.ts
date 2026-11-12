import { Schema, model, type InferSchemaType } from 'mongoose';

const businessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', required: true },
    logoUrl: { type: String, trim: true, maxlength: 750_000, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
    address: { type: String, trim: true, maxlength: 240, default: '' },
    tin: { type: String, trim: true, uppercase: true, maxlength: 40, default: '' },
    registrationNumber: { type: String, trim: true, uppercase: true, maxlength: 60, default: '' },
    businessType: { type: String, enum: ['sole_trader', 'limited_company', 'partnership', 'cooperative', 'other'], default: 'sole_trader' },
    industry: { type: String, enum: ['retail', 'manufacturing', 'real_estate', 'restaurant', 'building_materials', 'clinic', 'logistics', 'school', 'construction'], default: 'retail', required: true },
    subscription: {
      plan: { type: String, enum: ['trial', 'starter', 'growth', 'enterprise'], default: 'trial', required: true },
      status: { type: String, enum: ['trialing', 'active', 'past_due', 'cancelled'], default: 'trialing', required: true },
      startedAt: { type: Date, default: Date.now, required: true },
      currentPeriodEnd: { type: Date, required: true },
    },
  },
  { timestamps: true, versionKey: false },
);

export type Business = InferSchemaType<typeof businessSchema>;
export const BusinessModel = model<Business>('Business', businessSchema);

