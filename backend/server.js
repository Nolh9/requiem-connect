import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 10000);
const HOST = '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_REQUIEM_CONNECT_SECRET';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'requiem.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const app = express();
const now = () => new Date().toISOString();
const normalize = v => String(v || '').trim().toLowerCase();

const publicUser = u => ({
  id: u.id,
  email: u.email,
  username: u.username,
  displayName: u.displayName,
  bio: u.bio || '',
  status: u.status || 'En ligne',
  createdAt: u.createdAt
});

const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

await db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  displayName TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  status TEXT DEFAULT 'En ligne',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  channelId TEXT NOT NULL,
  userId TEXT,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  system INTEGER DEFAULT 0,
  FOREIGN KEY(channelId) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
);
`);

const channels = [
  ['general', 'général', 'Discussion principale du serveur.'],
  ['annonces', 'annonces', 'Informations importantes et décisions.'],
  ['projets', 'projets', 'Suivi opérationnel des projets.'],
  ['support', 'support', 'Demandes, incidents et entraide.'],
  ['regles', 'règles', 'Cadre d’utilisation du réseau.']
];

for (const [id, name, description] of channels) {
  await db.run(
    'INSERT OR IGNORE INTO channels(id,name,description,createdAt) VALUES(?,?,?,?)',
    id,
    name,
    description,
    now()
  );
}

const messageCount = await db.get('SELECT COUNT(*) AS count FROM messages');

if (!messageCount.count) {
  const seed = [
    ['general', 'Requiem System', 'Bienvenue dans Requiem Connect — communication textuelle sécurisée active.'],
    ['annonces', 'Requiem System', 'Produit configuré en texte uniquement : aucun vocal, aucun bot.'],
    ['projets', 'Requiem System', 'Centraliser ici les décisions, tâches et points bloquants.'],
    ['support', 'Requiem System', 'Décris ton problème clairement : contexte, action faite, résultat attendu.'],
    ['regles', 'Requiem System', 'Respect, confidentialité, messages clairs. Aucun spam, aucune commande automatisée.']
  ];

  for (const [channelId, author, body] of seed) {
    await db.run(
      'INSERT INTO messages(id,channelId,userId,author,body,createdAt,system) VALUES(?,?,?,?,?,?,1)',
      crypto.randomUUID(),
      channelId,
      null,
      author,
      body,
      now()
    );
  }
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function sign(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'AUTH_REQUIRED' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT * FROM users WHERE id=?', payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    product: 'requiem-connect',
    mode: 'text-only'
  });
});

app.post('/api/auth/register', async (req, res) => {
  const email = normalize(req.body.email);
  const username = normalize(req.body.username).replace(/\s+/g, '-');
  const displayName = String(req.body.displayName || '').trim();
  const password = String(req.body.password || '');

  if (!email || !username || !displayName || password.length < 8) {
    return res.status(400).json({
      error: 'Données invalides. Mot de passe : 8 caractères minimum.'
    });
  }

  const exists = await db.get(
    'SELECT id FROM users WHERE email=? OR username=?',
    email,
    username
  );

  if (exists) {
    return res.status(409).json({
      error: 'Email ou nom utilisateur déjà utilisé.'
    });
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    username,
    displayName,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: now()
  };

  await db.run(
    'INSERT INTO users(id,email,username,displayName,passwordHash,createdAt) VALUES(?,?,?,?,?,?)',
    user.id,
    user.email,
    user.username,
    user.displayName,
    user.passwordHash,
    user.createdAt
  );

  res.status(201).json({
    token: sign(user),
    user: publicUser(user)
  });
});

app.post('/api/auth/login', async (req, res) => {
  const login = normalize(req.body.emailOrUsername);
  const password = String(req.body.password || '');

  const user = await db.get(
    'SELECT * FROM users WHERE email=? OR username=?',
    login,
    login
  );

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({
      error: 'Identifiants invalides.'
    });
  }

  res.json({
    token: sign(user),
    user: publicUser(user)
  });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.patch('/api/me', auth, async (req, res) => {
  const displayName = String(req.body.displayName || req.user.displayName).trim();
  const username = normalize(req.body.username || req.user.username).replace(/\s+/g, '-');
  const bio = String(req.body.bio || '').trim().slice(0, 500);

  await db.run(
    'UPDATE users SET displayName=?, username=?, bio=? WHERE id=?',
    displayName,
    username,
    bio,
    req.user.id
  );

  const user = await db.get('SELECT * FROM users WHERE id=?', req.user.id);

  res.json({ user: publicUser(user) });
});

app.get('/api/users', auth, async (_, res) => {
  const users = await db.all('SELECT * FROM users ORDER BY createdAt DESC LIMIT 50');
  res.json({ users: users.map(publicUser) });
});

app.get('/api/channels', auth, async (_, res) => {
  const rows = await db.all(
    'SELECT id,name,description,createdAt FROM channels ORDER BY rowid'
  );

  res.json({ channels: rows });
});

app.post('/api/channels', auth, async (req, res) => {
  const name = normalize(req.body.name)
    .replace(/[^a-z0-9\-à-ÿ]/gi, '-')
    .slice(0, 32);

  const description = String(req.body.description || 'Salon textuel.')
    .trim()
    .slice(0, 140);

  if (!name) {
    return res.status(400).json({ error: 'Nom de salon invalide.' });
  }

  const id = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/gi, '-');

  try {
    await db.run(
      'INSERT INTO channels(id,name,description,createdAt) VALUES(?,?,?,?)',
      id,
      name,
      description,
      now()
    );

    res.status(201).json({
      channel: {
        id,
        name,
        description,
        createdAt: now()
      }
    });
  } catch {
    res.status(409).json({ error: 'Salon déjà existant.' });
  }
});

app.get('/api/channels/:id/messages', auth, async (req, res) => {
  const rows = await db.all(
    `
    SELECT 
      m.id,
      m.channelId,
      m.author,
      m.body,
      m.createdAt,
      m.system,
      u.username,
      u.displayName
    FROM messages m
    LEFT JOIN users u ON u.id = m.userId
    WHERE m.channelId = ?
    ORDER BY m.createdAt ASC
    LIMIT 300
    `,
    req.params.id
  );

  res.json({ messages: rows });
});

app.post('/api/channels/:id/messages', auth, async (req, res) => {
  const body = String(req.body.body || '').trim().slice(0, 1000);

  const channel = await db.get(
    'SELECT id FROM channels WHERE id=?',
    req.params.id
  );

  if (!channel) {
    return res.status(404).json({ error: 'Salon introuvable.' });
  }

  if (!body) {
    return res.status(400).json({ error: 'Message vide.' });
  }

  const id = crypto.randomUUID();

  await db.run(
    'INSERT INTO messages(id,channelId,userId,author,body,createdAt,system) VALUES(?,?,?,?,?,?,0)',
    id,
    req.params.id,
    req.user.id,
    req.user.displayName,
    body,
    now()
  );

  const message = await db.get('SELECT * FROM messages WHERE id=?', id);

  res.status(201).json({ message });
});

app.delete('/api/channels/:id/messages', auth, async (req, res) => {
  await db.run(
    'DELETE FROM messages WHERE channelId=? AND system=0',
    req.params.id
  );

  res.status(204).end();
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Requiem Connect backend running on http://${HOST}:${PORT}`);
});
