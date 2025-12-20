import { defineConfig } from 'tsdown';

export default defineConfig({
  exports: {
    enabled: true,
    devExports: true,
  },
  format: ['esm', 'cjs'],
  platform: 'browser',
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
});
