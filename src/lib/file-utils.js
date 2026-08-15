import fs from 'fs-extra';
import path from 'path';

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'out', '.nuxt', 'coverage', '.cache', '.svelte-kit', '__pycache__', '.pytest_cache', 'g360'];

/**
 * Obtiene todos los archivos relativos de un directorio (recursivo)
 * @param {string} dir - Directorio raiz
 * @param {string} baseDir - Directorio base para paths relativos
 * @returns {Promise<string[]>} Lista de paths relativos
 */
export async function getAllFiles(dir, baseDir = dir) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (IGNORE_DIRS.includes(item.name) || item.name.startsWith('.')) continue;

    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Walk recursivo de proyecto con callbacks por tipo de archivo
 * Consolidacion de los walk() duplicados en lint.js, docs.js, clean.js
 * @param {string} dir - Directorio a escanear
 * @param {Object} callbacks - Callbacks por extension
 * @param {Function} callbacks.onJs - Callback para archivos .js/.jsx
 * @param {Function} callbacks.onPy - Callback para archivos .py
 * @param {Function} callbacks.onFile - Callback para cualquier archivo (recibe fullPath, relativePath)
 * @param {Function} callbacks.onDir - Callback para directorios (recibe relativePath)
 * @param {Object} options - Opciones extras
 * @param {number} options.maxDepth - Profundidad maxima (default: 10)
 * @param {string[]} options.skipDirs - Directorios adicionales a ignorar
 */
export function walkProject(dir, callbacks, options = {}) {
  const { maxDepth = 10, skipDirs = [] } = options;
  const allSkip = [...IGNORE_DIRS, ...skipDirs];

  function walk(d, depth) {
    if (depth > maxDepth) return;
    const items = fs.readdirSync(d, { withFileTypes: true });

    for (const item of items) {
      if (item.name.startsWith('.') || allSkip.includes(item.name)) continue;

      const fullPath = path.join(d, item.name);
      const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');

      if (item.isDirectory()) {
        if (callbacks.onDir) callbacks.onDir(relPath, fullPath);
        walk(fullPath, depth + 1);
      } else if (item.isFile()) {
        if (callbacks.onFile) callbacks.onFile(fullPath, relPath, item.name);

        if (item.name.endsWith('.js') && !item.name.endsWith('.test.js') && !item.name.endsWith('.spec.js')) {
          if (callbacks.onJs) callbacks.onJs(fullPath, relPath);
        }
        if (item.name.endsWith('.jsx') && !item.name.endsWith('.test.jsx')) {
          if (callbacks.onJs) callbacks.onJs(fullPath, relPath);
        }
        if (item.name.endsWith('.ts') && !item.name.endsWith('.test.ts')) {
          if (callbacks.onJs) callbacks.onJs(fullPath, relPath);
        }
        if (item.name.endsWith('.tsx') && !item.name.endsWith('.test.tsx')) {
          if (callbacks.onJs) callbacks.onJs(fullPath, relPath);
        }
        if (item.name.endsWith('.py')) {
          if (callbacks.onPy) callbacks.onPy(fullPath, relPath);
        }
      }
    }
  }

  walk(dir, 0);
}

/**
 * Obtiene archivos JS/TS de un proyecto (sin tests)
 * @param {string} dir - Directorio del proyecto
 * @returns {string[]} Lista de paths absolutos
 */
export function getJsFiles(dir) {
  const files = [];
  walkProject(dir, {
    onJs: (fullPath) => files.push(fullPath),
  });
  return files;
}

/**
 * Obtiene archivos Python de un proyecto (sin __init__.py)
 * @param {string} dir - Directorio del proyecto
 * @returns {string[]} Lista de paths absolutos
 */
export function getPyFiles(dir) {
  const files = [];
  walkProject(dir, {
    onPy: (fullPath) => files.push(fullPath),
  });
  return files;
}
