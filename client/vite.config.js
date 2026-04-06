import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tailwind v4 emits custom at-rules that trigger noisy warnings in lightningcss.
  // esbuild keeps the output clean while preserving the same build behavior here.
  cssMinify: 'esbuild',
});
