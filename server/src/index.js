import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Membership from './models/Membership.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm-app';

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    message: 'Membership API is running',
    database: mongoose.connection.name,
    collection: 'memberships',
  });
});

app.get('/api/memberships', async (_req, res) => {
  const members = await Membership.find().sort({ updatedAt: -1, createdAt: -1 });
  res.json(members);
});

app.post('/api/memberships', async (req, res) => {
  const { email, ...payload } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const member = await Membership.findOneAndUpdate(
    { email: email.toLowerCase() },
    { ...payload, email: email.toLowerCase() },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  return res.status(201).json(member);
});

async function startServer() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
    console.log('Membership collection: memberships');
  });
}

startServer();
