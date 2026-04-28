import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Contact from './models/Contact.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm-app';

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ message: 'CRM API is running' });
});

app.get('/api/contacts', async (_req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  res.json(contacts);
});

app.post('/api/contacts', async (req, res) => {
  const contact = await Contact.create(req.body);
  res.status(201).json(contact);
});

app.put('/api/contacts/:id', async (req, res) => {
  const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    return res.status(404).json({ message: 'Contact not found' });
  }

  return res.json(updated);
});

app.delete('/api/contacts/:id', async (req, res) => {
  const deleted = await Contact.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: 'Contact not found' });
  }

  return res.status(204).send();
});

async function startServer() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
