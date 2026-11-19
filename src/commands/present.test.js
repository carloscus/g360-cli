/**
 * @file present.test.js
 * @description Tests para el comando present
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const os = require('os');

describe('present command', () => {
  describe('export', () => {
    it('should export present function', async () => {
      const mod = await import('../commands/present.js');
      expect(mod).toHaveProperty('present');
      expect(typeof mod.present).toBe('function');
    });

    it('should accept projectPath and options parameters', async () => {
      const { present } = await import('../commands/present.js');
      expect(present.length).toBe(2);
    });
  });

  describe('directory structure', () => {
    let tmpDir;
    let originalLog;
    let logs;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-present-'));
      await fs.ensureDir(path.join(tmpDir, 'src'));
      await fs.ensureDir(path.join(tmpDir, 'src', 'commands'));
      await fs.writeFile(path.join(tmpDir, 'package.json'), '{}');
      await fs.writeFile(path.join(tmpDir, 'README.md'), '# Test Repo');
      logs = [];
      originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));
    });

    afterEach(() => {
      console.log = originalLog;
      return fs.remove(tmpDir);
    });

    it('should read directory structure of the repo', async () => {
      const { present } = await import('../commands/present.js');
      const relativePath = path.relative(process.cwd(), tmpDir);
      await present(relativePath, { depth: 2 });

      const output = logs.join('\n');
      expect(output).toContain('src');
      expect(output).toContain('package.json');
    });
  });

  describe('cli commands', () => {
    it('should list available commands from cli.js', async () => {
      const cliPath = path.resolve(__dirname, '../cli.js');
      const fsMod = await import('fs-extra');
      const content = await fsMod.readFile(cliPath, 'utf8');

      const commandMatches = content.match(/\.command\('([^']+)'/g) || [];
      const commands = commandMatches.map((m) => m.replace(".command('", '').replace("'", ''));

      expect(commands.length).toBeGreaterThan(0);
      expect(commands).toContain('present');
      expect(commands).toContain('validate');
      expect(commands).toContain('update');
    });
  });

  describe('README warning', () => {
    let tmpDir;
    let originalLog;
    let logs;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-present-no-readme-'));
      await fs.ensureDir(path.join(tmpDir, 'src'));
      await fs.writeFile(path.join(tmpDir, 'package.json'), '{}');
      // No se crea README.md a propósito
      logs = [];
      originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));
    });

    afterEach(() => {
      console.log = originalLog;
      return fs.remove(tmpDir);
    });

    it('should work on a repo without README.md (no crash)', async () => {
      const { present } = await import('../commands/present.js');
      const relativePath = path.relative(process.cwd(), tmpDir);
      await present(relativePath, { depth: 2 });

      const output = logs.join('\n');
      expect(output).toContain('Structure');
      // No debe lanzar excepcion por falta de README
      expect(true).toBe(true);
    });
  });
});
