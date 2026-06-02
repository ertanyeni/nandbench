import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Build is split into named chunks so the initial load only ships the
 * shell + canvas — everything event-driven (lessons, glossary, modals)
 * is fetched on demand via React.lazy in App.tsx.
 *
 * Targets after split:
 *   index.js            < 350 KB raw / < 110 KB gzip   (shell + canvas + engine)
 *   chunk-lessons.js    largest lazy chunk             (lesson catalogue + figures)
 *   chunk-vendor-*.js   stable, long-cached vendor bundles
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
            if (id.includes('zustand')) return 'vendor-state';
            return 'vendor';
          }
          if (id.includes('packages/engine/')) return 'engine';
          if (
            id.includes('/src/lessons.ts') ||
            id.includes('/src/glossary.ts') ||
            id.includes('/src/i18n/curriculum-en.ts') ||
            id.includes('/src/i18n/curriculum-tr.ts') ||
            id.includes('/src/ui/LessonFigure.tsx')
          ) {
            return 'lessons';
          }
          if (id.includes('/src/fixtures/templates.ts')) return 'templates';
          return undefined;
        },
      },
    },
  },
});
