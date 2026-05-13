/**
 * @file set-skill.test.js
 * @description Tests para el comando set-skill
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { setSkill } from '../commands/set-skill.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock de fs-extra
vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readJson: vi.fn(),
    readJsonSync: vi.fn(),
    writeJson: vi.fn()
  }
}));

describe('set-skill command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mockear console.log para evitar output en los tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('valid skill selection', () => {
    it('should set skill successfully', async () => {
      const mockSkills = {
        skills: [
          { name: 'corporativo', description: 'Proyectos corporativos', device: 'pc', colors: { accent: '#00796B' }, signature: { mode: 'powered' } }
        ]
      };

      fs.readJson.mockResolvedValue(mockSkills);
      fs.existsSync.mockReturnValue(false);
      fs.writeJson.mockResolvedValue();

      await setSkill('corporativo', { verbose: false, cwd: process.cwd() });

      expect(fs.writeJson).toHaveBeenCalled();
    });

    it('should overwrite existing skill with --force', async () => {
      const mockSkills = {
        skills: [
          { name: 'corporativo', description: 'Proyectos corporativos', device: 'pc', colors: { accent: '#00796B' }, signature: { mode: 'powered' } }
        ]
      };

      fs.readJson.mockResolvedValue(mockSkills);
      fs.existsSync.mockReturnValue(true);
      fs.writeJson.mockResolvedValue();

      await setSkill('corporativo', { verbose: false, force: true, cwd: process.cwd() });

      expect(fs.writeJson).toHaveBeenCalled();
    });
  });

  describe('invalid skill selection', () => {
    it('should reject invalid skill name', async () => {
      const mockSkills = {
        skills: [
          { name: 'corporativo', description: 'Proyectos corporativos', device: 'pc' }
        ]
      };

      fs.readJson.mockResolvedValue(mockSkills);

      await setSkill('invalid-skill', { verbose: false, cwd: process.cwd() });

      expect(fs.writeJson).not.toHaveBeenCalled();
    });

    it('should handle missing skills config file', async () => {
      fs.readJson.mockRejectedValue(new Error('File not found'));

      await setSkill('corporativo', { verbose: false, cwd: process.cwd() });

      expect(fs.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('skill already exists', () => {
    it('should not overwrite without --force', async () => {
      const mockSkills = {
        skills: [
          { name: 'corporativo', description: 'Proyectos corporativos', device: 'pc', colors: { accent: '#00796B' }, signature: { mode: 'powered' } }
        ]
      };

      fs.readJsonSync.mockReturnValue(mockSkills);
      fs.existsSync.mockReturnValue(true);

      await setSkill('corporativo', { verbose: false, force: false, cwd: process.cwd() });

      expect(fs.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('verbose output', () => {
    it('should show detailed colors with --verbose', async () => {
      const mockSkills = {
        skills: [
          { 
            name: 'corporativo', 
            description: 'Proyectos corporativos', 
            device: 'pc',
            colors: { bg: '#0b1220', surface: '#151e2e', accent: '#00796B', text: '#f0f4f8', muted: '#94a3b8' },
            signature: { mode: 'powered' }
          }
        ]
      };

      fs.readJson.mockResolvedValue(mockSkills);
      fs.existsSync.mockReturnValue(false);
      fs.writeJson.mockResolvedValue();

      await setSkill('corporativo', { verbose: true, cwd: process.cwd() });

      expect(fs.writeJson).toHaveBeenCalled();
    });
  });
});