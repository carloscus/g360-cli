import { describe, it, expect } from 'vitest';
import { defineConfig } from 'vitest/config';

describe('Vitest config propuesta', () => {
  const currentInclude = ['**/*.{test,spec}.{js,mjs,cjs}'];
  const proposedInclude = ['src/**/*.{test,spec}.{js,mjs,cjs}', '*.test.js', 'setup.*.test.js'];
  const proposedExclude = ['node_modules', 'dist', '.tmp-*', 'tmp-*', '.audit-*'];

  it('proposed include covers all legitimate tests', () => {
    const legitTests = [
      'src/commands/addon.test.js',
      'src/lib/python-runner.test.js',
      'setup.permissions.test.js',
      'setup.permissions.opencode.test.js',
      'src/e2e/setup-bring-audit.test.js',
    ];
    for (const test of legitTests) {
      const matchesSrc = /^src\/.*\.test\.js$/.test(test);
      const matchesRoot = /^\w+\.test\.js$/.test(test) || /^setup\..+\.test\.js$/.test(test);
      expect(matchesSrc || matchesRoot, `${test} should match`).toBe(true);
    }
  });

  it('proposed exclude blocks external dependency tests', () => {
    const externalTests = [
      'node_modules/fast-uri/test/parse.test.js',
      '.tmp-simulate-pack/src/commands/setup.test.js',
    ];
    for (const test of externalTests) {
      const matchesProposed = /^src\/.*\.test\.js$/.test(test)
        || /^\w+\.test\.js$/.test(test)
        || /^setup\..+\.test\.js$/.test(test);
      expect(matchesProposed, `${test} should NOT match`).toBe(false);
    }
  });
});
