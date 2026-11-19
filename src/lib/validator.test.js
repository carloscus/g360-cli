/**
 * @file validator.test.js
 * @description Tests para el módulo validator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { validator } from '../lib/validator.js';

describe('validator module', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-validator-test-'));
  });

  afterEach(async () => {
    if (tmpDir) await fs.remove(tmpDir);
  });

  describe('isValidProjectName', () => {
    it('should accept valid project names', () => {
      expect(validator.isValidProjectName('my-project')).toBe(true);
      expect(validator.isValidProjectName('project123')).toBe(true);
      expect(validator.isValidProjectName('my-project-123')).toBe(true);
      expect(validator.isValidProjectName('123project')).toBe(true); // Empieza con número es válido según la regex actual
    });

    it('should reject invalid project names', () => {
      expect(validator.isValidProjectName('My-Project')).toBe(false); // Mayúsculas
      expect(validator.isValidProjectName('my_project')).toBe(false); // Guiones bajos
      expect(validator.isValidProjectName('my project')).toBe(false); // Espacios
      expect(validator.isValidProjectName('-project')).toBe(false); // Empieza con guion
      expect(validator.isValidProjectName('')).toBe(false); // Vacío
    });
  });

  describe('isValidPath', () => {
    it('should return true for existing paths', () => {
      expect(validator.isValidPath(tmpDir)).toBe(true);
    });

    it('should return false for non-existing paths', () => {
      expect(validator.isValidPath(path.join(tmpDir, 'no-existe'))).toBe(false);
    });

    it('should handle errors gracefully', () => {
      expect(validator.isValidPath(null)).toBe(false);
    });
  });

  describe('validateProject', () => {
    it('should validate a valid G360 project', async () => {
      await fs.writeJson(path.join(tmpDir, 'g360-manifest.json'), {}, { spaces: 2 });
      await fs.mkdirp(path.join(tmpDir, 'g360'));

      const result = validator.validateProject(tmpDir);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return errors for non-existing project', () => {
      const result = validator.validateProject(path.join(tmpDir, 'non-existing'));

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project directory does not exist');
    });

    it('should return warnings for missing G360 files', async () => {
      await fs.mkdirp(tmpDir);

      const result = validator.validateProject(tmpDir);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No g360-manifest.json found');
      expect(result.warnings).toContain('No g360 directory found');
    });

    it('should handle partial G360 setup', async () => {
      await fs.writeJson(path.join(tmpDir, 'g360-manifest.json'), {}, { spaces: 2 });

      const result = validator.validateProject(tmpDir);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No g360 directory found');
    });
  });
});
