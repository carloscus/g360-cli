import { describe, it, expect } from 'vitest';
import { setup } from './setup.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('setup command', () => {
  it('should export setup function', async () => {
    const mod = await import('./setup.js');
    expect(mod).toHaveProperty('setup');
    expect(typeof mod.setup).toBe('function');
  });

  it('should have --dry-run option', async () => {
    // Mock console.log to capture output
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      await setup({ platform: 'opencode', dryRun: true, reset: false });
      expect(logs.some(l => l.includes('dry-run'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  it('should detect existing installations', async () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      await setup({ platform: 'all', dryRun: true, reset: false });
      // Should detect existing opencode config
      expect(logs.some(l => l.includes('ya instalado') || l.includes('skipped'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });
});
