import { Schema, model, type InferSchemaType } from 'mongoose';

const base = { businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true }, branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true } };
const menuItemSchema = new Schema({ ...base, name: { type: String, required: true, trim: true }, category: { type: String, required: true, trim: true }, price: { type: Number, required: true, min: 0 }, available: { type: Boolean, default: true } }, { timestamps: true, versionKey: false });
const tableSchema = new Schema({ ...base, name: { type: String, required: true, trim: true }, capacity: { type: Number, required: true, min: 1 }, status: { type: String, enum: ['available','occupied','reserved'], default: 'available' } }, { timestamps: true, versionKey: false });
const orderSchema = new Schema({ ...base, tableId: { type: Schema.Types.ObjectId, ref: 'RestaurantTable' }, orderType: { type: String, enum: ['dine_in','takeaway'], required: true }, items: [{ menuItemId: { type: Schema.Types.ObjectId, ref: 'RestaurantMenuItem', required: true }, name: String, quantity: { type: Number, min: 1, required: true }, unitPrice: { type: Number, min: 0, required: true }, lineTotal: { type: Number, min: 0, required: true } }], status: { type: String, enum: ['new','preparing','ready','served','paid','cancelled'], default: 'new' }, total: { type: Number, required: true, min: 0 }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true, versionKey: false });
export type RestaurantMenuItem = InferSchemaType<typeof menuItemSchema>;
export const RestaurantMenuItemModel = model<RestaurantMenuItem>('RestaurantMenuItem', menuItemSchema);
export const RestaurantTableModel = model('RestaurantTable', tableSchema);
export const RestaurantOrderModel = model('RestaurantOrder', orderSchema);
