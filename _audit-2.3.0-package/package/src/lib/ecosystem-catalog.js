/**
 * Catálogo de repositorios G360: roles, dependencias y validación.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { readJsonSafe } from './json-io.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, '..', 'assets', 'config', 'catalog.json');
let _cache = null;

export function getCatalog() {
  if (_cache) return _cache;
  try { _cache = readJsonSafe(CATALOG_PATH); }
  catch { _cache = { version: '0.0.0', repos: {}, reglas: {} }; }
  return _cache;
}

export function validateEcosystem() {
  const cat = getCatalog();
  const repos = cat.repos || {};
  const reglas = cat.reglas || {};
  const issues = [];

  function hasCycle(start, visited=new Set(), stack=new Set()) {
    if (stack.has(start)) return true;
    if (visited.has(start)) return false;
    visited.add(start); stack.add(start);
    for (const dep of (repos[start]?.depends_on || [])) { if (hasCycle(dep, visited, stack)) return true; }
    stack.delete(start); return false;
  }

  if (reglas.no_ciclos !== false) {
    for (const repo of Object.keys(repos)) {
      if (hasCycle(repo)) issues.push({ repo, rule: 'no_cycles', message: 'Ciclo en ' + repo });
    }
  }
  if (reglas.api_debe_depender_de_provider !== false) {
    for (const [name, info] of Object.entries(repos)) {
      if (info.role === 'api') {
        const hasProv = (info.depends_on || []).some(d => repos[d]?.role === 'provider');
        if (!hasProv) issues.push({ repo: name, rule: 'api_needs_provider', message: name + ' es API sin provider' });
      }
    }
  }
  for (const [name, info] of Object.entries(repos)) {
    for (const dep of info.depends_on || []) {
      if (!repos[dep]) issues.push({ repo: name, rule: 'dep_exists', message: 'Dependencia ' + dep + ' no existe' });
    }
  }
  return { valid: issues.length === 0, issues };
}

export function getProviders() {
  return Object.entries(getCatalog().repos || {}).filter(([,r]) => r.role === 'provider').map(([n]) => n);
}

export function getConsumersOf(provider) {
  return Object.entries(getCatalog().repos || {}).filter(([,r]) => (r.depends_on || []).includes(provider)).map(([n]) => n);
}