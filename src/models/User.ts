import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../constants/roles.js';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: Role | string;
  customPermissions?: string[];
  avatar?: string;
  isActive: boolean;
  twoFactorSecret?: string;
  isTwoFactorEnabled: boolean;
  twoFactorRecoveryCodes?: string[];
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: [...Object.values(Role), 'admin', 'editor'], // legacy compatibility with 'editor'
      default: Role.ADMIN 
    },
    customPermissions: { type: [String], default: [] },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    twoFactorSecret: { type: String, default: null },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorRecoveryCodes: { type: [String], default: [] },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving if modified
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
