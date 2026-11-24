import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  orderNumber: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  dueDate: { type: Date, required: true },
  items: [{ garment: { type: String, required: true, trim: true }, service: { type: String, required: true, trim: true }, quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true, min: 0 } }],
  total: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, required: true, min: 0, default: 0 },
  payments: [{ amount: { type: Number, required: true, min: 0 }, method: { type: String, enum: ['cash','mtn_momo','airtel_money','card','bank_transfer','other'], required: true }, recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, recordedAt: { type: Date, required: true, default: Date.now } }],
  activity: [{ action: { type: String, enum: ['created','status_changed','payment_recorded'], required: true }, description: { type: String, required: true }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, occurredAt: { type: Date, required: true, default: Date.now } }],
  status: { type: String, enum: ['received','cleaning','ready','picked_up','cancelled'], default: 'received', index: true },
  pickedUpAt: { type: Date },
  notes: { type: String, trim: true, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });
orderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ businessId: 1, branchId: 1, createdAt: -1 });
export const DryCleaningOrderModel = model('DryCleaningOrder', orderSchema);
