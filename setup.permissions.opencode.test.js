import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setup } from './src/commands/setup.js';
import fs from 'fs-extra';
import path from 'path';

const READ_ONLY = ['orchestrator','reviewer','security-auditor','data-specialist',
  'qa-specialist','proposer','evaluator','adversary'];

const effectOf = (perms, action) =>
  perms.filter(p => p.action === action && p.resource === '*').map(p => p.effect);

describe('permisos instalados (opencode.json generado por setup)', () => {
  const base = path.join(process.cwd(), '.tmp-test-home-oc');
  const prevHome = process.env.HOME, prevProfile = process.env.USERPROFILE;
  let agents;

  beforeAll(async () => {
    await fs.ensureDir(base);
    const home = await fs.mkdtemp(path.join(base, 'perm-'));
    process.env.HOME = home; process.env.USERPROFILE = home;
    await setup({ platform: 'opencode', reset: true });
    const cfg = JSON.parse(await fs.readFile(
      path.join(home, '.config', 'opencode', 'opencode.json'), 'utf8'));
    agents = cfg.agents;
  });

  afterAll(async () => {
    process.env.HOME = prevHome; process.env.USERPROFILE = prevProfile;
    await fs.remove(base);
  });

  it.each(READ_ONLY)('%s tiene edit denegado', (role) => {
    expect(effectOf(agents[role].permissions, 'edit')).toContain('deny');
  });

  it('architect es el único con edit permitido', () => {
    expect(effectOf(agents.architect.permissions, 'edit')).toContain('allow');
  });
});