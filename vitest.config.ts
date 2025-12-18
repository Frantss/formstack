import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import paths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [paths(), react()],
  test: {
    browser: {
      provider: playwright({}),
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1280, height: 720 },
    },
    globals: false,
    coverage: {
      enabled: false,
      reporter: 'html',
      provider: 'v8',
    },
    include: ['**/*.spec.{ts,tsx}'],
  },
});
