import { Schema, model, type InferSchemaType } from 'mongoose';

const categorySchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true, versionKey: false });
categorySchema.index({ businessId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model<Category>('Category', categorySchema);

