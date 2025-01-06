import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'src/browser/demo/**'],
    testTimeout: 10000,
    reporters: ['default'],
  },
  esbuild: {
    target: 'node20',
  },
});
