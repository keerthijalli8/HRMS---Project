// scripts/dev.js
// Starts both the Express backend API server (port 5000) and Vite frontend dev server (port 5174).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting HRMS Face Recognition Backend (:5005) + Frontend (:5174)...');
console.log('➜ HRMS Portal URL: http://localhost:5174 (Direct Camera Access Enabled)\n');

const backend = spawn(process.execPath, ['--watch', 'backend/src/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env }
});

const frontend = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env }
});

function shutdown(signal) {
  console.log(`\nShutting down servers (${signal})...`);
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

backend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Backend exited with code ${code}`);
    frontend.kill('SIGTERM');
    process.exit(code);
  }
});

frontend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Frontend exited with code ${code}`);
    backend.kill('SIGTERM');
    process.exit(code);
  }
});
