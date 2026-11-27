import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error:
                    'Backend API server is not running on port 5005. Start the backend in "Emp Face Login" or run "npm run dev" in frontend.'
                })
              );
            }
          });
        }
      }
    }
  }
});
