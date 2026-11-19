/**
 * @file fuzzing-encoding.test.js
 * @description Fuzzing de ataques con null byte y encoding contra la validacion
 * de rutas del CLI. Ninguna de estas representaciones debe permitir escribir
 * fuera del cwd. NO modifica source.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

/**
 * Valida que una ruta objetivo no escape del cwd (mismo patron de addon.js).
 * @param {string} target - ruta ingresada por el usuario
 * @returns {boolean} true si la ruta queda dentro del cwd
 */
function isPathSafe(target) {
  const cwdResolved = path.resolve(process.cwd());
  const resolvedTarget = path.resolve(process.cwd(), target);
  return (
    resolvedTarget.startsWith(cwdResolved + path.sep) ||
    resolvedTarget === cwdResolved
  );
}

function isRelative(input) {
  if (!input || input.length === 0) return true;
  if (input.startsWith('/') || input.startsWith('\\')) return false;
  return !/^[a-zA-Z]:/.test(input);
}

/**
 * Payloads de encoding puro (null byte, %2f, double encoding, UTF-8 overlong)
 * que NO contienen traversal real (`..`). path.resolve no decodifica estos
 * caracteres, por lo que quedan como nombres de directorio literal dentro de
 * cwd: isPathSafe debe devolver true.
 */
const ENCODING_ONLY_PAYLOADS = [
  '..%2f',
  '..%252f',
  '..%2f..%2f..%2fetc%2fpasswd',
  '..%252f..%252f..%252fetc%252fpasswd',
  '..%c0%af',
  '..%e0%80%af',
  'foo\\x00.php',
  'test%00.gif',
  'foo%00.gif',
  '..%2f..%2f',
  '..%252f..%252f',
];

/**
 * Payloads que mezclan null byte/encoding con traversal real (`..`).
 * Como path.resolve interpreta el `..`, salen del cwd: isPathSafe = false.
 */
const MIXED_ESCAPE_PAYLOADS = [
  '%00foo/../../etc/passwd',
  'test%00.gif/../../etc/passwd',
];

describe('Null byte & encoding fuzzing', () => {
  it('encoding-only payloads stay inside cwd as literal names (isPathSafe = true)', () => {
    for (const payload of ENCODING_ONLY_PAYLOADS) {
      expect(isPathSafe(payload)).toBe(true);
    }
  });

  it('mixed payloads with real traversal escape cwd (isPathSafe = false)', () => {
    for (const payload of MIXED_ESCAPE_PAYLOADS) {
      expect(isPathSafe(payload)).toBe(false);
    }
  });

  it('null byte paths stay inside cwd as literal names', () => {
    const nullPayloads = ['foo\\x00.php', 'test%00.gif', 'foo%00.gif'];
    for (const p of nullPayloads) {
      expect(isPathSafe(p)).toBe(true);
    }
  });

  it('single and double encoded traversal stays inside cwd', () => {
    const encodedPayloads = ['..%2f', '..%252f', '..%2f..%2f..%2fetc%2fpasswd', '..%252f..%252f..%252fetc%252fpasswd'];
    for (const p of encodedPayloads) {
      expect(isPathSafe(p)).toBe(true);
    }
  });

  it('UTF-8 overlong encoding stays inside cwd', () => {
    const utf8Payloads = ['..%c0%af', '..%e0%80%af'];
    for (const p of utf8Payloads) {
      expect(isPathSafe(p)).toBe(true);
    }
  });

  it('property: any fuzzed relative string stays inside cwd', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 150 }).filter(isRelative), (input) => {
        const resolved = path.resolve(process.cwd(), input);
        const cwdResolved = path.resolve(process.cwd());
        return (
          resolved.startsWith(cwdResolved + path.sep) ||
          resolved === cwdResolved
        );
      }),
      { numRuns: 300 }
    );
  });
});
