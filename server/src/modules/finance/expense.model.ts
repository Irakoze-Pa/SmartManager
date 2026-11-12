import { Schema, model, type InferSchemaType } from 'mongoose';

export const expenseCategories = ['rent', 'utilities', 'transport', 'wages', 'marketing', 'maintenance', 'supplies', 'tax', 'other'] as const;
const expenseSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: expenseCategories, required: true },
  description: { type: String, required: true, trim: true, minlength: 3, maxlength: 250 },
  amount: { type: Number, required: true, min: 0.01 },
  incurredAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false });
expenseSchema.index({ businessId: 1, incurredAt: -1 });
export type Expense = InferSchemaType<typeof expenseSchema>;
export const ExpenseModel = model<Expense>('Expense', expenseSchema);
