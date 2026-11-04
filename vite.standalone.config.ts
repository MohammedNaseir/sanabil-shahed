/**
 * بناء النسخة المستقلة (ملف HTML واحد يعمل دون خادم).
 * نجمع كل الكود في ملف JS واحد بدون تقسيم، ثم يدمجه scripts/make-standalone.js داخل HTML.
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, '.') },
  },
  // الملفات العامة تُدمج كـ data URI في السكربت، فلا نحتاج نسخها
  publicDir: false,
  build: {
    outDir: 'dist-standalone/.build',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1500,
    modulePreload: false,
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
});
