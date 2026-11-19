/**
 * @file src/e2e/setup-bring-audit.test.js
 * @description End-to-end test del flujo principal: setup → bring harness → audit
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('E2E: setup → bring → audit flow', () => {
  let tmpDir;
  let originalCwd;
  let originalHome;
  let originalUserProfile;

  beforeEach(async () => {
    // Crear dir temporal simulando un repo nuevo
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-e2e-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);

    // Redirigir HOME al tmpDir para que `setup` no escriba en el HOME real
    originalHome = process.env.HOME;
    originalUserProfile = process.env.USERPROFILE;
    process.env.HOME = tmpDir;
    process.env.USERPROFILE = tmpDir;

    // Simular repo básico
    await fs.writeJson(path.join(tmpDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      g360: { stack: 'web-pwa' }
    });
    await fs.writeFile(path.join(tmpDir, 'README.md'), '# Test Project');
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
    await fs.remove(tmpDir);
  });

  /**
   * Captura console.log de una fn async y restaura el logger al salir.
   */
  async function captureLogs(fn) {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await fn();
    } finally {
      console.log = originalLog;
    }
    return logs;
  }

  it('debe completar flujo setup → bring → audit sin errores', async () => {
    const { setup } = await import('../commands/setup.js');
    const { bring } = await import('../commands/bring.js');
    const { audit } = await import('../commands/audit.js');

    // Paso 1: Setup (dry-run, HOME apuntando al tmpDir, no toca HOME real)
    const setupLogs = await captureLogs(async () => {
      await setup({ platform: 'opencode', dryRun: true });
    });
    expect(setupLogs.join('\n')).toContain('dry-run');

    // Paso 2: Bring harness al proyecto (dry-run)
    const bringLogs = await captureLogs(async () => {
      await bring('harness', { path: tmpDir, dryRun: true });
    });
    expect(bringLogs.join('\n')).toContain('DRY RUN');

    // Paso 3: Audit del proyecto (solo lee, no escribe)
    const auditLogs = await captureLogs(async () => {
      await audit(tmpDir, {});
    });
    expect(auditLogs.join('\n')).toContain('G360 Project Audit');
  });

  it('setup dry-run no escribe nada en el directorio base', async () => {
    const { setup } = await import('../commands/setup.js');

    await setup({ platform: 'opencode', dryRun: true });

    // En dry-run no debe crear nada dentro del base dir
    expect(await fs.pathExists(path.join(tmpDir, '.config'))).toBe(false);
    expect(await fs.pathExists(path.join(tmpDir, '.agents'))).toBe(false);
  });

  it('debe crear estructura G360 básica con bring harness', async () => {
    const { bring } = await import('../commands/bring.js');

    const logs = await captureLogs(async () => {
      await bring('harness', { path: tmpDir, dryRun: false });
    });

    // bring harness crea AGENTS.md y .opencode en el target dir
    expect(await fs.pathExists(path.join(tmpDir, 'AGENTS.md'))).toBe(true);
    expect(await fs.pathExists(path.join(tmpDir, '.opencode'))).toBe(true);
    expect(logs.join('\n')).toContain('Harness installed');
  });

  it('audit del proyecto no lanza y reporta estado de autosuficiencia', async () => {
    const { audit } = await import('../commands/audit.js');

    const logs = await captureLogs(async () => {
      await audit(tmpDir, {});
    });

    const output = logs.join('\n');
    expect(output).toContain('G360 Project Audit');
    expect(output).toContain('Audit Results');
  });
});
