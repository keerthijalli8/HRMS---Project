// scripts/dev.js
// Starts the Vite frontend (:5174) and automatically starts the Emp Face Login backend (:5005) if not already running.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendRoot = path.resolve(rootDir, '../Emp Face Login');
const backendEntry = path.join(backendRoot, 'backend', 'src', 'server.js');
const viteEntry = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

function isPortListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const done = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(700);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

let backendProc = null;
let frontendProc = null;

async function main() {
  const backendAlreadyUp = await isPortListening(5005);

  if (backendAlreadyUp) {
    console.log('Backend API already running on http://127.0.0.1:5005');
  } else if (fs.existsSync(backendEntry)) {
    console.log('Starting HRMS Face Login Backend on http://127.0.0.1:5005...');
    backendProc = spawn(process.execPath, ['backend/src/server.js'], {
      cwd: backendRoot,
      stdio: 'inherit',
      env: { ...process.env }
    });
    backendProc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`Backend exited with code ${code}`);
      }
      backendProc = null;
    });
  } else {
    console.warn(
      `[warn] Backend entry not found at ${backendEntry}. Make sure the HRMS backend API is running on port 5005.`
    );
  }

  frontendProc = spawn(process.execPath, [viteEntry], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env }
  });

  frontendProc.on('exit', (code) => {
    if (backendProc && !backendProc.killed) {
      backendProc.kill('SIGTERM');
    }
    process.exit(code ?? 0);
  });
}

function shutdown(signal) {
  if (frontendProc && !frontendProc.killed) {
    frontendProc.kill(signal);
  }
  if (backendProc && !backendProc.killed) {
    backendProc.kill(signal);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
  console.error('Failed to start dev environment:', err);
  process.exit(1);
});
