/**
 * Manifiesto de integridad del sistema multiagente instalado.
 *
 * Calcula SHA-256 de los prompts/configs que `g360 setup` instala
 * (~/.agents, ~/.config/opencode, ~/.config/kilo) y los guarda en
 * ~/.agents/.manifest.json. `g360 audit --agents` recalcula los hashes
 * para detectar alteraciones posteriores de los prompts de agentes.
 *
 * El manifest no es un control de acceso: es un detector de drift entre
 * lo que instaló setup y lo que hay en disco.
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Directorios que auditamos, con las extensiones canónicas de cada uno.
 * Las rutas son relativas al home del usuario.
 */
const AUDIT_ROOTS = [
  { dir: '.agents', extensions: ['.md', '.ps1'] },
  { dir: path.join('.config', 'opencode'), extensions: ['.json', '.md'] },
  { dir: path.join('.config', 'kilo'), extensions: ['.jsonc'] },
];

const MANIFEST_REL_PATH = path.join('.agents', '.manifest.json');

/** Directorios que nunca se auditan (backups propios de setup). */
const SKIP_DIRS = new Set(['.backup', 'node_modules', '__pycache__']);

/**
 * Lee la versión de g360-cli desde su package.json.
 * @returns {string}
 */
function cliVersion() {
  try {
    const pkg = fs.readJsonSync(path.join(__dirname, '..', '..', 'package.json'));
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Home por defecto para las instalaciones del harness.
 * @returns {string}
 */
export function defaultBaseDir() {
  return process.env.HOME || process.env.USERPROFILE;
}

/**
 * Recolecta los archivos auditables bajo baseDir con su hash SHA-256.
 * @param {string} baseDir - Home del usuario
 * @returns {Promise<Array<{path: string, hash: string}>>} Rutas relativas con `/`
 */
async function collectFiles(baseDir) {
  const files = [];

  for (const { dir, extensions } of AUDIT_ROOTS) {
    const root = path.join(baseDir, dir);
    if (!fs.existsSync(root)) continue;

    // walker recursivo explícito: evita depender de glob y permite
    // saltar .backup/ sin filtrar después
    const stack = [root];
    while (stack.length > 0) {
      const current = stack.pop();
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) stack.push(path.join(current, entry.name));
          continue;
        }
        if (!extensions.includes(path.extname(entry.name).toLowerCase())) continue;
        const absolute = path.join(current, entry.name);
        const content = await fs.readFile(absolute);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        files.push({
          path: path.relative(baseDir, absolute).replace(/\\/g, '/'),
          hash,
        });
      }
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Crea el manifiesto en <baseDir>/.agents/.manifest.json.
 * @param {string} [baseDir] - Home del usuario (default: HOME/USERPROFILE)
 * @returns {Promise<{path: string, manifest: object}>}
 */
export async function createManifest(baseDir = defaultBaseDir()) {
  const files = await collectFiles(baseDir);
  const manifest = {
    version: cliVersion(),
    createdAt: new Date().toISOString(),
    files,
  };
  const manifestPath = path.join(baseDir, MANIFEST_REL_PATH);
  await fs.ensureDir(path.dirname(manifestPath));
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  return { path: manifestPath, manifest };
}

/**
 * Verifica el manifiesto existente recalculando los hashes actuales.
 * @param {string} [baseDir] - Home del usuario (default: HOME/USERPROFILE)
 * @returns {Promise<{valid: boolean, mismatches: string[], missing: boolean,
 *   createdAt: string|null, fileCount: number}>}
 */
export async function verifyManifest(baseDir = defaultBaseDir()) {
  const manifestPath = path.join(baseDir, MANIFEST_REL_PATH);
  if (!fs.existsSync(manifestPath)) {
    return { valid: false, mismatches: [], missing: true, createdAt: null, fileCount: 0 };
  }

  const manifest = await fs.readJson(manifestPath);
  const recorded = new Map(manifest.files.map((f) => [f.path, f.hash]));
  const current = await collectFiles(baseDir);
  const currentPaths = new Set(current.map((f) => f.path));

  const mismatches = [];
  // Alterados o borrados desde el setup
  for (const file of current) {
    if (recorded.get(file.path) !== file.hash) mismatches.push(file.path);
  }
  // Nuevos respecto del manifest
  for (const recordedPath of recorded.keys()) {
    if (!currentPaths.has(recordedPath)) mismatches.push(recordedPath);
  }

  return {
    valid: mismatches.length === 0,
    mismatches: mismatches.sort((a, b) => a.localeCompare(b)),
    missing: false,
    createdAt: manifest.createdAt ?? null,
    fileCount: manifest.files.length,
  };
}
