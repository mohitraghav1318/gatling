import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  // Tailwind v4 emits custom at-rules that trigger noisy warnings in lightningcss.
  // esbuild keeps the output clean while preserving the same build behavior here.
  build: {
    cssMinify: 'esbuild',
  },
});
