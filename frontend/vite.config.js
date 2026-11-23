import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// On Vercel (which sets VERCEL=1) the app is a cross-origin static site: it must be built with an absolute
// HTTPS API URL, otherwise the bundle would silently fall back to a relative /api/v1 that Vercel cannot serve.
// Docker/nginx builds are unaffected because they run without VERCEL and use the same-origin /api proxy.
function requireProductionApiUrl(mode) {
  if (!process.env.VERCEL) return;
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const url = env.VITE_API_BASE_URL;
  if (!url || !/^https:\/\//i.test(url) || /localhost|127\.0\.0\.1/i.test(url)) {
    throw new Error(
      `VITE_API_BASE_URL must be set to the HTTPS backend API root (e.g. https://api.avinyaa.tech/api/v1) for Vercel builds. Received: ${url || '(unset)'}`
    );
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === 'build') requireProductionApiUrl(mode);
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:8000',
        '/uploads': 'http://localhost:8000',
        '/media': 'http://localhost:8000',
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test-setup.js',
      globals: true,
    },
  };
});
