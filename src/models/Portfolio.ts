import mongoose, { Document, Schema } from 'mongoose';

export interface IPortfolio extends Document {
  title: string;
  subtitle?: string;
  category: string;
  services: string[];
  status: 'Published' | 'Draft';
  featured: boolean;
  image: string;
  description?: string;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    services: { type: [String], default: [] },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Draft' },
    featured: { type: Boolean, default: false },
    image: { type: String, default: '/placeholder.jpg' },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Portfolio = mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
