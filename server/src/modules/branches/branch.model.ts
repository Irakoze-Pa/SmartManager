import { Schema, model, type InferSchemaType } from 'mongoose';

const branchSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    isPrimary: { type: Boolean, default: false, required: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, versionKey: false },
);

branchSchema.index({ businessId: 1, code: 1 }, { unique: true });

export type Branch = InferSchemaType<typeof branchSchema>;
export const BranchModel = model<Branch>('Branch', branchSchema);

