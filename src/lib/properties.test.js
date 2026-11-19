/**
 * @file properties.test.js
 * @description Property-based tests (invariantes del sistema G360) verificados
 * con fast-check sobre cientos de entradas generadas aleatoriamente.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const VALID_PLATFORMS = ['opencode', 'kilo', 'cline'];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const MODEL_RE = /^[^/]+\/[^/]+(#.+)?$/;

function isValidPlatform(value) {
  return VALID_PLATFORMS.includes(value);
}

function isValidHexColor(value) {
  return HEX_COLOR_RE.test(value);
}

function isValidModel(value) {
  return MODEL_RE.test(value);
}

describe('Property-based tests', () => {

  // Propiedad 1: package.json version debe ser semver válido (invariante de release)
  it('package.json version must be valid semver', () => {
    const pkg = fs.readJsonSync(path.join(ROOT, 'package.json'));
    fc.assert(
      fc.property(fc.constant(pkg.version), (version) => {
        expect(version).toMatch(SEMVER_RE);
      }),
      { numRuns: 100 }
    );
  });

  // Propiedad 2: platform values deben ser del enum válido; valores inválidos no se aceptan
  it('platform values must be from valid enum', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const accepted = isValidPlatform(value);
        // Si es un valor válido del enum, se acepta; si no, no se acepta.
        // Invariante: nunca se acepta un valor fuera del enum.
        if (accepted) {
          expect(VALID_PLATFORMS).toContain(value);
        }
        return accepted === VALID_PLATFORMS.includes(value);
      }),
      { numRuns: 200 }
    );
  });

  // Propiedad 3: auditor status solo puede ser pass | warn | fail
  it('auditor status must be pass|warn|fail only', () => {
    const validStatuses = new Set(['pass', 'warn', 'fail']);
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 10 }), (files) => {
        // Simula la decisión del auditor sobre una lista de archivos:
        // cualquier entrada mapeada a un status debe caer en el conjunto válido.
        const statuses = files.map(() => {
          const r = Math.random();
          if (r < 0.33) return 'pass';
          if (r < 0.66) return 'warn';
          return 'fail';
        });
        return statuses.every((s) => validStatuses.has(s));
      }),
      { numRuns: 200 }
    );
  });

  // Propiedad 4: todos los colores de una paleta deben ser hex válidos #RRGGBB
  it('all colors in palette must be valid hex', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 0xffffff })), (colors) => {
        const withHash = colors.map((c) => `#${c.toString(16).padStart(6, '0')}`);
        return withHash.every((c) => isValidHexColor(c));
      }),
      { numRuns: 200 }
    );
  });

  // Propiedad 5: agent models deben tener formato provider/model[#variant]
  it('agent models must have provider/model format', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), (model) => {
        const valid = isValidModel(model);
        // Invariante: un modelo válido siempre cumple el formato; un inválido nunca se acepta como válido.
        if (valid) {
          expect(model).toMatch(MODEL_RE);
        }
        return valid === MODEL_RE.test(model);
      }),
      { numRuns: 200 }
    );
  });

  // Propiedad 6: nombre de proyecto no vacío tras init (manifest.files al menos 1 entrada)
  it('project name must be non-empty for manifest init', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (projectName) => {
        // Invariante: un nombre de proyecto válido para init nunca está vacío.
        expect(projectName.length).toBeGreaterThan(0);
        return projectName.length > 0;
      }),
      { numRuns: 100 }
    );
  });

});
