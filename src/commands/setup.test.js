import { describe, it, expect } from 'vitest';
import { setup } from './setup.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('setup command', () => {
  it('should export setup function', async () => {
    const mod = await import('./setup.js');
    expect(mod).toHaveProperty('setup');
    expect(typeof mod.setup).toBe('function');
  });

  it('should have --dry-run option', async () => {
    // Mock console.log to capture output
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      await setup({ platform: 'opencode', dryRun: true, reset: false });
      expect(logs.some(l => l.includes('dry-run'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  it('should detect existing installations', async () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      await setup({ platform: 'all', dryRun: true, reset: false });
      // Should detect existing opencode config
      expect(logs.some(l => l.includes('ya instalado') || l.includes('skipped'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });
});

describe('setup backup + manifest', () => {
  let home;
  let originalHome;
  let logs;
  let originalLog;

  beforeEach(async () => {
    const os = await import('os');
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-setup-'));
    originalHome = process.env.HOME;
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    logs = [];
    originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
  });

  afterEach(async () => {
    console.log = originalLog;
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalHome;
    await fs.remove(home);
  });

  const backupDirs = (h) =>
    (fs.existsSync(path.join(h, '.backup')) ? fs.readdirSync(path.join(h, '.backup')) : []);

  it('--dry-run anuncia el backup sin escribir nada', async () => {
    const opencodeDir = path.join(home, '.config', 'opencode');
    await fs.ensureDir(opencodeDir);
    await fs.writeFile(path.join(opencodeDir, 'opencode.json'), 'viejo');

    await setup({ platform: 'all', dryRun: true, reset: true });

    expect(logs.some(l => l.includes('[dry-run] would create backup in'))).toBe(true);
    expect(backupDirs(home)).toEqual([]);
  });

  it('crea backup del contenido existente antes de sobrescribir', async () => {
    const opencodeDir = path.join(home, '.config', 'opencode');
    await fs.ensureDir(opencodeDir);
    await fs.writeFile(path.join(opencodeDir, 'opencode.json'), '{"viejo":true}');
    await fs.writeFile(path.join(home, 'marcador.txt'), 'no respaldar');

    await setup({ platform: 'all', reset: true });

    const dirs = backupDirs(home);
    expect(dirs.length).toBe(1);
    const backedUp = path.join(home, '.backup', dirs[0], '.config', 'opencode', 'opencode.json');
    expect(fs.readFileSync(backedUp, 'utf8')).toBe('{"viejo":true}');
    // lo que no se sobrescribe no entra al backup
    expect(fs.existsSync(path.join(home, '.backup', dirs[0], 'marcador.txt'))).toBe(false);
    expect(logs.some(l => l.includes('backup creado en'))).toBe(true);
  });

  it('reutiliza el backup del mismo día en vez de duplicar', async () => {
    const agentsDir = path.join(home, '.agents');
    await fs.ensureDir(agentsDir);
    await fs.writeFile(path.join(agentsDir, 'HANDOFF.md'), 'v1');

    await setup({ platform: 'all', reset: true });
    await fs.writeFile(path.join(agentsDir, 'HANDOFF.md'), 'v2');
    await setup({ platform: 'all', reset: true });

    const dirs = backupDirs(home);
    expect(dirs.length).toBe(1);
    expect(logs.some(l => l.includes('backup reutilizado en'))).toBe(true);
  });

  it('no crea backup cuando no hay configuración previa', async () => {
    await setup({ platform: 'all' });
    expect(backupDirs(home)).toEqual([]);
    expect(logs.some(l => l.includes('backup'))).toBe(false);
  });

  it('crea el manifest de integridad al terminar', async () => {
    await setup({ platform: 'all' });

    const manifestPath = path.join(home, '.agents', '.manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = fs.readJsonSync(manifestPath);
    expect(manifest.files.length).toBeGreaterThan(0);
    expect(logs.some(l => l.includes('manifest creado en'))).toBe(true);
  });

  it('--reset muestra la advertencia de eliminación', async () => {
    await setup({ platform: 'all', dryRun: true, reset: true });
    expect(logs.some(l => l.includes('--reset eliminará la configuración existente'))).toBe(true);
  });
});
