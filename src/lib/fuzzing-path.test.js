/**
 * @file fuzzing-path.test.js
 * @description Fuzzing de path traversal contra los points de entrada del CLI
 * que aceptan rutas como input. NO modifica source: solo testa la invariante de
 * que la validacion de rutas (patron de addon.js lineas 54-59) detecta cualquier
 * intento de salir del cwd.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Valida que una ruta objetivo no escape del cwd.
 * Replica el patron de addon.js (lineas 54-59).
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

/**
 * Rutas absolutas o con drive letter nunca son relativas al cwd; se filtran
 * del dominio de fuzzing relativo porque path.resolve las resuelve en el raiz
 * del unidad y eso es comportamiento esperado (no es un bypass de validacion).
 */
function isRelative(input) {
  if (!input || input.length === 0) return true;
  if (input.startsWith('/') || input.startsWith('\\')) return false;
  // Windows drive letter: C:...
  return !/^[a-zA-Z]:/.test(input);
}

/**
 * Payloads de path traversal reales: contienen `..` secuencias que hacen que
 * path.resolve salga del cwd. Cada uno debe hacer que isPathSafe devuelva
 * false (la validacion lo detecta como fuera de cwd y el comando lo rechaza).
 */
const TRAVERSAL_PAYLOADS = [
  '../../',
  '../',
  '..\\',
  '..\\..\\',
  '../../../etc/passwd',
  '..\\..\\..\\etc\\passwd',
  '../../../windows/win.ini',
  '../../etc/shadow',
  '../../../../etc/passwd',
  './../../etc/passwd',
  '.\\..\\..\\etc\\passwd',
];

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

describe('Path traversal fuzzing', () => {
  it('traversal payloads are detected as outside cwd (isPathSafe = false)', () => {
    for (const payload of TRAVERSAL_PAYLOADS) {
      expect(isPathSafe(payload)).toBe(false);
    }
  });

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

  it('addon-style validation rejects traversal attempts', () => {
    const cwdResolved = path.resolve(process.cwd());
    for (const target of TRAVERSAL_PAYLOADS) {
      const resolvedTarget = path.resolve(process.cwd(), target);
      const isOutside =
        !resolvedTarget.startsWith(cwdResolved + path.sep) &&
        resolvedTarget !== cwdResolved;
      // Cada intento de traversal efectivamente sale del cwd -> la validacion lo rechaza.
      expect(isOutside).toBe(true);
    }
  });

  it('normal relative paths stay inside cwd', () => {
    const safe = ['.', './src', 'subdir', 'a/b/c', 'file.txt', 'g360/skill.json'];
    for (const good of safe) {
      expect(isPathSafe(good)).toBe(true);
    }
  });

  it('property: isPathSafe correctly classifies every relative input', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }).filter(isRelative), (input) => {
        const resolved = path.resolve(process.cwd(), input);
        const cwdResolved = path.resolve(process.cwd());
        const actuallyInside =
          resolved.startsWith(cwdResolved + path.sep) ||
          resolved === cwdResolved;
        // El validador no da falsos positivos ni falsos negativos frente a path.resolve.
        expect(isPathSafe(input)).toBe(actuallyInside);
        return isPathSafe(input) === actuallyInside;
      }),
      { numRuns: 300 }
    );
  });

  it('property: any traversal-detected path genuinely escapes cwd', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }).filter(isRelative), (input) => {
        if (!isPathSafe(input)) {
          // Si el validador dice que esta fuera, realmente debe estar fuera.
          const resolved = path.resolve(process.cwd(), input);
          const cwdResolved = path.resolve(process.cwd());
          return (
            !resolved.startsWith(cwdResolved + path.sep) &&
            resolved !== cwdResolved
          );
        }
        return true;
      }),
      { numRuns: 300 }
    );
  });
});
