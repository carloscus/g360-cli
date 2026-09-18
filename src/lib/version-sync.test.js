/**
 * @file version-sync.test.js
 * @description Invariante de release: la version esta sincronizada
 * entre package.json y opencode-config.json.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

describe('version sync', () => {
  it('package.json and opencode-config.json share the same version', () => {
    const pkg = fs.readJsonSync(path.join(ROOT, 'package.json'));
    const oc = fs.readJsonSync(path.join(ROOT, 'opencode-config.json'));
    expect(oc.version).toBe(pkg.version);
  });

  it('version follows semver', () => {
    const pkg = fs.readJsonSync(path.join(ROOT, 'package.json'));
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
