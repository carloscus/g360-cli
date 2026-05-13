/**
 * @file list.test.js
 * @description Tests para el comando list
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { list } from '../commands/list.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock de fs-extra
vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readJsonSync: vi.fn()
  }
}));

describe('list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list templates', () => {
    it('should list available templates', async () => {
      const mockTemplates = ['web-pwa', 'svelte-web', 'solid-web'];
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(mockTemplates);

      await list('templates', { json: false });

      expect(fs.readdirSync).toHaveBeenCalled();
    });

    it('should return empty array when templates directory does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await list('templates', { json: false });

      expect(fs.readdirSync).not.toHaveBeenCalled();
    });
  });

  describe('list skills', () => {
    it('should list skills from g360-skills.json', async () => {
      const mockSkills = {
        skills: [
          { name: 'corporativo', description: 'Proyectos corporativos', device: 'pc' },
          { name: 'moderno', description: 'Herramientas modernas', device: 'movil' }
        ]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJsonSync.mockReturnValue(mockSkills);

      await list('skills', { json: false });

      expect(fs.readJsonSync).toHaveBeenCalled();
    });

    it('should handle missing g360-skills.json gracefully', async () => {
      fs.existsSync.mockReturnValue(false);

      await list('skills', { json: false });

      expect(fs.readJsonSync).not.toHaveBeenCalled();
    });
  });

  describe('list snippets', () => {
    it('should list snippets from snippets.json', async () => {
      const mockSnippets = {
        snippets: [
          { name: 'cli-argparse-basic', description: 'Basic argparse CLI', language: 'python' },
          { name: 'g360-button', description: 'G360 styled button', language: 'html' }
        ]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJsonSync.mockReturnValue(mockSnippets);

      await list('snippets', { json: false });

      expect(fs.readJsonSync).toHaveBeenCalled();
    });

    it('should handle missing snippets.json gracefully', async () => {
      fs.existsSync.mockReturnValue(false);

      await list('snippets', { json: false });

      expect(fs.readJsonSync).not.toHaveBeenCalled();
    });
  });

  describe('list all', () => {
    it('should list all asset types', async () => {
      const mockTemplates = ['web-pwa', 'svelte-web'];
      const mockSkills = {
        skills: [{ name: 'corporativo', description: 'Proyectos corporativos', device: 'pc' }]
      };
      const mockSnippets = {
        snippets: [{ name: 'cli-argparse-basic', description: 'Basic argparse', language: 'python' }]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(mockTemplates);
      fs.readJsonSync.mockReturnValue(mockSkills).mockReturnValueOnce(mockSnippets);

      await list('all', { json: false });

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(fs.readJsonSync).toHaveBeenCalled();
    });
  });

  describe('JSON output', () => {
    it('should output JSON when requested', async () => {
      const mockTemplates = ['web-pwa'];
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(mockTemplates);

      await list('templates', { json: true });

      expect(fs.readdirSync).toHaveBeenCalled();
    });
  });
});