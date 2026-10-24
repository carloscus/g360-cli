import fs from 'fs-extra';
import path from 'path';
import { detectEnvVars, isFixturePath, walkFiles } from './env-detector.js';

/**
 * Checks de autosuficiencia: el repositorio debe poder compilar, ejecutarse y
 * probarse sin el asistente y sin red.
 *
 * Criterio: `git clone <repo>` + un comando => la app levanta y los tests
 * pasan, sin red y sin intervención humana.
 *
 * @typedef {Object} AutonomyFinding
 * @property {string} id - Identificador del check
 * @property {string} label - Nombre legible del check
 * @property {'pass'|'warn'|'fail'|'n/a'} status - Resultado
 * @property {string} file - Archivo (o ruta) donde se reporta el problema
 * @property {string} message - Mensaje accionable
 */

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.venv', 'venv', '__pycache__', 'dist', 'build', 'out',
  '.next', '.svelte-kit', '.nuxt', 'coverage', '.pytest_cache', '.ruff_cache',
  '.mypy_cache', 'site-packages', 'target', '.trees', 'vendor', 'Pods', 'vendor'
]);

const LOCKFILES = [
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb',
  'uv.lock', 'poetry.lock', 'Pipfile.lock', 'Cargo.lock', 'go.sum',
  'composer.lock', 'Gemfile.lock', 'requirements.lock'
];

const ENV_EXAMPLES = [
  '.env.example', '.env.sample', '.env.template', '.env.dist', 'env.example'
];

const VERIFICATION_PATTERNS = [
  /\bnpm\s+(run\s+)?(test|build|lint|check|typecheck)\b/i,
  /\bpnpm\s+(run\s+)?(test|build|lint|check)\b/i,
  /\byarn\s+(test|build|lint)\b/i,
  /\bvitest\b/i,
  /\bjest\b/i,
  /\bplaywright\b/i,
  /\bpytest\b/i,
  /\buv\s+run\b/i,
  /\bgo\s+(test|build)\b/i,
  /\bcargo\s+(test|clippy|build)\b/i,
  /\bmvn\s+test\b/i,
  /\bgradle\s+test\b/i
];

/**
 * Skips que enmascaran un test (siempre queda sin ejecutar).
 * Los condicionales (`skipif`, `pytest.skip` por datos ausentes) van aparte:
 * son práctica normal y no rompen el "verde" real.
 */
const HARD_SKIP_PATTERNS = [
  /\b(?:it|test|describe)\.skip\s*\(/,
  /\b(?:xit|xtest)\s*\(/,
  /\btest\.todo\s*\(/,
  /@pytest\.mark\.xfail\b/,
  /@pytest\.mark\.skip\b(?!\s*if)/
];

const CONDITIONAL_SKIP_PATTERNS = [
  /@pytest\.mark\.skipif\b/,
  /\bpytest\.skip\s*\(/
];

const ENV_ACCESS = [
  /process\.env\b/,
  /import\.meta\.env\b/,
  /os\.environ\b/,
  /os\.getenv\s*\(/,
  /Deno\.env\b/
];

const TEST_FILE_PATTERNS = [
  /\.(test|spec)\.(js|mjs|cjs|jsx|ts|tsx)$/i,
  /(^test_.+|.+_test)\.py$/i
];

const MAX_TEST_FILES = 300;
const MAX_FILE_BYTES = 512 * 1024;

/**
 * Recorre el proyecto ignorando directorios de dependencias y build.
 * @param {string} dir - Directorio raíz
 * @param {Object} options - Opciones
 * @param {number} [options.maxFiles=500] - Máximo de archivos a devolver
 * @param {number} [options.maxDepth=6] - Profundidad máxima
 * @param {Function} [options.filter] - Filtro por ruta completa
 * @returns {string[]} Rutas absolutas
 */
function walk(dir, { maxFiles = 500, maxDepth = 6, filter = () => true } = {}) {
  return walkFiles(dir, { maxFiles, maxDepth, filter });
}

/**
 * Lee un archivo de texto, tolerando errores de permisos o binarios.
 * @param {string} filePath - Ruta del archivo
 * @returns {string|null} Contenido o null
 */
function readText(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Busca el archivo de instrucciones del repo (AGENTS.md y equivalentes).
 * @param {string} projectDir - Directorio del proyecto
 * @returns {{name: string, path: string, content: string}|null}
 */
function findInstructionsFile(projectDir) {
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const filePath = path.join(projectDir, name);
    if (fs.existsSync(filePath)) {
      return { name, path: filePath, content: readText(filePath) ?? '' };
    }
  }
  return null;
}

/**
 * Detecta si el texto declara un comando de verificación ejecutable.
 * @param {string} text - Contenido a inspeccionar
 * @returns {boolean} true si encuentra un comando de verificación
 */
function hasVerificationCommand(text) {
  if (!text) return false;
  return VERIFICATION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * @param {string} projectDir - Directorio del proyecto
 * @returns {AutonomyFinding}
 */
function checkInstructionsFile(projectDir) {
  const instructions = findInstructionsFile(projectDir);

  if (!instructions) {
    return {
      id: 'instructions',
      label: 'AGENTS.md',
      status: 'fail',
      file: 'AGENTS.md',
      message: 'Falta AGENTS.md con las reglas del repo y su comando de verificación'
    };
  }

  return {
    id: 'instructions',
    label: 'AGENTS.md',
    status: 'pass',
    file: instructions.name,
    message: `Instrucciones del repo en ${instructions.name}`
  };
}

/**
 * @param {string} projectDir - Directorio del proyecto
 * @returns {AutonomyFinding}
 */
function checkVerificationCommand(projectDir) {
  const instructions = findInstructionsFile(projectDir);
  const readmePath = path.join(projectDir, 'README.md');
  const readme = fs.existsSync(readmePath) ? readText(readmePath) ?? '' : '';

  if (instructions && hasVerificationCommand(instructions.content)) {
    return {
      id: 'verification',
      label: 'Comando de verificación',
      status: 'pass',
      file: instructions.name,
      message: `Comando de verificación declarado en ${instructions.name}`
    };
  }

  if (hasVerificationCommand(readme)) {
    return {
      id: 'verification',
      label: 'Comando de verificación',
      status: 'warn',
      file: 'README.md',
      message: 'El README menciona un comando de verificación, pero AGENTS.md no lo declara'
    };
  }

  return {
    id: 'verification',
    label: 'Comando de verificación',
    status: 'fail',
    file: 'AGENTS.md',
    message: 'Ningún archivo declara el comando de verificación (build + lint + tests)'
  };
}

/**
 * @param {string} projectDir - Directorio del proyecto
 * @returns {AutonomyFinding}
 */
function checkReadme(projectDir) {
  const readmePath = path.join(projectDir, 'README.md');

  if (fs.existsSync(readmePath)) {
    return {
      id: 'readme',
      label: 'README',
      status: 'pass',
      file: 'README.md',
      message: 'README presente'
    };
  }

  return {
    id: 'readme',
    label: 'README',
    status: 'fail',
    file: 'README.md',
    message: 'Falta README.md (instrucciones de instalación, uso y verificación)'
  };
}

/**
 * @param {string} projectDir - Directorio del proyecto
 * @returns {AutonomyFinding}
 */
function checkLockfile(projectDir) {
  const found = LOCKFILES.find((name) => fs.existsSync(path.join(projectDir, name)));

  if (found) {
    return {
      id: 'lockfile',
      label: 'Lockfile',
      status: 'pass',
      file: found,
      message: `Dependencias fijadas en ${found}`
    };
  }

  const declaresDependencies =
    fs.existsSync(path.join(projectDir, 'package.json')) ||
    fs.existsSync(path.join(projectDir, 'pyproject.toml')) ||
    fs.existsSync(path.join(projectDir, 'requirements.txt'));

  if (declaresDependencies) {
    return {
      id: 'lockfile',
      label: 'Lockfile',
      status: 'warn',
      file: 'lockfile',
      message: 'Declara dependencias pero no versiona un lockfile (instalación no reproducible)'
    };
  }

  return {
    id: 'lockfile',
    label: 'Lockfile',
    status: 'n/a',
    file: 'lockfile',
    message: 'El proyecto no declara dependencias: no hay nada que fixar'
  };
}

/**
 * @param {string} projectDir - Directorio del proyecto
 * @returns {AutonomyFinding}
 */
function checkEnvExample(projectDir) {
  const example = ENV_EXAMPLES.find((name) => fs.existsSync(path.join(projectDir, name)));

  if (example) {
    return {
      id: 'env-example',
      label: '.env.example',
      status: 'pass',
      file: example,
      message: `Variables de entorno documentadas en ${example}`
    };
  }

  const envVars = detectEnvVars(projectDir);

  if (envVars.length > 0) {
    return {
      id: 'env-example',
      label: '.env.example',
      status: 'warn',
      file: '.env.example',
      message: `El código lee ${envVars.length} variable(s) de entorno (${envVars.slice(0, 3).join(', ')}${envVars.length > 3 ? ', ...' : ''}) pero no hay .env.example con los defaults`
    };
  }

  return {
    id: 'env-example',
    label: '.env.example',
    status: 'pass',
    file: '.env.example',
    message: 'No usa variables de entorno'
  };
}

/**
 * Detecta skips en un archivo de test, ignorando las menciones que están
 * dentro de strings o comentarios (p. ej. fixtures que documentan el patrón).
 * @param {string} content - Contenido del archivo
 * @param {RegExp[]} patterns - Patrones a buscar
 * @returns {boolean} true si hay un skip real
 */
function hasSkipPattern(content, patterns) {
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (!match) continue;

      // Si el match cae dentro de un string (comillas impares antes), es texto.
      const before = line.slice(0, match.index);
      const quotes = (before.match(/(?<!\\)['"`]/g) || []).length;
      if (quotes % 2 === 1) continue;

      return true;
    }
  }

  return false;
}

/**
 * @param {string} projectDir - Directorio del proyecto
 * @returns {AutonomyFinding}
 */
function checkSkippedTests(projectDir) {
  const testFiles = walk(projectDir, {
    maxFiles: MAX_TEST_FILES,
    filter: (file) =>
      !isFixturePath(projectDir, file) &&
      TEST_FILE_PATTERNS.some((pattern) => pattern.test(path.basename(file)))
  });

  const hard = testFiles.filter((file) => {
    const content = readText(file);
    if (!content) return false;
    return hasSkipPattern(content, HARD_SKIP_PATTERNS);
  });

  if (hard.length > 0) {
    const sample = hard.slice(0, 3).map((file) => path.relative(projectDir, file));

    return {
      id: 'skipped-tests',
      label: 'Tests honestos',
      status: 'warn',
      file: 'tests',
      message: `${hard.length} archivo(s) de test con skip/xfail/todo sin condición: ${sample.join(', ')}${hard.length > sample.length ? ', ...' : ''}`
    };
  }

  const conditional = testFiles.filter((file) => {
    const content = readText(file);
    if (!content) return false;
    return hasSkipPattern(content, CONDITIONAL_SKIP_PATTERNS);
  });

  if (conditional.length > 0) {
    return {
      id: 'skipped-tests',
      label: 'Tests honestos',
      status: 'pass',
      file: 'tests',
      message: `Sin tests enmascarados (${conditional.length} archivo(s) con skip condicional por datos ausentes)`
    };
  }

  return {
    id: 'skipped-tests',
    label: 'Tests honestos',
    status: 'pass',
    file: 'tests',
    message: 'Sin tests deshabilitados detectados'
  };
}

export const autonomyAuditor = {
  /**
   * Ejecuta todos los checks de autosuficiencia sobre un proyecto.
   * @param {string} projectDir - Directorio del proyecto
   * @returns {{status: 'pass'|'warn'|'fail', findings: AutonomyFinding[]}}
   */
  check(projectDir) {
    const findings = [
      checkInstructionsFile(projectDir),
      checkVerificationCommand(projectDir),
      checkReadme(projectDir),
      checkLockfile(projectDir),
      checkEnvExample(projectDir),
      checkSkippedTests(projectDir)
    ];

    const status = findings.some((f) => f.status === 'fail')
      ? 'fail'
      : findings.some((f) => f.status === 'warn')
        ? 'warn'
        : 'pass';

    return { status, findings };
  }
};

export default autonomyAuditor;
