/**
 * @file update.test.js
 * @description Tests para el comando update
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';

const execSyncMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, execSync: execSyncMock };
});

describe('update command', () => {
  describe('export', () => {
    it('should export update function', async () => {
      const mod = await import('../commands/update.js');
      expect(mod).toHaveProperty('update');
      expect(typeof mod.update).toBe('function');
    });

    it('should accept options parameter', async () => {
      const { update } = await import('../commands/update.js');
      expect(update.length).toBe(1);
    });
  });

  describe('npm check behavior', () => {
    let originalLog;
    let originalError;
    let logs;
    let errors;

    beforeEach(() => {
      logs = [];
      errors = [];
      originalLog = console.log;
      originalError = console.error;
      console.log = (...args) => logs.push(args.join(' '));
      console.error = (...args) => errors.push(args.join(' '));
      execSyncMock.mockClear();
    });

    afterEach(() => {
      console.log = originalLog;
      console.error = originalError;
      execSyncMock.mockRestore();
    });

    it('should detect new version available via npm view', async () => {
      execSyncMock.mockReturnValue('3.0.0\n');

      const { update } = await import('../commands/update.js');
      await update({ check: true });

      expect(execSyncMock).toHaveBeenCalledWith(
        'npm view g360-cli version',
        expect.objectContaining({ encoding: 'utf8' })
      );
      const output = logs.join('\n');
      expect(output).toContain('3.0.0');
      expect(output).toContain('latest version');
    });

    it('should show message when already up to date', async () => {
      const pkg = await import('../../package.json', { assert: { type: 'json' } });
      const currentVersion = pkg.default?.version ?? pkg.version;
      execSyncMock.mockReturnValue(currentVersion + '\n');

      const { update } = await import('../commands/update.js');
      await update({ check: true });

      const output = logs.join('\n');
      expect(output).toContain('latest version');
      expect(output).toContain(currentVersion);
    });

    it('should not modify package.json when connection fails', async () => {
      execSyncMock.mockImplementation(() => {
        throw new Error('ENOTFOUND: network request failed');
      });

      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const fse = await import('fs-extra');
      const before = fse.readJsonSync(pkgPath);

      const { update } = await import('../commands/update.js');
      await update({ check: true });

      const after = fse.readJsonSync(pkgPath);
      expect(after).toEqual(before);
      const errorOutput = errors.join('\n');
      expect(errorOutput).toContain('Error checking version');
    });
  });
});
