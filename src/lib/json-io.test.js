/**
 * @file json-io.test.js
 * @description Tests para helpers seguros de lectura/escritura JSON (sin BOM).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { readJsonSafe, writeJsonSafe, hasBom, stripBom } from './json-io.js';

describe('json-io', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-json-io-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe('readJsonSafe', () => {
    it('parsea JSON normal sin BOM', () => {
      const file = path.join(tmpDir, 'no-bom.json');
      fs.writeFileSync(file, '{"version":"1.0.0"}', 'utf8');
      const result = readJsonSafe(file);
      expect(result.version).toBe('1.0.0');
    });

    it('parsea JSON con BOM eliminándolo', () => {
      const file = path.join(tmpDir, 'with-bom.json');
      // Escribir con BOM
      fs.writeFileSync(file, '\uFEFF{"version":"1.0.0"}', 'utf8');
      const result = readJsonSafe(file);
      expect(result.version).toBe('1.0.0');
    });

    it('maneja archivos vacíos con error claro', () => {
      const file = path.join(tmpDir, 'empty.json');
      fs.writeFileSync(file, '', 'utf8');
      expect(() => readJsonSafe(file)).toThrow(SyntaxError);
    });
  });

  describe('writeJsonSafe', () => {
    it('escribe JSON sin BOM', () => {
      const file = path.join(tmpDir, 'out.json');
      writeJsonSafe(file, { version: '1.20.8' });
      const raw = fs.readFileSync(file, 'utf8');
      expect(raw.startsWith('\uFEFF')).toBe(false);
      expect(JSON.parse(raw).version).toBe('1.20.8');
    });

    it('agrega newline final', () => {
      const file = path.join(tmpDir, 'nl.json');
      writeJsonSafe(file, { a: 1 });
      const raw = fs.readFileSync(file, 'utf8');
      expect(raw.endsWith('\n')).toBe(true);
    });
  });

  describe('hasBom', () => {
    it('detecta BOM cuando existe', () => {
      const file = path.join(tmpDir, 'bom.json');
      fs.writeFileSync(file, '\uFEFF{"a":1}', 'utf8');
      expect(hasBom(file)).toBe(true);
    });

    it('false cuando no hay BOM', () => {
      const file = path.join(tmpDir, 'nobom.json');
      fs.writeFileSync(file, '{"a":1}', 'utf8');
      expect(hasBom(file)).toBe(false);
    });
  });

  describe('stripBom', () => {
    it('elimina BOM del inicio', () => {
      expect(stripBom('\uFEFF{"a":1}')).toBe('{"a":1}');
    });

    it('no altera contenido sin BOM', () => {
      const input = '{"a":1}';
      expect(stripBom(input)).toBe(input);
    });
  });
});
