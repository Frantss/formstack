import { defineConfig } from 'tsdown';

export default defineConfig({
  exports: true,
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
  platform: 'browser',
});
