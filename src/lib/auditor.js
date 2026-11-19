import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { autonomyAuditor } from './autonomy-auditor.js';
import { readJsonCached, clearCache } from './file-cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.venv', 'venv', '__pycache__', 'dist', 'build', 'out',
  '.next', '.svelte-kit', '.nuxt', 'coverage', '.pytest_cache', '.ruff_cache',
  '.mypy_cache', 'site-packages', 'target', '.trees', 'vendor', 'Pods'
]);

/**
 * Detecta la versión de Flet declarada en pyproject.toml o requirements.txt.
 * Tolera prefijos de rango (^, ~, >=, >, <=, <, ==, !=, ~=) y comillas.
 * @param {string} projectDir - Directorio del proyecto
 * @returns {{version: string|null, specifier: string|null}|null}
 *   - `version`: número de versión detectada (ej. "1.0.5") o null
 *   - `specifier`: operador detectado ('==', '>=', '~', '^', etc.) o null si es pin exacto
 */
function detectFletVersion(projectDir) {
  for (const fileName of ['pyproject.toml', 'requirements.txt']) {
    const filePath = path.join(projectDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Busca líneas que declaren flet (ignorando comentarios)
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
        // Pin exacto (p. ej. flet = "1.0.5): se prioriza para no confundir el
        // '=' de asignación con un operador de rango de versión.
        const exactMatch = trimmed.match(/\bflet\s*=\s*["']?([\d.]+)["']?/);
        if (exactMatch) {
          return { version: exactMatch[exactMatch.length - 1], specifier: null };
        }
        // Rango de versión (^, ~, >=, <=, >, <, ==, !=, ~=)
        const rangeMatch = trimmed.match(/\bflet.*?([=><~^]+)\s*["']?([\d.]+)/);
        if (rangeMatch) {
          return { version: rangeMatch[rangeMatch.length - 1], specifier: rangeMatch[1] };
        }
      }
    } catch { /* ignore unreadable file */ }
  }
  return { version: null, specifier: null };
}

/**
 * Indica si una línea de código Python es un comentario o está vacía.
 * Descarta comentarios inline (todo lo que sigue a `#` fuera de string).
 * @param {string} line - Línea de código
 * @returns {boolean}
 */
function isCommentOrEmpty(line) {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('#');
}

/**
 * Quita docstrings multilínea (triple comilla simple o doble) de un contenido
 * completo, para que imports dentro de ellas no se confundan con código real.
 * @param {string} content - Contenido completo del archivo .py
 * @returns {string} Contenido sin docstrings multilínea
 */
function stripMultilineDocstrings(content) {
  return content
    .replace(/(''')[\s\S]*?(''')/g, ' ')
    .replace(/(""")[\s\S]*?(""")/g, ' ');
}

/**
 * Elimina strings literales simples de una línea para evitar falsos positivos
 * al buscar imports en cadenas de documentación.
 * @param {string} line - Línea de código
 * @returns {string} Línea con strings reemplazados por espacios
 */
function stripStringLiterals(line) {
  return line
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, ' ') // strings simple
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, ' '); // strings doble
}

/**
 * Busca archivos .py en el proyecto ignorando directorios de dependencias/build.
 * @param {string} dir - Directorio raíz
 * @returns {string[]} Rutas absolutas de archivos .py
 */
function findPyFiles(dir) {
  const result = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith('.py')) result.push(full);
    }
  }
  walk(dir);
  return result;
}

/**
 * Determina si una versión detectada está por debajo del target, ignorando
 * prefijos de rango. Devuelve true si el piso de la versión es menor al target.
 * @param {string} detected - Versión detectada (ej. "0.28.3")
 * @param {string} target - Versión objetivo (ej. "1.0.5")
 * @returns {boolean}
 */
function versionBelowTarget(detected, target) {
  const norm = (v) => String(v).split('.').map(Number);
  const a = norm(detected);
  const b = norm(target);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}

/**
 * @typedef {Object} AuditIssue
 * @property {string} file - Archivo donde se encontró el issue
 * @property {string} message - Mensaje descriptivo del issue
 * @property {string} severity - Severidad del issue ('error' | 'warning')
 */

/**
 * @typedef {Object} AuditResult
 * @property {number} passed - Cantidad de checks que pasaron
 * @property {number} failed - Cantidad de checks que fallaron
 * @property {number} warnings - Cantidad de advertencias
 * @property {number} total - Cantidad total de checks
 * @property {AuditIssue[]} issues - Lista de issues encontrados
 */

/**
 * Módulo de auditoría para proyectos G360
 * @namespace auditor
 */
export const auditor = {
  /**
   * Ejecuta auditoría completa del proyecto
   * @param {string} projectDir - Directorio del proyecto a auditar
   * @param {Object} options - Opciones de auditoría
   * @param {boolean} [options.verbose=false] - Mostrar información detallada
   * @returns {Promise<AuditResult>} Resultado de la auditoría
   * @example
   * const result = await auditor.audit('/my/project', { verbose: true });
   * console.log(`Passed: ${result.passed}, Failed: ${result.failed}`);
   */
  async audit(projectDir, options = {}) {
    const { verbose = false, autonomy = true } = options;
    // Limpia la caché de lecturas de archivos para evitar contaminación entre
    // runs/comandos que operen sobre directorios distintos.
    clearCache();
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
      issues: []
    };

    const checks = [
      { name: 'manifest', check: () => this.checkManifest(projectDir) },
      { name: 'structure', check: () => this.checkStructure(projectDir) },
      { name: 'config', check: () => this.checkConfig(projectDir) },
      { name: 'stack', check: () => this.checkStack(projectDir) }
    ];

    if (autonomy) {
      checks.push({ name: 'autonomy', check: () => this.checkAutonomy(projectDir) });
    }

    for (const { name, check } of checks) {
      const result = await check();
      const findings = Array.isArray(result.findings) ? result.findings : [result];

      for (const finding of findings) {
        const file = finding.file ?? finding.issue?.file ?? 'proyecto';
        const message = finding.message ?? finding.issue?.message ?? '';

        results.total++;

        if (finding.status === 'pass') {
          results.passed++;
        } else if (finding.status === 'n/a') {
          results.passed++;
        } else if (finding.status === 'fail') {
          results.failed++;
          results.issues.push({ file, message, severity: 'error' });
        } else if (finding.status === 'warn') {
          results.warnings++;
          results.issues.push({ file, message, severity: 'warning' });
        }

        if (verbose) {
          const detail = finding.details ?? finding.message;
          if (detail) {
            console.log(chalk.gray(`  ${name}: ${detail}`));
          }
        }
      }
    }

    return results;
  },

  /**
   * Verifica si existe el manifiesto del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Object} Resultado del check
   * @private
   */
  checkManifest(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      return { status: 'pass', details: 'Manifest found' };
    }
    
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = readJsonCached(pkgPath);
        const isG360Tool = 
          pkg.name?.startsWith('g360-') || 
          (pkg.keywords && pkg.keywords.some(k => k.includes('g360'))) ||
          pkg.name === 'g360-cli';
        
        if (isG360Tool) {
          return { status: 'pass', details: 'G360 tool/package - manifest optional' };
        }
      } catch (e) {
        // Continue to warning
      }
    }
    
    return { status: 'warn', issue: { file: 'g360-manifest.json', message: 'No manifest found - run "g360 bring" to initialize' } };
  },

  /**
   * Verifica la estructura del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Object} Resultado del check
   * @private
   */
  checkStructure(projectDir) {
    const g360Dir = path.join(projectDir, 'g360');
    if (fs.existsSync(g360Dir)) {
      return { status: 'pass', details: 'G360 assets directory found' };
    }
    
    // Check if this is a G360 tool/package - structure optional
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = readJsonCached(pkgPath);
        const isG360Tool = 
          pkg.name?.startsWith('g360-') || 
          (pkg.keywords && pkg.keywords.some(k => k.includes('g360'))) ||
          pkg.name === 'g360-cli';
        
        if (isG360Tool) {
          return { status: 'pass', details: 'G360 tool/package - G360 structure optional' };
        }
      } catch (e) {
        // If package.json is invalid, continue to warning
      }
    }
    
    return { status: 'warn', issue: { file: 'g360/', message: 'No G360 assets found - run "g360 bring" to initialize assets' } };
  },

  /**
   * Verifica la configuración del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Object} Resultado del check
   * @private
   */
  checkConfig(projectDir) {
    const configPath = path.join(projectDir, 'g360', 'config');
    if (fs.existsSync(configPath)) {
      return { status: 'pass', details: 'Config directory found' };
    }
    return { status: 'pass' };
  },

  /**
   * Verifica la autosuficiencia del proyecto: debe poder compilar, ejecutarse
   * y probarse sin el asistente y sin red.
   * @param {string} projectDir - Directorio del proyecto
   * @returns {{status: 'pass'|'warn'|'fail', findings: Object[]}} Resultado del check
   * @private
   */
  checkAutonomy(projectDir) {
    return autonomyAuditor.check(projectDir);
  },

  /**
   * Detecta desalineaciones entre el stack/versión declarados y el catálogo de
   * assets (stacks.json / project-types.json). Es informativo por defecto: emite
   * hallazgos con severidad sin cambiar el resultado de la auditoría (no suma
   * fallos, solo advertencias).
   * @param {string} projectDir - Directorio del proyecto
   * @returns {{status: 'pass'|'warn', details?: string, findings?: Object[]}} Resultado del check
   * @private
   */
  checkStack(projectDir) {
    const findings = [];

    // --- Detección de plantilla legacy python-flet (independiente de package.json) ---
    // Un proyecto legacy real (plantilla src/assets/templates/python-flet/) no tiene
    // package.json, solo g360-manifest.json con template: "python-flet".
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = readJsonCached(manifestPath);
        if (manifest?.template === 'python-flet') {
          const typesPath = path.join(__dirname, '..', 'assets', 'config', 'project-types.json');
          let types;
          try {
            types = readJsonCached(typesPath);
          } catch {
            types = null;
          }
          const note = types?.projectTypes?.find((t) => t.id === 'python-flet')?.deprecationNote ?? 'Usar python-flet-polished.';
          findings.push({
            status: 'warn',
            file: 'g360-manifest.json',
            message: `[advertencia] Plantilla 'python-flet' es legacy/deprecada. Fuente: project-types.json (python-flet, deprecated). ${note}`
          });
        }
      } catch { /* ignore invalid manifest */ }
    }

    // --- Detección de stack (solo si hay package.json) ---
    const pkgPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      if (findings.length > 0) {
        return { status: 'warn', findings };
      }
      return { status: 'pass', details: 'Sin package.json: check de stack n/a' };
    }

    let pkg;
    try {
      pkg = readJsonCached(pkgPath);
    } catch {
      if (findings.length > 0) {
        return { status: 'warn', findings };
      }
      return { status: 'pass', details: 'package.json inválido: check de stack n/a' };
    }

    const stackId = pkg?.g360?.stack;
    if (!stackId) {
      if (findings.length > 0) {
        return { status: 'warn', findings };
      }
      return { status: 'pass', details: 'Sin stack declarado en package.json' };
    }

    // Cargar catálogo de stacks (fuente de verdad)
    const stacksPath = path.join(__dirname, '..', 'assets', 'config', 'stacks.json');
    let stacksCatalog;
    try {
      stacksCatalog = readJsonCached(stacksPath).stacks || {};
    } catch {
      stacksCatalog = {};
    }

    const stack = stacksCatalog[stackId];
    if (!stack) {
      if (findings.length > 0) {
        return { status: 'warn', findings };
      }
      return { status: 'pass', details: `Stack ${stackId} no está en el catálogo` };
    }

    // desktop-flet: detectar imports de customtkinter/ctkinter (mezcla de toolkits)
    if (stackId === 'desktop-flet') {
      const pyFiles = findPyFiles(projectDir);
      for (const file of pyFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const sinDocstrings = stripMultilineDocstrings(content);
          const lines = sinDocstrings.split(/\r?\n/);
          let foundImport = false;
          for (const line of lines) {
            // quita comentario inline (todo tras '#') antes de analizar
            const sinComentario = line.replace(/#.*$/, '');
            if (isCommentOrEmpty(sinComentario)) continue;
            const codeLine = stripStringLiterals(sinComentario);
            if (/\b(customtkinter|ctkinter)\b/.test(codeLine)) {
              foundImport = true;
              break;
            }
          }
          if (foundImport) {
            findings.push({
              status: 'warn',
              file: path.relative(projectDir, file),
              message: `[advertencia] Proyecto declara stack desktop-flet pero importa customtkinter/ctkinter. Fuente: stacks.json (desktop-flet, target flet ${stack.targetVersions?.flet}). Sugerencia: usar plantilla python-flet-migrate o python-customtkinter.`
            });
            break;
          }
        } catch { /* ignore unreadable file */ }
      }

      // desktop-flet: verificar versión de Flet contra el target del catálogo
      const fletInfo = detectFletVersion(projectDir);
      const targetFlet = stack.targetVersions?.flet;
      if (fletInfo.version && targetFlet) {
        const below = versionBelowTarget(fletInfo.version, targetFlet);
        const specifier = fletInfo.specifier ?? '==';
        const isExactPin = specifier === null || specifier === '==' || specifier === '===';
        // Avisar si la versión distinta del target (pin exacto viejo) O si el piso está por debajo
        const mismatch = isExactPin ? fletInfo.version !== targetFlet : below;
        if (mismatch) {
          findings.push({
            status: 'warn',
            file: 'pyproject.toml / requirements.txt',
            message: `[advertencia] Flet ${fletInfo.specifier ? fletInfo.specifier + ' ' : ''}versión ${fletInfo.version} detectada; stacks.json (desktop-flet) declara target flet ${targetFlet}.`
          });
        }
      }
    }

    if (findings.length > 0) {
      return { status: 'warn', findings };
    }
    return { status: 'pass', details: 'Stack y versiones acordes al catálogo' };
  }
};
