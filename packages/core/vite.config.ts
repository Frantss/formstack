import { defineConfig } from 'vite-plus';
import { base } from '../../vite.config';

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    coverage: {
      ...base.test?.coverage,
      enabled: false,
      provider: 'v8' as const,
      reporter: ['text', 'html'] as const,
      // @ts-expect-error Vitest coverage accepts this option at runtime, but the vite-plus config type omits it.
      all: true,
      include: ['src/constants.ts', 'src/form/**/*.ts', 'src/utils/**/*.ts'],
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/**/tests/**',
        'src/tests/**',
        'src/types/**',
        'src/utils/fields/field-entry.ts',
        'src/utils/fields/field-set-options.ts',
        'src/utils/fields/persisted-fields.ts',
        'src/utils/update/updater-.ts',
        'src/utils/update/updater-fn.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  pack: {
    entry: {
      index: 'export/index.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
    clean: true,
    deps: {
      alwaysBundle: [/#.*/],
    },
  },
});
