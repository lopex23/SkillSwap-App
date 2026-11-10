import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En desarrollo, las peticiones a /api se reenvían al backend Express.
    // Así el navegador ve un solo origen y no hace falta configurar CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
