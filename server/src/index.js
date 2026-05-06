import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const MEMBERSHIP_QUERY_FILE = path.join(DATA_DIR, 'memberships.query.json');

app.use(cors());
app.use(express.json());

async function ensureMembershipQueryFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(MEMBERSHIP_QUERY_FILE, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(MEMBERSHIP_QUERY_FILE, '[]\n');
  }
}

async function readMemberships() {
  await ensureMembershipQueryFile();
  const fileContent = await readFile(MEMBERSHIP_QUERY_FILE, 'utf8');
  return JSON.parse(fileContent || '[]');
}

async function writeMemberships(memberships) {
  await ensureMembershipQueryFile();
  await writeFile(MEMBERSHIP_QUERY_FILE, `${JSON.stringify(memberships, null, 2)}\n`);
}

app.get('/api/health', (_req, res) => {
  res.json({ message: 'CRM API is running', storage: MEMBERSHIP_QUERY_FILE });
});

app.get('/api/memberships', async (_req, res) => {
  const members = await readMemberships();
  res.json(members.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
});

app.post('/api/memberships', async (req, res) => {
  const { email, ...payload } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const now = new Date().toISOString();
  const normalizedEmail = email.toLowerCase();
  const members = await readMemberships();
  const existingIndex = members.findIndex((member) => member.email.toLowerCase() === normalizedEmail);
  const member = {
    id: existingIndex >= 0 ? members[existingIndex].id : randomUUID(),
    ...payload,
    email: normalizedEmail,
    createdAt: existingIndex >= 0 ? members[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) members[existingIndex] = member;
  else members.push(member);

  await writeMemberships(members);
  return res.status(201).json(member);
});

async function startServer() {
  await ensureMembershipQueryFile();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Membership query file: ${MEMBERSHIP_QUERY_FILE}`);
  });
}

startServer();
