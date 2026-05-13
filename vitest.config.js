import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/tests/**'
      ]
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs}'],
    exclude: ['node_modules', 'dist']
  }
});