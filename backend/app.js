const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const client = require('prom-client');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'appdb',
});

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Validation ----------
const MAX_TITLE = 100;

function validateTitle(value) {
  if (typeof value !== 'string') return 'Le titre doit être une chaîne de caractères';
  const title = value.trim();
  if (!title) return 'Le titre est obligatoire';
  if (title.length > MAX_TITLE) return `Le titre ne doit pas dépasser ${MAX_TITLE} caractères`;
  return null;
}

function validateId(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: "L'identifiant doit être un nombre" });
  }
  next();
}

// ---------- Métriques Prometheus (bonus monitoring) ----------
client.collectDefaultMetrics();
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    end({ method: req.method, route, status: res.statusCode });
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ---------- Santé ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// ---------- CRUD tâches ----------
// Create
app.post('/api/tasks', async (req, res) => {
  const error = validateTitle(req.body.title);
  if (error) return res.status(400).json({ error });
  const title = req.body.title.trim();
  try {
    const { rows } = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Read (liste)
app.get('/api/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Read (une tâche)
app.get('/api/tasks/:id', validateId, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tâche introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update
app.put('/api/tasks/:id', validateId, async (req, res) => {
  const { title, done } = req.body;
  if (title !== undefined) {
    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'Le champ done doit être un booléen' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title), done = COALESCE($2, done)
       WHERE id = $3 RETURNING *`,
      [title !== undefined ? title.trim() : null, done !== undefined ? done : null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tâche introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete
app.delete('/api/tasks/:id', validateId, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Tâche introuvable' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = app;
