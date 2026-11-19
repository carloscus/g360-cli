/**
 * @file file-cache.test.js
 * @description Tests para el módulo file-cache (caché de lecturas de archivos)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { readFileCached, clearCache, readJsonCached } from './file-cache.js';

describe('file-cache', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-file-cache-'));
    clearCache();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
    clearCache();
  });

  describe('readFileCached', () => {
    it('primera llamada lee del filesystem', () => {
      const file = path.join(tmpDir, 'a.txt');
      fs.writeFileSync(file, 'contenido-original', 'utf8');

      const result = readFileCached(file, (p) => fs.readFileSync(p, 'utf8'));
      expect(result).toBe('contenido-original');
    });

    it('segunda llamada usa caché (no vuelve al filesystem)', () => {
      const file = path.join(tmpDir, 'b.txt');
      fs.writeFileSync(file, 'contenido-inicial', 'utf8');

      let readCount = 0;
      const read = (p) => {
        readCount++;
        return fs.readFileSync(p, 'utf8');
      };

      const first = readFileCached(file, read);
      const second = readFileCached(file, read);

      expect(first).toBe('contenido-inicial');
      expect(second).toBe('contenido-inicial');
      expect(readCount).toBe(1); // fn se ejecutó una sola vez
    });

    it('diferentes archivos se cachean por separado', () => {
      const f1 = path.join(tmpDir, 'c1.txt');
      const f2 = path.join(tmpDir, 'c2.txt');
      fs.writeFileSync(f1, 'uno', 'utf8');
      fs.writeFileSync(f2, 'dos', 'utf8');

      const r1 = readFileCached(f1, (p) => fs.readFileSync(p, 'utf8'));
      const r2 = readFileCached(f2, (p) => fs.readFileSync(p, 'utf8'));

      expect(r1).toBe('uno');
      expect(r2).toBe('dos');
    });

    it('clearCache limpia el caché y obliga a re-leer', () => {
      const file = path.join(tmpDir, 'd.txt');
      fs.writeFileSync(file, 'valor-1', 'utf8');

      const primero = readFileCached(file, () => 'valor-1');
      clearCache();
      fs.writeFileSync(file, 'valor-2', 'utf8');
      const segundo = readFileCached(file, () => fs.readFileSync(file, 'utf8'));

      expect(primero).toBe('valor-1');
      expect(segundo).toBe('valor-2');
    });
  });

  describe('readJsonCached', () => {
    it('lee y parsea JSON con caché', () => {
      const file = path.join(tmpDir, 'pkg.json');
      fs.writeJsonSync(file, { name: 'g360-cli', version: '1.0.0' });

      const first = readJsonCached(file);
      const second = readJsonCached(file);

      expect(first).toEqual({ name: 'g360-cli', version: '1.0.0' });
      expect(second).toEqual({ name: 'g360-cli', version: '1.0.0' });
      expect(first).toBe(second); // misma referencia (caché)
    });

    it('archivo inexistente retorna null', () => {
      const file = path.join(tmpDir, 'no-existe.json');
      const result = readJsonCached(file);
      expect(result).toBeNull();
    });

    it('archivo con JSON inválido retorna null', () => {
      const file = path.join(tmpDir, 'malo.json');
      fs.writeFileSync(file, '{ no es json', 'utf8');
      const result = readJsonCached(file);
      expect(result).toBeNull();
    });

    it('clearCache también limpia lecturas JSON', () => {
      const file = path.join(tmpDir, 'e.json');
      fs.writeJsonSync(file, { a: 1 });

      const primero = readJsonCached(file);
      clearCache();
      fs.writeJsonSync(file, { a: 2 });
      const segundo = readJsonCached(file);

      expect(primero).toEqual({ a: 1 });
      expect(segundo).toEqual({ a: 2 });
    });
  });
});
