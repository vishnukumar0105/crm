import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MembershipPlan from './models/MembershipPlan.js';
import UserDetail from './models/UserDetail.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const USER_COLLECTION = 'UserDetails';
const PLAN_COLLECTION = 'MembershipPlans';

const defaultPlans = [
  {
    key: 'free',
    title: 'Free',
    price: '$0',
    priceAmount: 0,
    period: '/month',
    validityDays: 30,
    description: 'Perfect for very small teams getting started.',
    features: ['Up to 5 employees', 'Basic attendance logs', 'Community support'],
    cta: 'Get Started',
    sortOrder: 1,
  },
  {
    key: 'silver',
    title: 'Silver',
    price: '$29',
    priceAmount: 29,
    period: '/month',
    validityDays: 30,
    description: 'Built for growing teams that need automation.',
    features: ['Up to 100 employees', 'Payroll exports', 'Shift scheduling', 'Priority support'],
    cta: 'Choose Silver',
    popular: true,
    sortOrder: 2,
  },
  {
    key: 'gold',
    title: 'Gold',
    price: '$79',
    priceAmount: 79,
    period: '/month',
    validityDays: 365,
    description: 'Advanced controls and insights for larger organizations.',
    features: ['Unlimited employees', 'Smart analytics dashboard', 'Multi-branch management', '24/7 premium support'],
    cta: 'Choose Gold',
    sortOrder: 3,
  },
];

function buildMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const server = process.env.MONGODB_SERVER || '127.0.0.1:27017';
  const database = process.env.MONGODB_DATABASE || 'Subscription';
  const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  if (username && password) {
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${server}/${database}?authSource=${encodeURIComponent(authSource)}`;
  }

  return `mongodb://${server}/${database}`;
}

app.use(cors());
app.use(express.json());

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

async function seedMembershipPlans() {
  await Promise.all(
    defaultPlans.map((plan) => MembershipPlan.findOneAndUpdate(
      { key: plan.key },
      { $setOnInsert: plan },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )),
  );
}

function getCardLast4(cardNumber = '') {
  return String(cardNumber).replace(/\D/g, '').slice(-4);
}

app.get('/api/health', (_req, res) => {
  res.json({
    message: 'Membership API is running',
    database: mongoose.connection.name,
    userCollection: USER_COLLECTION,
    planCollection: PLAN_COLLECTION,
  });
});

app.get('/api/membership-plans', asyncRoute(async (_req, res) => {
  const plans = await MembershipPlan.find({ isActive: true }).sort({ sortOrder: 1, priceAmount: 1 });
  res.json(plans);
}));

app.post('/api/membership-plans', asyncRoute(async (req, res) => {
  const { key, ...payload } = req.body;

  if (!key) {
    return res.status(400).json({ message: 'Plan key is required.' });
  }

  const plan = await MembershipPlan.findOneAndUpdate(
    { key: key.toLowerCase() },
    { ...payload, key: key.toLowerCase() },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  return res.status(201).json(plan);
}));

app.get('/api/users', asyncRoute(async (_req, res) => {
  const users = await UserDetail.find()
    .populate('membershipPlan')
    .sort({ updatedAt: -1, createdAt: -1 });
  res.json(users);
}));

app.get('/api/memberships', asyncRoute(async (_req, res) => {
  const users = await UserDetail.find()
    .populate('membershipPlan')
    .sort({ updatedAt: -1, createdAt: -1 });
  res.json(users);
}));

app.post('/api/memberships', asyncRoute(async (req, res) => {
  const { fullName, email, company, phone, paymentMethod, cardName, cardNumber, expiryDate } = req.body;
  const planKey = String(req.body.planKey || req.body.plan || '').toLowerCase();

  if (!fullName || !email || !company || !phone) {
    return res.status(400).json({ message: 'Full name, email, company, and phone are required.' });
  }

  const selectedPlan = await MembershipPlan.findOne({ key: planKey, isActive: true });

  if (!selectedPlan) {
    return res.status(400).json({ message: 'Valid membership plan is required.' });
  }

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt);
  expiresAt.setDate(expiresAt.getDate() + selectedPlan.validityDays);

  const paymentRequired = selectedPlan.priceAmount > 0;
  const user = await UserDetail.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      fullName,
      email: email.toLowerCase(),
      company,
      phone,
      membershipPlan: selectedPlan._id,
      planKey: selectedPlan.key,
      planTitle: selectedPlan.title,
      planPrice: selectedPlan.price,
      status: 'active',
      activatedAt,
      expiresAt,
      paymentMethod: paymentRequired ? paymentMethod : 'No Payment Required',
      cardName: paymentRequired ? cardName : '',
      cardLast4: paymentRequired ? getCardLast4(cardNumber) : '',
      expiryDate: paymentRequired ? expiryDate : '',
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).populate('membershipPlan');

  return res.status(201).json(user);
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

async function startServer() {
  const mongoUri = buildMongoUri();
  await mongoose.connect(mongoUri);
  await seedMembershipPlans();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
    console.log(`User collection: ${USER_COLLECTION}`);
    console.log(`Membership plan collection: ${PLAN_COLLECTION}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
