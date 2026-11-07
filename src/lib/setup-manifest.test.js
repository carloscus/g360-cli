/**
 * @file setup-manifest.test.js
 * @description Tests del manifiesto de integridad de agentes
 * (createManifest / verifyManifest) sobre un home temporal aislado.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { createManifest, verifyManifest } from './setup-manifest.js';

let home;

/** Crea un archivo de fixture dentro del home temporal. */
async function fixture(relPath, content) {
  const absolute = path.join(home, relPath);
  await fs.ensureDir(path.dirname(absolute));
  await fs.writeFile(absolute, content);
  return absolute;
}

describe('setup-manifest', () => {
  beforeEach(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-manifest-'));
  });

  afterEach(async () => {
    await fs.remove(home);
  });

  it('createManifest escribe .agents/.manifest.json con hashes SHA-256 correctos', async () => {
    await fixture('.agents/HANDOFF.md', '# handoff');
    await fixture('.agents/goldfish.ps1', 'param($Repo)');
    await fixture('.config/opencode/opencode.json', '{"agents":{}}');
    await fixture('.config/opencode/agents/reviewer.md', '# reviewer');
    await fixture('.config/kilo/kilo.jsonc', '{"agent":{}}');

    const { path: manifestPath, manifest } = await createManifest(home);

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(manifest.files.length).toBe(5);
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.createdAt).toBeTruthy();

    const byPath = Object.fromEntries(manifest.files.map((f) => [f.path, f.hash]));
    expect(byPath['.agents/HANDOFF.md']).toBe(
      crypto.createHash('sha256').update('# handoff').digest('hex')
    );
    // solo extensiones canónicas por directorio: .json en .config/opencode
    expect(byPath['.config/opencode/opencode.json']).toBeTruthy();
    expect(byPath['.config/kilo/kilo.jsonc']).toBeTruthy();
  });

  it('excluye .backup/, node_modules y extensiones no canónicas', async () => {
    await fixture('.agents/HANDOFF.md', 'x');
    await fixture('.agents/.manifest.json', '{}'); // no es .md ni .ps1
    await fixture('.agents/.backup/viejo/HANDOFF.md', 'viejo');
    await fixture('.agents/notas.txt', 'txt');
    await fixture('.config/opencode/cache.bin', 'bin');

    const { manifest } = await createManifest(home);
    const paths = manifest.files.map((f) => f.path);

    expect(paths).toEqual(['.agents/HANDOFF.md']);
  });

  it('verifyManifest pasa cuando nada cambió', async () => {
    await fixture('.agents/HANDOFF.md', 'x');
    await createManifest(home);

    const result = await verifyManifest(home);
    expect(result.valid).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.missing).toBe(false);
    expect(result.fileCount).toBe(1);
  });

  it('detecta archivos modificados desde el setup', async () => {
    await fixture('.agents/HANDOFF.md', 'x');
    await fixture('.config/kilo/kilo.jsonc', 'a');
    await createManifest(home);

    await fs.writeFile(path.join(home, '.agents', 'HANDOFF.md'), 'PROMPT ALTERADO');

    const result = await verifyManifest(home);
    expect(result.valid).toBe(false);
    expect(result.mismatches).toEqual(['.agents/HANDOFF.md']);
  });

  it('detecta archivos borrados y nuevos respecto del manifest', async () => {
    await fixture('.agents/HANDOFF.md', 'x');
    await fixture('.agents/AGENTS.md', 'y');
    await createManifest(home);

    await fs.remove(path.join(home, '.agents', 'HANDOFF.md'));
    await fixture('.config/opencode/agents/nuevo.md', 'z');

    const result = await verifyManifest(home);
    expect(result.valid).toBe(false);
    expect(result.mismatches).toEqual([
      '.agents/HANDOFF.md',
      '.config/opencode/agents/nuevo.md',
    ]);
  });

  it('reporta missing cuando no hay manifest', async () => {
    const result = await verifyManifest(home);
    expect(result.valid).toBe(false);
    expect(result.missing).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.fileCount).toBe(0);
  });
});
