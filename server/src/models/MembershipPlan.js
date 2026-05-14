import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true, unique: true },
    title: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    priceAmount: { type: Number, required: true, min: 0 },
    period: { type: String, default: '/month', trim: true },
    validityDays: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true },
    features: [{ type: String, required: true, trim: true }],
    cta: { type: String, required: true, trim: true },
    popular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model('MembershipPlan', membershipPlanSchema, 'MembershipPlans');
