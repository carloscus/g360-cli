/**
 * @file asset-validator.test.js
 * @description Tests para el módulo asset-validator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs-extra';
import { assetValidator } from '../lib/asset-validator.js';

// Mock de fs-extra
vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readJson: vi.fn()
  }
}));

// Mock de logger
vi.mock('../lib/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('asset-validator module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assetValidator.clearCache();
  });

  describe('validateSkills', () => {
    it('should validate valid skills data', async () => {
      const validSkills = {
        skills: [
          {
            name: 'corporativo',
            description: 'Test skill',
            device: 'pc',
            colors: {
              bg: '#0b1220',
              surface: '#1a2332',
              accent: '#00796B',
              text: '#f0f4f8',
              muted: '#94a3b8'
            },
            signature: {
              mode: 'powered',
              text: 'powered by G360'
            }
          }
        ]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({
        type: 'object',
        properties: {
          skills: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'description', 'device', 'colors', 'signature'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                device: { type: 'string', enum: ['pc', 'movil', 'both'] },
                colors: { type: 'object' },
                signature: { type: 'object' }
              }
            }
          }
        }
      });

      const result = await assetValidator.validateSkills(validSkills);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid skills data', async () => {
      const invalidSkills = {
        skills: [
          {
            name: 'test',
            // Missing required fields
          }
        ]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({
        type: 'object',
        properties: {
          skills: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'description', 'device', 'colors', 'signature']
            }
          }
        }
      });

      const result = await assetValidator.validateSkills(invalidSkills);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSnippets', () => {
    it('should validate valid snippets data', async () => {
      const validSnippets = {
        snippets: [
          {
            name: 'test-snippet',
            description: 'A test snippet',
            code: 'console.log("test")'
          }
        ]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({
        type: 'object',
        properties: {
          snippets: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'description', 'code']
            }
          }
        }
      });

      const result = await assetValidator.validateSnippets(validSnippets);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateAsset', () => {
    it('should validate individual skill asset', async () => {
      const skill = {
        name: 'test-skill',
        description: 'Test',
        device: 'pc',
        colors: { accent: '#00d084' },
        signature: { mode: 'powered' }
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({
        type: 'object',
        properties: {
          skills: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      });

      const result = await assetValidator.validateAsset('skill', skill);

      expect(result).toHaveProperty('valid');
    });

    it('should validate individual snippet asset', async () => {
      const snippet = {
        name: 'test',
        description: 'Test',
        code: 'test'
      };

      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({
        type: 'object',
        properties: {
          snippets: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      });

      const result = await assetValidator.validateAsset('snippet', snippet);

      expect(result).toHaveProperty('valid');
    });
  });

  describe('error handling', () => {
    it('should handle missing schema file', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await assetValidator.validate('non-existent', {});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid schema', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({ invalid: 'schema' });

      const result = await assetValidator.validate('invalid-schema', {});

      expect(result.valid).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should cache compiled schemas', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readJson.mockResolvedValue({
        type: 'object',
        properties: {}
      });

      await assetValidator.validate('test', {});
      await assetValidator.validate('test', {});

      // Schema should be cached, so readJson should only be called once
      expect(fs.readJson).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      assetValidator.clearCache();

      expect(assetValidator.schemaCache.size).toBe(0);
    });
  });
});
