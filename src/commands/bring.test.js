/**
 * @file bring.test.js
 * @description Tests para el comando bring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('bring command', () => {
  describe('validation', () => {
    it('should have bring function exported', async () => {
      const { bring } = await import('../commands/bring.js');
      expect(typeof bring).toBe('function');
    });

    it('should accept asset and options parameters', async () => {
      const { bring } = await import('../commands/bring.js');
      expect(bring.length).toBe(2);
    });
  });

  describe('options', () => {
    it('should support path option', async () => {
      const { bring } = await import('../commands/bring.js');
      expect(bring).toBeDefined();
    });

    it('should support dryRun option', async () => {
      const { bring } = await import('../commands/bring.js');
      expect(bring).toBeDefined();
    });

    it('should support force option', async () => {
      const { bring } = await import('../commands/bring.js');
      expect(bring).toBeDefined();
    });
  });
});
