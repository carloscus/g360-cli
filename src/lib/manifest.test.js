/**
 * @file manifest.test.js
 * @description Tests para el módulo manifest
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { manifest } from '../lib/manifest.js';

describe('manifest module', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-manifest-test-'));
  });

  afterEach(async () => {
    if (tmpDir) await fs.remove(tmpDir);
  });

  describe('init', () => {
    it('should create a new manifest file', async () => {
      const projectData = {
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0'
      };

      const result = await manifest.init(tmpDir, projectData);

      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      const data = await fs.readJson(manifestPath);

      expect(data).toMatchObject({
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0',
        createdAt: expect.any(String),
        assets: []
      });

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

      const result = await manifest.init(tmpDir, projectData);

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

      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      await fs.writeJson(manifestPath, mockManifest, { spaces: 2 });

      const result = await manifest.load(tmpDir);

      expect(result).toEqual(mockManifest);
    });

    it('should return null for non-existing manifest', async () => {
      const result = await manifest.load(tmpDir);

      expect(result).toBeNull();
    });

    it('should return null when manifest file is invalid', async () => {
      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      await fs.writeFile(manifestPath, 'not json');

      const result = await manifest.load(tmpDir);

      expect(result).toBeNull();
    });
  });

  describe('addAsset', () => {
    it('should add asset to existing manifest', async () => {
      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      await fs.writeJson(manifestPath, {
        name: 'test-project',
        template: 'web-pwa',
        version: '1.0.0',
        assets: []
      }, { spaces: 2 });

      const newAsset = {
        name: 'components',
        type: 'directory'
      };

      await manifest.addAsset(tmpDir, newAsset);

      const data = await fs.readJson(manifestPath);

      expect(data.assets).toEqual([
        expect.objectContaining({
          name: 'components',
          type: 'directory',
          addedAt: expect.any(String)
        })
      ]);
    });

    it('should not add asset when manifest does not exist', async () => {
      await manifest.addAsset(tmpDir, { name: 'test' });

      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      const exists = await fs.pathExists(manifestPath);
      expect(exists).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove manifest file', async () => {
      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      await fs.writeJson(manifestPath, { name: 'test' }, { spaces: 2 });

      await manifest.remove(tmpDir);

      const exists = await fs.pathExists(manifestPath);
      expect(exists).toBe(false);
    });

    it('should handle non-existing manifest gracefully', async () => {
      await manifest.remove(tmpDir);

      const manifestPath = path.join(tmpDir, 'g360-manifest.json');
      const exists = await fs.pathExists(manifestPath);
      expect(exists).toBe(false);
    });
  });
});
