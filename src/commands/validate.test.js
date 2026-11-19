/**
 * @file validate.test.js
 * @description Tests para el comando validate
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('validate command', () => {
  describe('export', () => {
    it('should export validate function', async () => {
      const mod = await import('../commands/validate.js');
      expect(mod).toHaveProperty('validate');
      expect(typeof mod.validate).toBe('function');
    });

    it('should accept paths and options parameters', async () => {
      const { validate } = await import('../commands/validate.js');
      expect(validate.length).toBe(2);
    });
  });

  describe('schema validation', () => {
    it('should validate a valid skill against skills schema', async () => {
      const { assetValidator } = await import('../lib/asset-validator.js');

      const validSkill = {
        name: 'test-skill',
        description: 'A test skill',
        device: 'pc',
        colors: {
          bg: '#0b1220',
          surface: '#151e2e',
          accent: '#00796B',
          text: '#f0f4f8',
          muted: '#94a3b8',
        },
        signature: {
          mode: 'powered',
          text: 'powered by G360',
        },
      };

      const result = await assetValidator.validateSkills({ skills: [validSkill] });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail with descriptive error when a required field is missing', async () => {
      const { assetValidator } = await import('../lib/asset-validator.js');

      const invalidSkill = {
        name: 'test-skill',
        // falta description, device, colors, signature
      };

      const result = await assetValidator.validateSkills({ skills: [invalidSkill] });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join(' ')).toContain('required');
    });
  });

  describe('--json flag support', () => {
    it('should accept json option without breaking', async () => {
      const { validate } = await import('../commands/validate.js');

      await validate(['.'], { recursive: false, json: true });

      // No debe lanzar y debe aceptar la opción json
      expect(true).toBe(true);
    });
  });
});
