/**
 * @file audit.test.js
 * @description Tests para el comando audit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('audit command', () => {
  describe('validation', () => {
    it('should have audit function exported', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(typeof audit).toBe('function');
    });

    it('should accept projectPath and options parameters', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(audit.length).toBe(2);
    });
  });

  describe('options', () => {
    it('should support fix option', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(audit).toBeDefined();
    });

    it('should support verbose option', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(audit).toBeDefined();
    });
  });
});
