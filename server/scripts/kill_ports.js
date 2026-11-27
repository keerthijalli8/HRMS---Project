import { execSync } from 'node:child_process';

for (const port of [5000, 5001, 5174, 5175]) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
    const pids = new Set();
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          pids.add(pid);
        }
      }
    }
    for (const pid of pids) {
      console.log(`Killing PID ${pid} listening on port ${port}...`);
      try {
        execSync(`taskkill /F /PID ${pid}`);
      } catch (e) {
        console.warn(`Could not kill PID ${pid}: ${e.message}`);
      }
    }
  } catch {
    // Port not in use
  }
}
console.log('Ports cleanup complete.');
