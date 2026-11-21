import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus = 'new' | 'read' | 'replied' | 'converted' | 'archived';

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  service: string;
  message: string;
  status: LeadStatus;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    businessName: { type: String, trim: true, default: '' },
    service: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'converted', 'archived'],
      default: 'new',
    },
    notes: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
