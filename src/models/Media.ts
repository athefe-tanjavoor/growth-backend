import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  name: string;
  size: string;
  rawSize: number;
  date: string;
  folder: string;
  type: string;
  mime: string;
  preview: string;
  key?: string;
  bucket?: string;
  storageType: 'r2' | 'local' | 'external';
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    name: { type: String, required: true },
    size: { type: String, required: true },
    rawSize: { type: Number, required: true },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    folder: { type: String, default: 'Others' },
    type: { type: String, required: true },
    mime: { type: String, required: true },
    preview: { type: String, default: null },
    key: { type: String, default: null },
    bucket: { type: String, default: null },
    storageType: { type: String, enum: ['r2', 'local', 'external'], default: 'r2' },
  },
  { timestamps: true }
);

export const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
