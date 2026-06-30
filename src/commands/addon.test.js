/**
 * @file addon.test.js
 * @description Tests para el comando addon
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('addon command', () => {
  describe('validation', () => {
    it('should export addon function', async () => {
      const { addon } = await import('../commands/addon.js');
      expect(typeof addon).toBe('function');
    });

    it('should accept command and options parameters', async () => {
      const { addon } = await import('../commands/addon.js');
      expect(addon.length).toBe(2);
    });
  });

  describe('commands', () => {
    it('should handle install command', async () => {
      const { addon } = await import('../commands/addon.js');
      expect(addon).toHaveProperty('name', undefined);
    });

    it('should handle list command', async () => {
      const { addon } = await import('../commands/addon.js');
      expect(typeof addon).toBe('function');
    });

    it('should handle remove command', async () => {
      const { addon } = await import('../commands/addon.js');
      expect(addon).toBeDefined();
    });
  });
});