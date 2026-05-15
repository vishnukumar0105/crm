import mongoose from 'mongoose';

const userDetailSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    company: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    membershipPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    planKey: { type: String, enum: ['free', 'silver', 'gold'], required: true },
    planTitle: { type: String, required: true, trim: true },
    planPrice: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    activatedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    paymentMethod: { type: String, default: 'No Payment Required', trim: true },
    cardName: { type: String, default: '', trim: true },
    cardLast4: { type: String, default: '', trim: true },
    expiryDate: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export default mongoose.model('UserDetail', userDetailSchema, 'UserDetails');
