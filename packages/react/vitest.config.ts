import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vitest/config';
import base from '../../vitest.config';

export default mergeConfig(
  base,
  defineConfig({
    plugins: [react()],
  }),
);
