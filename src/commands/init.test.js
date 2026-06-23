/**
 * @file init.test.js
 * @description Tests para el comando init
 */

import { describe, it, expect } from 'vitest';

describe('init command', () => {
  it('should export init function', async () => {
    const mod = await import('../commands/init.js');
    expect(mod).toHaveProperty('init');
    expect(typeof mod.init).toBe('function');
  });

  it('should accept name and options parameters', async () => {
    const { init } = await import('../commands/init.js');
    expect(init.length).toBe(2);
  });
});
