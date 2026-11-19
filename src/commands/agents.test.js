/**
 * @file agents.test.js
 * @description Tests para el comando agents
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readJsonSync: vi.fn(),
    statSync: vi.fn()
  }
}));

vi.mock('../lib/agents-generator.js', () => ({
  agentsGenerator: {
    apply: vi.fn(),
    analyze: vi.fn()
  }
}));

import { agents } from '../commands/agents.js';
import { agentsGenerator } from '../lib/agents-generator.js';

describe('agents command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exporta la función agents', () => {
    expect(typeof agents).toBe('function');
  });

  it('genera AGENTS.md desde el análisis del repositorio', async () => {
    fs.existsSync.mockReturnValue(true);
    agentsGenerator.apply.mockReturnValue({
      status: 'created',
      path: 'AGENTS.md',
      verify: 'npm ci && npm test',
      content: '# AGENTS.md'
    });

    const result = await agents('.', { dryRun: true });

    expect(agentsGenerator.apply).toHaveBeenCalled();
    expect(result.status).toBe('created');
  });

  it('muestra error si el path no existe', async () => {
    fs.existsSync.mockReturnValue(false);

    const result = await agents('./no-existe', {});

    expect(result.status).toBe('error');
    expect(console.error).toHaveBeenCalled();
  });

  it('soporta la opción verbose sin error', async () => {
    fs.existsSync.mockReturnValue(true);
    agentsGenerator.apply.mockReturnValue({
      status: 'unchanged',
      path: 'AGENTS.md',
      verify: 'npm ci && npm test',
      content: '# AGENTS.md'
    });

    const result = await agents('.', { dryRun: true, verbose: true });

    expect(result).toBeDefined();
    expect(agentsGenerator.apply).toHaveBeenCalled();
  });
});
