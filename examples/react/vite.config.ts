import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  plugins: [react()],
  resolve: {
    alias: {
      'oxform-core': fileURLToPath(new URL('../../packages/core/export/index.ts', import.meta.url)),
      'oxform-react': fileURLToPath(new URL('../../packages/react/export/index.ts', import.meta.url)),
    },
  },
});
