import fs from 'fs-extra';
import path from 'path';

/**
 * Detección de variables de entorno. La usan tanto el auditor (para verificar
 * que exista `.env.example`) como el generador de AGENTS.md (para crearlo):
 * una sola implementación para que nunca discrepen.
 */

export const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.venv', 'venv', '__pycache__', 'dist', 'build', 'out',
  '.next', '.svelte-kit', '.nuxt', 'coverage', '.pytest_cache', '.ruff_cache',
  '.mypy_cache', 'site-packages', 'target', '.trees', 'vendor', 'Pods', 'logs'
]);

export const SOURCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.svelte', '.vue', '.astro',
  '.go', '.rs'
]);

export const TEST_FILE_PATTERNS = [
  /\.(test|spec)\.(js|mjs|cjs|jsx|ts|tsx)$/i,
  /(^test_.+|.+_test)\.py$/i
];

const ENV_PATTERNS = [
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,
  /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
  /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
  /import\.meta\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
  /os\.environ(?:\.get)?\(?\[?['"]([A-Z_][A-Z0-9_]*)['"]/g,
  /os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g,
  /Deno\.env\.get\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g
];

/** Variables del sistema o del toolchain: no son configuración de la app. */
const ENV_IGNORE = new Set([
  'PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP',
  'SYSTEMROOT', 'COMSPEC', 'SHELL', 'LANG', 'LC_ALL', 'HOSTNAME', 'PWD',
  'PROCESSOR_ARCHITECTURE', 'HOMEDRIVE', 'HOMEPATH', 'PROGRAMFILES',
  'NODE_ENV', 'DEV', 'PROD', 'SSR', 'BASE_URL', 'MODE', 'PORT'
]);

/**
 * Recorre el proyecto ignorando dependencias, build y directorios ocultos.
 * @param {string} dir - Directorio raíz
 * @param {Object} options - Opciones
 * @param {number} [options.maxFiles=600] - Máximo de archivos
 * @param {number} [options.maxDepth=6] - Profundidad máxima
 * @param {Function} [options.filter] - Filtro por ruta
 * @returns {string[]} Rutas absolutas
 */
export function walkFiles(dir, { maxFiles = 600, maxDepth = 6, filter = () => true } = {}) {
  const files = [];
  const stack = [{ dir, depth: 0 }];

  while (stack.length > 0 && files.length < maxFiles) {
    const { dir: current, depth } = stack.pop();

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        if (depth + 1 > maxDepth) continue;
        stack.push({ dir: full, depth: depth + 1 });
      } else if (entry.isFile()) {
        if (filter(full)) files.push(full);
      }
    }
  }

  return files;
}

/**
 * Detecta las variables de entorno que usa el código (excluye tests: ahí los
 * nombres aparecen como fixtures y no son configuración de la app).
 * @param {string} projectDir - Directorio del proyecto
 * @returns {string[]} Nombres de variables, ordenados
 */
export function detectEnvVars(projectDir) {
  const files = walkFiles(projectDir, {
    filter: (file) =>
      SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()) &&
      !TEST_FILE_PATTERNS.some((pattern) => pattern.test(path.basename(file)))
  });

  const found = new Set();

  for (const file of files) {
    let content;
    try {
      const stat = fs.statSync(file);
      if (stat.size > 512 * 1024) continue;
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    for (const pattern of ENV_PATTERNS) {
      pattern.lastIndex = 0;
      let match = pattern.exec(content);
      while (match !== null) {
        if (!ENV_IGNORE.has(match[1])) found.add(match[1]);
        match = pattern.exec(content);
      }
    }
  }

  return [...found].sort();
}
