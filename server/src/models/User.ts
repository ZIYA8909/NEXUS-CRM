import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'executive';
  status: 'active' | 'inactive';
  avatar?: string;
  phone?: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      index: true 
    },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'manager', 'executive'], 
      default: 'executive' 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive'], 
      default: 'active',
      index: true 
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  { 
    timestamps: true 
  }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);
