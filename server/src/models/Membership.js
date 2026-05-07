import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    company: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    plan: { type: String, enum: ['free', 'silver', 'gold'], required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    activatedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    paymentMethod: { type: String, default: 'No Payment Required' },
  },
  { timestamps: true },
);

export default mongoose.model('Membership', membershipSchema, 'memberships');
