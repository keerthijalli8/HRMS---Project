// backend/src/server.js
import express from 'express';
import cors from 'cors';
import https from 'node:https';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import config from './config/index.js';
import { runMigrations } from './db/migrations.js';
import { seedDatabase } from './db/seed.js';
import { getServerTime } from './utils/serverTime.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import faceRoutes from './routes/faceRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import photoRoutes from './routes/photoRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const app = express();

// Initialize database schema and default seeds
try {
  runMigrations();
  seedDatabase();
} catch (err) {
  console.error('Database initialization error:', err);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Hash']
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Support large webcam image payloads (up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health and System Time
app.get('/api/health', async (req, res) => {
  let faceEngine = { status: 'DOWN' };
  try {
    const r = await fetch('http://127.0.0.1:5001/health', { signal: AbortSignal.timeout(800) });
    if (r.ok) faceEngine = await r.json();
  } catch {
    // Offline
  }

  res.json({
    status: 'UP',
    version: '1.0.0',
    mode: 'FACE_LOGIN_ONLY',
    faceEngine,
    serverTime: getServerTime(),
    dpdpVersion: config.dpdpConsentVersion
  });
});

app.get('/api/time', (req, res) => {
  res.json(getServerTime());
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/photos', photoRoutes);

// Fallback 404 handler for unknown API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found.` });
});

// Serve frontend build if dist exists (Production Single-Port Deployment)
const distDir = path.join(rootDir, 'dist');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

let pythonProc = null;
let isShuttingDown = false;

async function startPythonFaceEngine() {
  const scriptPath = path.join(rootDir, 'python_service', 'face_service.py');
  if (!fs.existsSync(scriptPath)) {
    console.warn('⚠️ python_service/face_service.py not found.');
    return;
  }

  // Skip spawning if external Python service is already healthy
  try {
    const res = await fetch('http://127.0.0.1:5001/health', { signal: AbortSignal.timeout(600) });
    if (res.ok) {
      console.log('✅ Python Face Engine already running on http://127.0.0.1:5001');
      return;
    }
  } catch {
    // Not running yet; spawn below
  }

  const pythonBin = process.env.PYTHON_BIN || 'python';
  pythonProc = spawn(pythonBin, [scriptPath], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ANTISPOOF_THRESHOLD: String(config.antiSpoofThreshold)
    }
  });

  pythonProc.on('error', (err) => {
    console.error('❌ Failed to start Python Face Engine:', err.message);
  });

  pythonProc.on('exit', (code) => {
    pythonProc = null;
    if (!isShuttingDown && code !== 0) {
      console.warn(`⚠️ Python Face Engine exited with code ${code}; restarting in 2s...`);
      setTimeout(startPythonFaceEngine, 2000).unref();
    }
  });
}

function stopPythonFaceEngine() {
  isShuttingDown = true;
  if (pythonProc && !pythonProc.killed) {
    pythonProc.kill('SIGTERM');
    pythonProc = null;
  }
}

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  startPythonFaceEngine();

  process.on('SIGINT', () => {
    stopPythonFaceEngine();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stopPythonFaceEngine();
    process.exit(0);
  });
  process.on('exit', stopPythonFaceEngine);

  const sslCertPath = process.env.SSL_CERT_PATH;
  const sslKeyPath = process.env.SSL_KEY_PATH;

  if (sslCertPath && sslKeyPath && fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath)) {
    const httpsOptions = {
      cert: fs.readFileSync(sslCertPath),
      key: fs.readFileSync(sslKeyPath)
    };
    https.createServer(httpsOptions, app).listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🔒 HRMS FACE LOGIN API SERVER RUNNING (HTTPS)!`);
      console.log(`API URL: https://localhost:${config.port}`);
      console.log(`Face Engine: YuNet + SFace + MiniFASNet (http://127.0.0.1:5001)`);
      console.log(`Server Time (${config.serverTimezone}): ${getServerTime().time}`);
      console.log(`DPDP Act Biometric Policy: ${config.dpdpConsentVersion}`);
      console.log(`======================================================\n`);
    });
  } else {
    app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 HRMS FACE LOGIN API SERVER RUNNING!`);
      console.log(`API URL: http://localhost:${config.port}`);
      console.log(`Face Engine: YuNet + SFace + MiniFASNet (http://127.0.0.1:5001)`);
      console.log(`Server Time (${config.serverTimezone}): ${getServerTime().time}`);
      console.log(`DPDP Act Biometric Policy: ${config.dpdpConsentVersion}`);
      console.log(`======================================================\n`);
    });
  }
}

export default app;
