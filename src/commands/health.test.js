/**
 * @file health.test.js
 * @description Tests para el comando health
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

describe('health command', () => {
  describe('npm check', () => {
    let originalPath;
    let originalExitCode;
    let spawnSyncMock;

    beforeEach(() => {
      originalPath = process.env.PATH;
      originalExitCode = process.exitCode;
      process.exitCode = 0;
      // Mock de child_process.spawnSync para controlar si npm está disponible
      spawnSyncMock = vi.spyOn(require('child_process'), 'spawnSync');
    });

    afterEach(() => {
      process.env.PATH = originalPath;
      process.exitCode = originalExitCode;
      spawnSyncMock.mockRestore();
    });

    async function runHealth(npmAvailable) {
      spawnSyncMock.mockReturnValue({ status: npmAvailable ? 0 : 1 });
      const { health } = await import('../commands/health.js');
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));
      try {
        await health({ verbose: false });
      } finally {
        console.log = originalLog;
      }
      return logs.join('\n');
    }

    it('debe reportar error cuando npm no responde (spawnSync status !== 0)', async () => {
      const output = await runHealth(false);
      expect(output).toContain('npm');
      expect(output).toContain('Not found');
      // Veredicto global: algún check falló
      expect(output).toContain('Some checks failed');
      expect(process.exitCode).toBe(1);
    });

    it('debe reportar ok cuando npm responde con status 0', async () => {
      const output = await runHealth(true);
      expect(output).toContain('npm');
      expect(output).toContain('Available');
      expect(process.exitCode).toBe(0);
    });

    it('pasa shell: true a spawnSync para resolver npm.cmd en Windows', async () => {
      const fs = await import('fs-extra');
      const source = await fs.readFile(path.join(__dirname, 'health.js'), 'utf8');
      expect(source).toContain("shell: true");
    });

    it('detecta npm realmente instalado en esta máquina (integración)', async () => {
      spawnSyncMock.mockRestore();
      const { health } = await import('../commands/health.js');
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));
      await health({ verbose: false });
      console.log = originalLog;
      const output = logs.join('\n');
      expect(output).toContain('Available');
      expect(process.exitCode).toBe(0);
      spawnSyncMock = vi.spyOn(require('child_process'), 'spawnSync');
    });
  });
});
