import { Schema, model } from 'mongoose';

const base = {
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
};

const rentalEquipmentSchema = new Schema({
  ...base,
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  unit: { type: String, required: true, trim: true, default: 'piece' },
  totalQuantity: { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
  dailyRate: { type: Number, required: true, min: 0 },
  depositPerUnit: { type: Number, required: true, min: 0, default: 0 },
  itemType: { type: String, enum: ['main', 'accessory'], required: true, default: 'main' },
  compatibleWith: { type: String, trim: true, default: '' },
  condition: { type: String, enum: ['good', 'maintenance', 'retired'], default: 'good' },
}, { timestamps: true, versionKey: false });
rentalEquipmentSchema.index({ businessId: 1, code: 1 }, { unique: true });

const rentalSchema = new Schema({
  ...base,
  rentalNumber: { type: String, required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, trim: true, lowercase: true, default: '' },
  projectLocation: { type: String, trim: true, default: '' },
  driverName: { type: String, trim: true, default: '' },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  daysUsed: { type: Number, required: true, min: 1, default: 1 },
  returnedAt: Date,
  items: [{
    equipmentId: { type: Schema.Types.ObjectId, ref: 'RentalEquipment', required: true },
    name: { type: String, required: true },
    itemType: { type: String, enum: ['main', 'accessory'], required: true, default: 'main' },
    compatibleWith: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    dailyRate: { type: Number, required: true, min: 0 },
    depositPerUnit: { type: Number, required: true, min: 0, default: 0 },
    days: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  }],
  subtotal: { type: Number, required: true, min: 0 },
  deposit: { type: Number, required: true, min: 0 },
  deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  additionalCharges: { type: Number, required: true, min: 0, default: 0 },
  amountPaid: { type: Number, required: true, min: 0, default: 0 },
  payments: [{
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'mobile_money', 'bank_transfer', 'card', 'other'], required: true, default: 'cash' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, required: true, default: Date.now },
  }],
  status: { type: String, enum: ['active', 'returned', 'cancelled'], default: 'active' },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  notes: { type: String, trim: true, default: '' },
  returnNotes: { type: String, trim: true, default: '' },
  activity: [{
    type: { type: String, enum: ['created', 'payment', 'days_adjusted', 'extended', 'charge_added', 'returned', 'cancelled'], required: true },
    description: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    occurredAt: { type: Date, required: true, default: Date.now },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });
rentalSchema.index({ businessId: 1, rentalNumber: 1 }, { unique: true });

export const RentalEquipmentModel = model('RentalEquipment', rentalEquipmentSchema);
export const RentalModel = model('Rental', rentalSchema);
