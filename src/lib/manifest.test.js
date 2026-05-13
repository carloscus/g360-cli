/**
 * @file manifest.test.js
 * @description Tests para el módulo manifest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { manifest } from '../lib/manifest.js';

// Mock de fs-extra
vi.mock('fs-extra', () => ({
  default: {
    writeJson: vi.fn(),
    readJson: vi.fn(),
    existsSync: vi.fn(),
    remove: vi.fn()
  }
}));

describe('manifest module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should create a new manifest file', async () => {
      const projectData = {
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0'
      };

      fs.writeJson.mockResolvedValue();

      const result = await manifest.init('/test/project', projectData);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join('/test/project', 'g360-manifest.json'),
        expect.objectContaining({
          name: 'test-project',
          template: 'web-pwa',
          version: '1.0.0',
          createdAt: expect.any(String),
          assets: []
        }),
        { spaces: 2 }
      );

      expect(result).toMatchObject({
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0'
      });
    });

    it('should include assets array in manifest', async () => {
      const projectData = {
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0'
      };

      fs.writeJson.mockResolvedValue();

      const result = await manifest.init('/test/project', projectData);

      expect(result.assets).toEqual([]);
    });
  });

  describe('load', () => {
    it('should load existing manifest', async () => {
      const mockManifest = {
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        assets: []
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue(mockManifest);

      const result = await manifest.load('/test/project');

      expect(result).toEqual(mockManifest);
    });

    it('should return null for non-existing manifest', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await manifest.load('/test/project');

      expect(result).toBeNull();
    });

    it('should return null when manifest file does not exist', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockRejectedValue(new Error('File not found'));

      const result = await manifest.load('/test/project');

      // El código actual no maneja errores de readJson, así que debería lanzar el error
      // Para este test, vamos a verificar que el error se maneja correctamente
      expect(result).toBeNull();
    });
  });

  describe('addAsset', () => {
    it('should add asset to existing manifest', async () => {
      const existingManifest = {
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0',
        assets: []
      };

      const newAsset = {
        name: 'components',
        type: 'directory'
      };

      fs.readJson.mockResolvedValue(existingManifest);
      fs.writeJson.mockResolvedValue();

      await manifest.addAsset('/test/project', newAsset);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join('/test/project', 'g360-manifest.json'),
        expect.objectContaining({
          assets: expect.arrayContaining([
            expect.objectContaining({
              name: 'components',
              type: 'directory',
              addedAt: expect.any(String)
            })
          ])
        }),
        { spaces: 2 }
      );
    });

    it('should not add asset when manifest does not exist', async () => {
      fs.readJson.mockResolvedValue(null);

      await manifest.addAsset('/test/project', { name: 'test' });

      expect(fs.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove manifest file', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.remove.mockResolvedValue();

      await manifest.remove('/test/project');

      expect(fs.remove).toHaveBeenCalledWith(
        path.join('/test/project', 'g360-manifest.json')
      );
    });

    it('should handle non-existing manifest gracefully', async () => {
      fs.existsSync.mockReturnValue(false);

      await manifest.remove('/test/project');

      expect(fs.remove).not.toHaveBeenCalled();
    });
  });
});