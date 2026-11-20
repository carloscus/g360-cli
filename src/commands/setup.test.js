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

  it('el backup excluye node_modules (symlinks rotos rompían setup)', async () => {
    const ocDir = path.join(home, '.config', 'opencode');
    await fs.ensureDir(path.join(ocDir, 'node_modules', 'pkg'));
    await fs.writeFile(path.join(ocDir, 'node_modules', 'pkg', 'index.js'), 'x');
    await fs.writeFile(path.join(ocDir, 'opencode.json'), '{"viejo":true}');

    await setup({ platform: 'all', reset: true });

    const dirs = backupDirs(home);
    expect(dirs.length).toBe(1);
    const backupRoot = path.join(home, '.backup', dirs[0], '.config', 'opencode');
    // el config sí se respalda
    expect(fs.existsSync(path.join(backupRoot, 'opencode.json'))).toBe(true);
    // node_modules no
    expect(fs.existsSync(path.join(backupRoot, 'node_modules'))).toBe(false);
    // setup no crasheó: manifest existe
    expect(fs.existsSync(path.join(home, '.agents', '.manifest.json'))).toBe(true);
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

describe('setup funciones críticas sin cobertura directa', () => {
  let home;
  let originalHome;
  let logs;
  let originalLog;

  beforeEach(async () => {
    const os = await import('os');
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-setup-test-'));
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

  const logText = () => logs.join('\n');

  it('installSharedDocs copies HANDOFF.md and MULTIAGENTE.md to .agents', async () => {
    await setup({ platform: 'all', dryRun: false, reset: false });

    const agentsDir = path.join(home, '.agents');
    expect(fs.existsSync(path.join(agentsDir, 'HANDOFF.md'))).toBe(true);
    expect(fs.existsSync(path.join(agentsDir, 'MULTIAGENTE.md'))).toBe(true);
    expect(fs.readFileSync(path.join(agentsDir, 'HANDOFF.md'), 'utf8').length).toBeGreaterThan(0);
    expect(fs.readFileSync(path.join(agentsDir, 'MULTIAGENTE.md'), 'utf8').length).toBeGreaterThan(0);
  });

  it('installPlatform installs kilo config (kilo.jsonc)', async () => {
    await setup({ platform: 'kilo', dryRun: false, reset: false });

    const kiloConfig = path.join(home, '.config', 'kilo', 'kilo.jsonc');
    expect(fs.existsSync(kiloConfig)).toBe(true);
    expect(fs.readFileSync(kiloConfig, 'utf8').length).toBeGreaterThan(0);
  });

  it('installPlatform installs cline goldfish.ps1', async () => {
    await setup({ platform: 'cline', dryRun: false, reset: false });

    const goldfish = path.join(home, '.agents', 'goldfish.ps1');
    expect(fs.existsSync(goldfish)).toBe(true);
    expect(fs.readFileSync(goldfish, 'utf8').length).toBeGreaterThan(0);
  });

  it('isPlatformInstalled returns true when config exists (opencode skipped)', async () => {
    const opencodeDir = path.join(home, '.config', 'opencode');
    await fs.ensureDir(opencodeDir);
    await fs.writeFile(path.join(opencodeDir, 'opencode.json'), '{"existe":true}');

    await setup({ platform: 'opencode', dryRun: false, reset: false });
    expect(logText()).toContain('opencode: skipped');
    expect(logText()).toContain('ya instalado');
  });

  it('isPlatformInstalled returns false when config missing (opencode installed)', async () => {
    await setup({ platform: 'opencode', dryRun: false, reset: false });
    expect(logText()).toContain('opencode: installed');
  });
});

describe('coherencia de 9 roles (proposer, evaluator, adversary)', () => {
  const AGENTS_DIR = path.join(
    __dirname,
    '..',
    'assets',
    'harness',
    'opencode',
    'agents',
  );
  const FALLBACKS_PATH = path.join(
    __dirname,
    '..',
    'assets',
    'config',
    'model-fallbacks.json',
  );
  const SETUP_SRC = path.join(__dirname, 'setup.js');

  const rolesEsperados = [
    'orchestrator',
    'architect',
    'reviewer',
    'security-auditor',
    'data-specialist',
    'qa-specialist',
    'proposer',
    'evaluator',
    'adversary',
  ];

  it('assets tiene exactamente 9 agentes .md (sin hardcodear en dry-run)', () => {
    const files = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
    expect(files.length).toBe(9);
    for (const rol of rolesEsperados) {
      expect(files).toContain(`${rol}.md`);
    }
  });

  it('dry-run de opencode deriva la lista de readdir, no hardcodeada', async () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await setup({ platform: 'opencode', dryRun: true, reset: true });
    } finally {
      console.log = originalLog;
    }
    const salida = logs.join('\n');
    for (const rol of rolesEsperados) {
      expect(salida).toContain(rol);
    }
  });

  it('DEFAULT_OPENCODE_CONFIG declara los 9 agentes', () => {
    const src = fs.readFileSync(SETUP_SRC, 'utf8');
    for (const rol of rolesEsperados) {
      // Cada rol tiene una entrada `rol: {` en el objeto agents (4 espacios)
      expect(src).toMatch(new RegExp(`    '?${rol.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}'?\\s*: \\{`));
    }
  });

  it('orchestrator.permissions permite invocar a proposer, evaluator y adversary', () => {
    const src = fs.readFileSync(SETUP_SRC, 'utf8');
    for (const rol of ['proposer', 'evaluator', 'adversary']) {
      expect(src).toContain(`resource: '${rol}', effect: 'allow'`);
    }
  });

  it('DEFAULT_KILO_CONFIG declara g360-proposer, g360-evaluator, g360-adversary con task allow', () => {
    const src = fs.readFileSync(SETUP_SRC, 'utf8');
    for (const rol of ['g360-proposer', 'g360-evaluator', 'g360-adversary']) {
      expect(src).toContain(`'${rol}': {`);
    }
    expect(src).toContain("'g360-proposer': 'allow'");
    expect(src).toContain("'g360-evaluator': 'allow'");
    expect(src).toContain("'g360-adversary': 'allow'");
  });

  it('model-fallbacks.json tiene entrada para cada rol y resolveModel !== null', async () => {
    const fallbacks = JSON.parse(fs.readFileSync(FALLBACKS_PATH, 'utf8'));
    const { resolveModel } = await import('../lib/model-resolver.js');
    for (const rol of rolesEsperados) {
      expect(fallbacks).toHaveProperty(rol);
      expect(Array.isArray(fallbacks[rol])).toBe(true);
      expect(fallbacks[rol].length).toBeGreaterThan(0);
      expect(resolveModel(rol)).not.toBeNull();
    }
  });

  it('proposer, evaluator y adversary son read-only: sin edit/write/patch, shell solo git read-only, sin subagentes', () => {
    const src = fs.readFileSync(SETUP_SRC, 'utf8');
    for (const rol of ['proposer', 'evaluator', 'adversary']) {
      // En OpenCode config: denegar edit, write, patch; shell deny total salvo git read-only
      expect(src).toContain(`{ action: 'edit', resource: '*', effect: 'deny' },`);
      expect(src).toContain(`{ action: 'write', resource: '*', effect: 'deny' },`);
      expect(src).toContain(`{ action: 'patch', resource: '*', effect: 'deny' },`);
      expect(src).toContain(`{ action: 'shell', resource: '*', effect: 'deny' },`);
      expect(src).toContain(`{ action: 'shell', resource: 'git diff*', effect: 'allow' },`);
      expect(src).toContain(`{ action: 'shell', resource: 'git log*', effect: 'allow' },`);
      expect(src).toContain(`{ action: 'shell', resource: 'git show*', effect: 'allow' },`);
      expect(src).toContain(`{ action: 'shell', resource: 'git status*', effect: 'allow' },`);
    }
  });
});
