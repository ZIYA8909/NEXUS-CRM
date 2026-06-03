import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  leadId?: Types.ObjectId;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  industry: string;
  revenueGenerated: number;
  customerSince: Date;
  assignedManager: Types.ObjectId;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' }
    },
    industry: { type: String, default: 'Other', index: true },
    revenueGenerated: { type: Number, default: 0, index: true },
    customerSince: { type: Date, default: Date.now },
    assignedManager: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: [{ type: String }]
  },
  { 
    timestamps: true 
  }
);

export const Customer = model<ICustomer>('Customer', CustomerSchema);
