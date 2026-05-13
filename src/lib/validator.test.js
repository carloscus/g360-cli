/**
 * @file validator.test.js
 * @description Tests para el módulo validator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs-extra';
import { validator } from '../lib/validator.js';

// Mock de fs-extra
vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn()
  }
}));

describe('validator module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      fs.existsSync.mockReturnValue(true);
      expect(validator.isValidPath('/existing/path')).toBe(true);
    });

    it('should return false for non-existing paths', () => {
      fs.existsSync.mockReturnValue(false);
      expect(validator.isValidPath('/non/existing/path')).toBe(false);
    });

    it('should handle errors gracefully', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      expect(validator.isValidPath('/error/path')).toBe(false);
    });
  });

  describe('validateProject', () => {
    it('should validate a valid G360 project', () => {
      fs.existsSync.mockImplementation((path) => {
        // El directorio del proyecto existe
        if (path === '/valid/project') return true;
        // El manifest y el directorio g360 existen
        if (path.includes('g360-manifest.json') || path.includes('g360')) return true;
        return false;
      });

      const result = validator.validateProject('/valid/project');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return errors for non-existing project', () => {
      fs.existsSync.mockReturnValue(false);

      const result = validator.validateProject('/non/existing');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Project directory does not exist');
    });

    it('should return warnings for missing G360 files', () => {
      fs.existsSync.mockImplementation((path) => {
        // El directorio del proyecto existe
        if (path === '/project/without/g360') return true;
        // El manifest y el directorio g360 no existen
        return false;
      });

      const result = validator.validateProject('/project/without/g360');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No g360-manifest.json found');
      expect(result.warnings).toContain('No g360 directory found');
    });

    it('should handle partial G360 setup', () => {
      fs.existsSync.mockImplementation((path) => {
        // El directorio del proyecto existe
        if (path === '/project/partial') return true;
        // Solo el manifest existe
        if (path.includes('g360-manifest.json')) return true;
        // El directorio g360 no existe
        return false;
      });

      const result = validator.validateProject('/project/partial');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No g360 directory found');
    });
  });
});