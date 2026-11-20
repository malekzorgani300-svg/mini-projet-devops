import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement local (npm run dev), les appels /api sont redirigés vers le backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
