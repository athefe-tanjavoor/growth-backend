import mongoose, { Document, Schema } from 'mongoose';

export interface ITier {
  name: string;
  price: string;
  includes: string[];
}

export interface IPackage extends Document {
  slug: string;
  order: number;
  category: string;
  tiers: ITier[];
}

const TierSchema = new Schema<ITier>(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    includes: { type: [String], default: [] },
  },
  { _id: false }
);

const PackageSchema = new Schema<IPackage>(
  {
    slug: { type: String, required: true, unique: true },
    order: { type: Number, required: true },
    category: { type: String, required: true },
    tiers: { type: [TierSchema], default: [] },
  },
  { timestamps: true }
);

export const Package = mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);
