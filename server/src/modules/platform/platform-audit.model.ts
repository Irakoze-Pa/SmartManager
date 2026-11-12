import { Schema, model, type InferSchemaType } from 'mongoose';

const platformAuditSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'PlatformAdmin', required: true, index: true },
    action: { type: String, required: true, trim: true, maxlength: 100 },
    targetType: { type: String, required: true, trim: true, maxlength: 50 },
    targetId: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false },
);

export type PlatformAudit = InferSchemaType<typeof platformAuditSchema>;
export const PlatformAuditModel = model<PlatformAudit>('PlatformAudit', platformAuditSchema);

