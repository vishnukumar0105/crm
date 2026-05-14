import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MembershipPlan from './models/MembershipPlan.js';
import UserDetail from './models/UserDetail.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PROVIDER = (process.env.DB_PROVIDER || 'mongodb').toLowerCase();
const USER_COLLECTION = 'UserDetails';
const PLAN_COLLECTION = 'MembershipPlans';
const USER_TABLE = 'user_details';
const PLAN_TABLE = 'membership_plans';

let mysqlPool;
let mongoReady = false;
let mysqlReady = false;
const providerErrors = { mongodb: null, mysql: null };

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

function getMySqlConfig() {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'Subscription',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    namedPlaceholders: true,
  };
}

function toMySqlDateTime(value) {
  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

function parseFeatures(features) {
  if (Array.isArray(features)) return features;
  if (!features) return [];

  try {
    return JSON.parse(features);
  } catch {
    return String(features).split(',').map((feature) => feature.trim()).filter(Boolean);
  }
}

function mapMySqlPlan(row) {
  if (!row) return null;

  return {
    id: row.id,
    key: row.plan_key,
    title: row.title,
    price: row.price,
    priceAmount: Number(row.price_amount),
    period: row.period,
    validityDays: row.validity_days,
    description: row.description,
    features: parseFeatures(row.features),
    cta: row.cta,
    popular: Boolean(row.popular),
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMySqlUser(row) {
  if (!row) return null;

  const membershipPlan = mapMySqlPlan({
    id: row.membership_plan_id,
    plan_key: row.plan_key,
    title: row.plan_title,
    price: row.plan_price,
    price_amount: row.plan_price_amount ?? 0,
    period: row.plan_period ?? '/month',
    validity_days: row.plan_validity_days ?? 30,
    description: row.plan_description ?? '',
    features: row.plan_features ?? '[]',
    cta: row.plan_cta ?? 'Choose Plan',
    popular: row.plan_popular ?? 0,
    is_active: 1,
    sort_order: row.plan_sort_order ?? 0,
    created_at: row.plan_created_at,
    updated_at: row.plan_updated_at,
  });

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    company: row.company,
    phone: row.phone,
    membershipPlan,
    planKey: row.plan_key,
    planTitle: row.plan_title,
    planPrice: row.plan_price,
    status: row.status,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    paymentMethod: row.payment_method,
    cardName: row.card_name,
    cardLast4: row.card_last4,
    expiryDate: row.expiry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.use(cors());
app.use(express.json());

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

async function createMySqlTables() {
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS ${PLAN_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      plan_key VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(100) NOT NULL,
      price VARCHAR(30) NOT NULL,
      price_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      period VARCHAR(30) NOT NULL DEFAULT '/month',
      validity_days INT NOT NULL,
      description TEXT NOT NULL,
      features JSON NOT NULL,
      cta VARCHAR(100) NOT NULL,
      popular BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS ${USER_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      company VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      membership_plan_id INT NOT NULL,
      plan_key VARCHAR(50) NOT NULL,
      plan_title VARCHAR(100) NOT NULL,
      plan_price VARCHAR(30) NOT NULL,
      status ENUM('active', 'expired') NOT NULL DEFAULT 'active',
      activated_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      payment_method VARCHAR(100) NOT NULL DEFAULT 'No Payment Required',
      card_name VARCHAR(150) DEFAULT '',
      card_last4 VARCHAR(4) DEFAULT '',
      expiry_date VARCHAR(10) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_membership_plan FOREIGN KEY (membership_plan_id) REFERENCES ${PLAN_TABLE}(id)
    )
  `);
}

async function seedMongoMembershipPlans() {
  await Promise.all(
    defaultPlans.map((plan) => MembershipPlan.findOneAndUpdate(
      { key: plan.key },
      { $setOnInsert: plan },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )),
  );
}

async function seedMySqlMembershipPlans() {
  await Promise.all(
    defaultPlans.map((plan) => mysqlPool.execute(
      `INSERT INTO ${PLAN_TABLE}
        (plan_key, title, price, price_amount, period, validity_days, description, features, cta, popular, is_active, sort_order)
       VALUES (:key, :title, :price, :priceAmount, :period, :validityDays, :description, :features, :cta, :popular, :isActive, :sortOrder)
       ON DUPLICATE KEY UPDATE plan_key = plan_key`,
      {
        ...plan,
        features: JSON.stringify(plan.features),
        popular: Boolean(plan.popular),
        isActive: true,
      },
    )),
  );
}

async function seedMembershipPlans(provider = DB_PROVIDER) {
  if (provider === 'mysql') {
    await seedMySqlMembershipPlans();
    return;
  }

  await seedMongoMembershipPlans();
}

function getCardLast4(cardNumber = '') {
  return String(cardNumber).replace(/\D/g, '').slice(-4);
}

function ensureProviderReady(provider) {
  if (provider === 'mysql' && !mysqlReady) {
    const detail = providerErrors.mysql ? ` Last MySQL error: ${providerErrors.mysql}` : '';
    const error = new Error(`MySQL is not connected. Check MYSQL_* settings, mysql2 installation, and DB_COMPARE_PROVIDERS.${detail}`);
    error.statusCode = 503;
    throw error;
  }

  if (provider === 'mongodb' && !mongoReady) {
    const detail = providerErrors.mongodb ? ` Last MongoDB error: ${providerErrors.mongodb}` : '';
    const error = new Error(`MongoDB is not connected. Check MONGODB_* settings and DB_COMPARE_PROVIDERS.${detail}`);
    error.statusCode = 503;
    throw error;
  }
}

function normalizeProvider(provider) {
  const value = String(provider || '').toLowerCase();

  if (!['mongodb', 'mysql'].includes(value)) {
    const error = new Error('Provider must be mongodb or mysql.');
    error.statusCode = 400;
    throw error;
  }

  return value;
}

async function getPlans(provider = DB_PROVIDER) {
  ensureProviderReady(provider);

  if (provider === 'mysql') {
    const [rows] = await mysqlPool.query(`SELECT * FROM ${PLAN_TABLE} WHERE is_active = TRUE ORDER BY sort_order ASC, price_amount ASC`);
    return rows.map(mapMySqlPlan);
  }

  return MembershipPlan.find({ isActive: true }).sort({ sortOrder: 1, priceAmount: 1 });
}

async function upsertPlan(payload) {
  const { key, ...planPayload } = payload;
  const planKey = key.toLowerCase();

  if (DB_PROVIDER === 'mysql') {
    await mysqlPool.execute(
      `INSERT INTO ${PLAN_TABLE}
        (plan_key, title, price, price_amount, period, validity_days, description, features, cta, popular, is_active, sort_order)
       VALUES (:key, :title, :price, :priceAmount, :period, :validityDays, :description, :features, :cta, :popular, :isActive, :sortOrder)
       ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        price = VALUES(price),
        price_amount = VALUES(price_amount),
        period = VALUES(period),
        validity_days = VALUES(validity_days),
        description = VALUES(description),
        features = VALUES(features),
        cta = VALUES(cta),
        popular = VALUES(popular),
        is_active = VALUES(is_active),
        sort_order = VALUES(sort_order)`,
      {
        key: planKey,
        title: planPayload.title,
        price: planPayload.price,
        priceAmount: planPayload.priceAmount,
        period: planPayload.period || '/month',
        validityDays: planPayload.validityDays,
        description: planPayload.description,
        features: JSON.stringify(planPayload.features || []),
        cta: planPayload.cta,
        popular: Boolean(planPayload.popular),
        isActive: planPayload.isActive !== false,
        sortOrder: planPayload.sortOrder || 0,
      },
    );

    const [rows] = await mysqlPool.execute(`SELECT * FROM ${PLAN_TABLE} WHERE plan_key = :key`, { key: planKey });
    return mapMySqlPlan(rows[0]);
  }

  return MembershipPlan.findOneAndUpdate(
    { key: planKey },
    { ...planPayload, key: planKey },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
}

async function getUsers(provider = DB_PROVIDER) {
  ensureProviderReady(provider);

  if (provider === 'mysql') {
    const [rows] = await mysqlPool.query(`
      SELECT
        users.*,
        plans.price_amount AS plan_price_amount,
        plans.period AS plan_period,
        plans.validity_days AS plan_validity_days,
        plans.description AS plan_description,
        plans.features AS plan_features,
        plans.cta AS plan_cta,
        plans.popular AS plan_popular,
        plans.sort_order AS plan_sort_order,
        plans.created_at AS plan_created_at,
        plans.updated_at AS plan_updated_at
      FROM ${USER_TABLE} users
      INNER JOIN ${PLAN_TABLE} plans ON users.membership_plan_id = plans.id
      ORDER BY users.updated_at DESC, users.created_at DESC
    `);
    return rows.map(mapMySqlUser);
  }

  return UserDetail.find()
    .populate('membershipPlan')
    .sort({ updatedAt: -1, createdAt: -1 });
}

async function upsertUser(reqBody) {
  const { fullName, email, company, phone, paymentMethod, cardName, cardNumber, expiryDate } = reqBody;
  const planKey = String(reqBody.planKey || reqBody.plan || '').toLowerCase();

  if (!fullName || !email || !company || !phone) {
    const error = new Error('Full name, email, company, and phone are required.');
    error.statusCode = 400;
    throw error;
  }

  const selectedPlan = DB_PROVIDER === 'mysql'
    ? (await mysqlPool.execute(`SELECT * FROM ${PLAN_TABLE} WHERE plan_key = :planKey AND is_active = TRUE`, { planKey }))[0].map(mapMySqlPlan)[0]
    : await MembershipPlan.findOne({ key: planKey, isActive: true });

  if (!selectedPlan) {
    const error = new Error('Valid membership plan is required.');
    error.statusCode = 400;
    throw error;
  }

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt);
  expiresAt.setDate(expiresAt.getDate() + selectedPlan.validityDays);

  const paymentRequired = selectedPlan.priceAmount > 0;
  const userRecord = {
    fullName,
    email: email.toLowerCase(),
    company,
    phone,
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
  };

  if (DB_PROVIDER === 'mysql') {
    await mysqlPool.execute(
      `INSERT INTO ${USER_TABLE}
        (full_name, email, company, phone, membership_plan_id, plan_key, plan_title, plan_price, status, activated_at, expires_at, payment_method, card_name, card_last4, expiry_date)
       VALUES (:fullName, :email, :company, :phone, :membershipPlanId, :planKey, :planTitle, :planPrice, :status, :activatedAt, :expiresAt, :paymentMethod, :cardName, :cardLast4, :expiryDate)
       ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        company = VALUES(company),
        phone = VALUES(phone),
        membership_plan_id = VALUES(membership_plan_id),
        plan_key = VALUES(plan_key),
        plan_title = VALUES(plan_title),
        plan_price = VALUES(plan_price),
        status = VALUES(status),
        activated_at = VALUES(activated_at),
        expires_at = VALUES(expires_at),
        payment_method = VALUES(payment_method),
        card_name = VALUES(card_name),
        card_last4 = VALUES(card_last4),
        expiry_date = VALUES(expiry_date)`,
      {
        ...userRecord,
        membershipPlanId: selectedPlan.id,
        activatedAt: toMySqlDateTime(activatedAt),
        expiresAt: toMySqlDateTime(expiresAt),
      },
    );

    const [rows] = await mysqlPool.execute(`
      SELECT
        users.*,
        plans.price_amount AS plan_price_amount,
        plans.period AS plan_period,
        plans.validity_days AS plan_validity_days,
        plans.description AS plan_description,
        plans.features AS plan_features,
        plans.cta AS plan_cta,
        plans.popular AS plan_popular,
        plans.sort_order AS plan_sort_order,
        plans.created_at AS plan_created_at,
        plans.updated_at AS plan_updated_at
      FROM ${USER_TABLE} users
      INNER JOIN ${PLAN_TABLE} plans ON users.membership_plan_id = plans.id
      WHERE users.email = :email
    `, { email: userRecord.email });

    return mapMySqlUser(rows[0]);
  }

  return UserDetail.findOneAndUpdate(
    { email: userRecord.email },
    {
      ...userRecord,
      membershipPlan: selectedPlan._id,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).populate('membershipPlan');
}

app.get('/api/health', (_req, res) => {
  res.json({
    message: 'Membership API is running',
    provider: DB_PROVIDER,
    database: DB_PROVIDER === 'mysql' ? getMySqlConfig().database : mongoose.connection.name,
    userStore: DB_PROVIDER === 'mysql' ? USER_TABLE : USER_COLLECTION,
    planStore: DB_PROVIDER === 'mysql' ? PLAN_TABLE : PLAN_COLLECTION,
    providers: {
      mongodb: mongoReady,
      mysql: mysqlReady,
    },
    providerErrors,
  });
});

app.get('/api/membership-plans', asyncRoute(async (_req, res) => {
  res.json(await getPlans());
}));

app.get('/api/providers/:provider/membership-plans', asyncRoute(async (req, res) => {
  const provider = normalizeProvider(req.params.provider);
  await initializeProvider(provider, true);
  res.json(await getPlans(provider));
}));

app.post('/api/membership-plans', asyncRoute(async (req, res) => {
  if (!req.body.key) {
    return res.status(400).json({ message: 'Plan key is required.' });
  }

  return res.status(201).json(await upsertPlan(req.body));
}));

app.get('/api/users', asyncRoute(async (_req, res) => {
  res.json(await getUsers());
}));

app.get('/api/memberships', asyncRoute(async (_req, res) => {
  res.json(await getUsers());
}));

app.get('/api/providers/:provider/memberships', asyncRoute(async (req, res) => {
  const provider = normalizeProvider(req.params.provider);
  await initializeProvider(provider, true);
  res.json(await getUsers(provider));
}));

app.post('/api/memberships', asyncRoute(async (req, res) => {
  return res.status(201).json(await upsertUser(req.body));
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
});

async function initializeMongoDb() {
  if (mongoReady) return;

  const mongoUri = buildMongoUri();
  await mongoose.connect(mongoUri);
  mongoReady = true;
  providerErrors.mongodb = null;
  await seedMembershipPlans('mongodb');
}

async function initializeMySql() {
  if (mysqlReady) return;

  const mysql = await import('mysql2/promise');
  mysqlPool = mysql.createPool(getMySqlConfig());
  await createMySqlTables();
  mysqlReady = true;
  providerErrors.mysql = null;
  await seedMembershipPlans('mysql');
}

async function initializeProvider(provider, required = false) {
  try {
    if (provider === 'mysql') {
      await initializeMySql();
      return;
    }

    await initializeMongoDb();
  } catch (error) {
    providerErrors[provider] = error.message;
    if (required) throw error;
    console.warn(`Optional ${provider} connection skipped: ${error.message}`);
  }
}

async function startServer() {
  await initializeProvider(DB_PROVIDER, true);

  const compareProviders = (process.env.DB_COMPARE_PROVIDERS || 'mongodb,mysql')
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => ['mongodb', 'mysql'].includes(provider));

  await Promise.all([...new Set(compareProviders)].map((provider) => initializeProvider(provider, false)));


  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database provider: ${DB_PROVIDER}`);
    console.log(`Database connected: ${DB_PROVIDER === 'mysql' ? getMySqlConfig().database : mongoose.connection.name}`);
    console.log(`User store: ${DB_PROVIDER === 'mysql' ? USER_TABLE : USER_COLLECTION}`);
    console.log(`Membership plan store: ${DB_PROVIDER === 'mysql' ? PLAN_TABLE : PLAN_COLLECTION}`);
    console.log(`MongoDB viewer: ${mongoReady ? 'ready' : 'not connected'}`);
    console.log(`MySQL viewer: ${mysqlReady ? 'ready' : 'not connected'}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
