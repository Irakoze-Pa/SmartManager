import { Schema, model, type InferSchemaType } from 'mongoose';

export const userRoles = ['owner', 'admin', 'manager', 'cashier', 'inventory'] as const;
export type UserRole = (typeof userRoles)[number];

const userSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    defaultBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch', required: true }],
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, required: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, versionKey: false },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model<User>('User', userSchema);

