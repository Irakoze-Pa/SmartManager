import { Schema, model, type InferSchemaType } from 'mongoose';

const platformAdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, required: true, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export type PlatformAdmin = InferSchemaType<typeof platformAdminSchema>;
export const PlatformAdminModel = model<PlatformAdmin>('PlatformAdmin', platformAdminSchema);

