/**
 * Deployment Control Panel — Express API Server
 *
 * Endpoints:
 *   POST /api/deploy          — queue a new deployment
 *   GET  /api/status/:id      — poll deployment status
 *   GET  /api/deployments     — list all deployments
 */

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const deployRoutes = require('./routes/deploy');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api', deployRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// ── Database + Start ──────────────────────────────────────────────────────────

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deployment-panel');
    console.log('[Server] MongoDB connected.');

    app.listen(PORT, () => {
      console.log(`[Server] API running on http://localhost:${PORT}`);
      console.log(`[Server] Endpoints:`);
      console.log(`         POST http://localhost:${PORT}/api/deploy`);
      console.log(`         GET  http://localhost:${PORT}/api/status/:id`);
      console.log(`         GET  http://localhost:${PORT}/api/deployments`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
