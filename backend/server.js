const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const connectMongo  = require('./config/mongo');
const pool          = require('./config/postgres');
const { seedAdmin } = require('./config/seed');

const authRoutes         = require('./routes/auth');
const accountRoutes      = require('./routes/account');
const reservationsRoutes = require('./routes/reservations');
const contentRoutes      = require('./routes/content');
const mediaRoutes        = require('./routes/media');
const adminRoutes        = require('./routes/admin');
const subscriptionsRoutes = require('./routes/subscriptions');   // ← AJOUTE CETTE LIGNE
const app = express();

// ── Faire confiance au proxy de Render ──────────────────────
// Sans ça, req.protocol renvoie toujours "http" même en prod HTTPS,
// car Render termine le TLS au niveau du proxy et transmet la requête
// en interne via HTTP avec un header X-Forwarded-Proto.
app.set('trust proxy', 1);

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, mobile, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqué pour : ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// ── Routes API ───────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/account',      accountRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/content',      contentRoutes);
app.use('/api/media',        mediaRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);   // ← AJOUTE CETTE LIGNE
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable' }));

// Erreur globale
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Erreur non gérée :', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    message: 'Erreur interne du serveur',
    detail: isDev ? err.message : undefined,
    stack: isDev ? err.stack : undefined,
  });
});

// ── Démarrage ────────────────────────────────────────────────
async function start() {
  await connectMongo();
  const c = await pool.connect();
  console.log('✅ PostgreSQL connecté');
  c.release();
  await seedAdmin();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur sur http://localhost:${PORT}`);
    console.log(`   CORS autorisé : ${allowedOrigins.join(', ')}`);
  });
}

start();