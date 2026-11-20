import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setup } from './src/commands/setup.js';
import fs from 'fs-extra';
import path from 'path';

const READ_ONLY_ROLES = [
  'g360-orchestrator', 'g360-reviewer', 'g360-security-auditor',
  'g360-data-specialist', 'g360-qa-specialist', 'g360-proposer',
  'g360-evaluator', 'g360-adversary',
];

describe('permisos instalados (kilo.jsonc generado por setup)', () => {
  const base = path.join(process.cwd(), '.tmp-test-home');
  const prevHome = process.env.HOME;
  const prevProfile = process.env.USERPROFILE;
  let config;

  beforeAll(async () => {
    await fs.ensureDir(base);
    const tmpHome = await fs.mkdtemp(path.join(base, 'perm-'));
    process.env.HOME = tmpHome;
    process.env.USERPROFILE = tmpHome;
    await setup({ platform: 'kilo', reset: true });
    const file = path.join(tmpHome, '.config', 'kilo', 'kilo.jsonc');
    config = JSON.parse(await fs.readFile(file, 'utf8'));
  });

  afterAll(async () => {
    process.env.HOME = prevHome;
    process.env.USERPROFILE = prevProfile;
    await fs.remove(base);
  });

  it.each(READ_ONLY_ROLES)('%s tiene edit: deny', (role) => {
    expect(config.agent[role].permission.edit).toBe('deny');
  });

  it('architect es el único que puede editar', () => {
    expect(config.agent['g360-architect'].permission.edit).not.toBe('deny');
  });

  it.each(READ_ONLY_ROLES)('%s no tiene bash comodín permitido', (role) => {
    const bash = config.agent[role].permission.bash;
    if (typeof bash === 'string') expect(bash).not.toBe('allow');
    else if (bash) expect(bash['*']).not.toBe('allow');
  });

  it('qa-specialist no usa "npm run *" abierto', () => {
    const bash = config.agent['g360-qa-specialist'].permission.bash;
    expect(bash['npm run *']).toBeUndefined();
  });
});
