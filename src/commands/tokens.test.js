/**
 * @file tokens.test.js
 * @description Tests para el comando tokens
 */

import { describe, it, expect } from 'vitest';

describe('tokens command', () => {
  it('should export tokens function', async () => {
    const mod = await import('../commands/tokens.js');
    expect(mod).toHaveProperty('tokens');
    expect(typeof mod.tokens).toBe('function');
  });

  it('should accept options parameter', async () => {
    const { tokens } = await import('../commands/tokens.js');
    expect(tokens.length).toBe(1);
  });
});
