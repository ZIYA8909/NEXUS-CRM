import { Schema, model, Document, Types } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: 'Technology' | 'Healthcare' | 'Finance' | 'Manufacturing' | 'Retail' | 'Energy' | 'Other';
  leadSource: 'Website' | 'Referral' | 'Cold Outreach' | 'LinkedIn' | 'Partner' | 'Event' | 'Other';
  estimatedDealValue: number;
  assignedUser: Types.ObjectId;
  leadStage: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  notes: string[];
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    company: { type: String, required: true, trim: true, index: true },
    industry: { 
      type: String, 
      enum: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Energy', 'Other'],
      default: 'Other',
      index: true
    },
    leadSource: { 
      type: String, 
      enum: ['Website', 'Referral', 'Cold Outreach', 'LinkedIn', 'Partner', 'Event', 'Other'],
      default: 'Website',
      index: true
    },
    estimatedDealValue: { type: Number, default: 0, index: true },
    assignedUser: { type: Schema.Types.ObjectId, ref: 'User', indexed: true },
    leadStage: { 
      type: String, 
      enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'],
      default: 'New',
      index: true 
    },
    notes: [{ type: String }],
    lastActivityAt: { type: Date, default: Date.now, index: true }
  },
  { 
    timestamps: true 
  }
);

export const Lead = model<ILead>('Lead', LeadSchema);
