import fs from 'fs-extra';
import path from 'path';
import { detectEnvVars, walkFiles } from './env-detector.js';

/**
 * Generador de AGENTS.md por repo: deriva el comando de verificación real a
 * partir del stack del proyecto (package.json, pyproject.toml, go.mod,
 * Cargo.toml) para que el repo sea autosuficiente sin intervención humana.
 *
 * El bloque generado va entre markers HTML, así se puede regenerar sin perder
 * lo que el humano escriba afuera. Es idempotente: dos corridas dan el mismo
 * archivo.
 *
 * @typedef {Object} RepoAnalysis
 * @property {string} stack - 'node' | 'python' | 'go' | 'rust' | 'desconocido'
 * @property {string} packageManager - npm | pnpm | yarn | bun | uv | pip | '-'
 * @property {string|null} install - Comando de instalación de dependencias
 * @property {string} verify - Comando único de verificación
 * @property {string} runner - Test runner detectado
 * @property {boolean} hasTests - Si hay tests en el repo
 * @property {string[]} entrypoints - Entry points detectados
 * @property {string[]} envVars - Variables de entorno usadas por el código
 * @property {string[]} sections - Carpetas relevantes del repo
 * @property {string|null} description - Descripción extraída del README
 */

const BEGIN_MARKER = '<!-- g360:agents:begin -->';
const END_MARKER = '<!-- g360:agents:end -->';

const ENTRYPOINT_CANDIDATES = [
  'main.py', 'src/main.py', 'app/main.py', 'src/app.py', 'run.py', 'build.py',
  'index.html', 'src/main.ts', 'src/main.tsx', 'src/main.jsx', 'src/App.tsx',
  'src/App.jsx', 'src/routes', 'src/lib', 'src-tauri', 'cmd', 'internal',
  'frontend', 'scripts', 'config', 'plantillas'
];

const TEST_FILE_PATTERNS = [
  /\.(test|spec)\.(js|mjs|cjs|jsx|ts|tsx)$/i,
  /(^test_.+|.+_test)\.py$/i
];

const RELEVANT_SECTIONS = [
  'src', 'app', 'tests', 'test', 'cmd', 'internal', 'lib', 'frontend',
  'backend', 'g360', 'g360_flet', 'scripts', 'config', 'plantillas', 'data'
];

/**
 * Lee un archivo de texto tolerando errores.
 * @param {string} filePath - Ruta
 * @returns {string|null}
 */
function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Detecta el salto de línea dominante de un directorio.
 * @param {string} dir - Directorio
 * @returns {string} '\r\n' o '\n'
 */
function detectEol(dir) {
  for (const name of ['AGENTS.md', 'README.md']) {
    const content = readText(path.join(dir, name));
    if (content && content.includes('\r\n')) return '\r\n';
  }
  return process.platform === 'win32' ? '\r\n' : '\n';
}

/**
 * Extrae la descripción de un README (primer párrafo con sentido).
 * @param {string|null} readme - Contenido del README
 * @returns {string|null}
 */
function extractDescription(readme) {
  if (!readme) return null;

  for (const rawLine of readme.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '').replace(/\*\*/g, '').trim();
      if (text.length > 12) return text.slice(0, 160);
      continue;
    }
    if (line.startsWith('#') || line.startsWith('![') || line.startsWith('<')) continue;
    if (line.startsWith('```') || line.startsWith('|') || line.startsWith('- ')) continue;
    if (/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(line)) continue;
    if (line.startsWith('*') || line.startsWith('[')) continue;

    return line.replace(/\*\*/g, '').slice(0, 160);
  }

  return null;
}

/**
 * Detecta si el repo tiene archivos de test (en cualquier carpeta).
 * @param {string} projectDir - Directorio del proyecto
 * @returns {boolean}
 */
function hasTestFiles(projectDir) {
  const files = walkFiles(projectDir, { maxFiles: 600, maxDepth: 4 });
  return files.some((file) => TEST_FILE_PATTERNS.some((pattern) => pattern.test(path.basename(file))));
}

/**
 * Resuelve el nombre del repo. En un worktree la carpeta se llama como la
 * rama, así que se resuelve el repo real desde el archivo `.git`.
 * @param {string} projectDir - Directorio del proyecto
 * @returns {string} Nombre del repo
 */
function resolveRepoName(projectDir) {
  const dotGit = path.join(projectDir, '.git');

  try {
    const stat = fs.statSync(dotGit);

    if (!stat.isDirectory()) {
      // Worktree: "gitdir: <repo>/.git/worktrees/<rama>"
      const content = readText(dotGit) ?? '';
      const match = content.match(/gitdir:\s*(.+)/i);
      if (match) {
        const gitDir = path.resolve(projectDir, match[1].trim());
        const commonDir = path.dirname(path.dirname(gitDir)); // <repo>/.git
        const repoDir = path.dirname(commonDir);              // <repo>
        if (repoDir) return path.basename(repoDir);
      }
    }
  } catch {
    // Sin .git: se usa el nombre de la carpeta.
  }

  return path.basename(projectDir);
}

/**
 * Detecta el stack y las herramientas del repo.
 * @param {string} projectDir - Directorio del proyecto
 * @returns {RepoAnalysis}
 */
function analyze(projectDir) {
  const has = (name) => fs.existsSync(path.join(projectDir, name));
  const readJson = (name) => {
    const content = readText(path.join(projectDir, name));
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  };

  const analysis = {
    stack: 'desconocido',
    packageManager: '-',
    install: null,
    verify: '',
    runner: '-',
    hasTests: false,
    testPath: null,
    entrypoints: [],
    envVars: [],
    sections: [],
    description: null
  };

  const pkg = readJson('package.json');
  const hasTestsDir = ['tests', 'test', '__tests__'].some((name) =>
    fs.existsSync(path.join(projectDir, name))
  );
  const testFiles = hasTestFiles(projectDir);
  const anyTests = hasTestsDir || testFiles;

  // Evidencia de Python: manifiesto, lockfile o código .py en el repo.
  const pythonEvidence =
    has('pyproject.toml') || has('requirements.txt') || has('uv.lock') ||
    walkFiles(projectDir, { maxFiles: 200, maxDepth: 3 })
      .some((file) => path.extname(file).toLowerCase() === '.py');

  // Node solo manda si tiene scripts reales de build/test/lint: hay repos con
  // un package.json de tooling (build de ejecutable) que en realidad son Python.
  const nodeScripts = pkg?.scripts ?? {};
  const nodeHasRealScripts = Object.keys(nodeScripts).some((name) =>
    ['test', 'build', 'lint', 'check', 'typecheck'].includes(name)
  );

  if (has('go.mod')) {
    analysis.stack = 'go';
    analysis.packageManager = '-';
    analysis.install = null;
    analysis.verify = 'go build ./... && go test ./...';
    analysis.runner = 'go test';
    analysis.hasTests = anyTests;
    analysis.testPath = hasTestsDir ? 'tests/' : null;
  } else if (has('Cargo.toml')) {
    analysis.stack = 'rust';
    analysis.packageManager = '-';
    analysis.install = null;
    analysis.verify = 'cargo build && cargo test';
    analysis.runner = 'cargo test';
    analysis.hasTests = anyTests;
    analysis.testPath = hasTestsDir ? 'tests/' : null;
  } else if (pkg && (nodeHasRealScripts || !pythonEvidence)) {
    analysis.stack = 'node';
    analysis.scripts = nodeScripts;

    if (has('bun.lock') || has('bun.lockb')) analysis.packageManager = 'bun';
    else if (has('pnpm-lock.yaml')) analysis.packageManager = 'pnpm';
    else if (has('yarn.lock')) analysis.packageManager = 'yarn';
    else analysis.packageManager = 'npm';

    const pm = analysis.packageManager;
    const lockfile = {
      npm: 'package-lock.json',
      pnpm: 'pnpm-lock.yaml',
      yarn: 'yarn.lock',
      bun: 'bun.lock'
    }[pm];
    const hasLock = has(lockfile) || (pm === 'bun' && has('bun.lockb'));
    analysis.install = hasLock ? `${pm} ci` : `${pm} install`;

    const testScript = nodeScripts.test ?? '';
    const isPlaceholder = /^\s*echo\b/i.test(testScript);

    if (testScript && !isPlaceholder) {
      analysis.verify = `${pm} test`;
      analysis.runner = /vitest/i.test(testScript) ? 'Vitest'
        : /jest/i.test(testScript) ? 'Jest'
        : /playwright/i.test(testScript) ? 'Playwright'
        : 'npm test';
    } else {
      const parts = [];
      for (const name of ['build', 'lint', 'check', 'typecheck']) {
        if (nodeScripts[name]) parts.push(`${pm} run ${name}`);
      }
      analysis.verify = parts.length > 0 ? parts.slice(0, 3).join(' && ') : `${pm} install`;
      analysis.runner = 'sin script de test';
    }

    analysis.hasTests = Boolean(testScript && !isPlaceholder) || anyTests;
    const devDeps = { ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) };
    analysis.runner = /vitest/.test(Object.keys(devDeps).join(' '))
      ? 'Vitest'
      : /jest/.test(Object.keys(devDeps).join(' '))
        ? 'Jest'
        : analysis.runner;
  } else if (pythonEvidence) {
    analysis.stack = 'python';
    analysis.packageManager = has('uv.lock') ? 'uv' : 'pip';

    if (has('uv.lock')) {
      analysis.install = 'uv sync';
    } else if (has('requirements.lock')) {
      analysis.install = 'pip install -r requirements.lock';
    } else if (has('requirements.txt')) {
      analysis.install = 'pip install -r requirements.txt';
    } else {
      analysis.install = null;
    }

    if (anyTests) {
      analysis.verify = has('uv.lock') ? 'uv run pytest' : 'pytest';
      analysis.runner = 'pytest';
      analysis.hasTests = true;
      analysis.testPath = hasTestsDir ? 'tests/' : null;
    } else {
      const srcDir = has('src') ? 'src' : '.';
      analysis.verify = `python -m compileall ${srcDir}`;
      analysis.runner = 'sin tests (compileall)';
      analysis.hasTests = false;
    }
  }

  analysis.entrypoints = ENTRYPOINT_CANDIDATES.filter((candidate) => has(candidate));
  analysis.sections = RELEVANT_SECTIONS.filter((section) => has(section));
  analysis.envVars = detectEnvVars(projectDir);
  analysis.description = extractDescription(readText(path.join(projectDir, 'README.md')));

  return analysis;
}

/**
 * Construye las secciones markdown generadas.
 * @param {RepoAnalysis} analysis - Análisis del repo
 * @returns {string[]} Líneas del bloque
 */
function renderSections(analysis) {
  const lines = [];
  const code = (content) => lines.push('```bash', content, '```', '');

  lines.push('## Verificación', '');
  lines.push('Un solo comando deja el repo listo y verifica que todo esté en verde:', '');
  code(analysis.install ? `${analysis.install}\n${analysis.verify}` : analysis.verify);
  lines.push(`- Stack: ${analysis.stack}${analysis.packageManager !== '-' ? ` (${analysis.packageManager})` : ''}`);
  lines.push(`- Tests: ${analysis.runner}${analysis.testPath ? ` en \`${analysis.testPath}\`` : ''}`);
  if (analysis.runner === 'sin script de test' || analysis.runner === 'sin tests (compileall)') {
    lines.push('- ⚠️ Sin verificación automática real: agregá un script `test` (Node) o tests con `pytest` para que el repo sea verificable.');
  }
  lines.push('');

  if (analysis.install) {
    lines.push('## Instalación', '');
    code(analysis.install);
    lines.push('');
  }

  if (analysis.entrypoints.length > 0 || analysis.sections.length > 0) {
    lines.push('## Estructura', '');
    for (const section of analysis.sections) lines.push(`- \`${section}/\``);
    for (const entry of analysis.entrypoints) {
      if (analysis.sections.includes(entry)) continue;
      lines.push(`- \`${entry}\``);
    }
    lines.push('');
  }

  if (analysis.envVars.length > 0) {
    lines.push('## Variables de entorno', '');
    lines.push('El código lee estas variables: documentá cada una con su default en `.env.example`.', '');
    for (const name of analysis.envVars) lines.push(`- \`${name}\``);
    lines.push('');
  }

  lines.push('## Convenciones', '');
  if (analysis.stack === 'node') {
    lines.push('- Los scripts de `package.json` son la interfaz del repo: agregar un comando nuevo es agregar un script.');
    lines.push('- Tests con Vitest/Jest junto al módulo (`*.test.js`).');
  } else if (analysis.stack === 'python') {
    lines.push('- Tests con `pytest` en `tests/`.');
    lines.push(analysis.packageManager === 'uv' ? '- Dependencias con `uv` (`uv.lock` versionado).' : '- Dependencias declaradas en `requirements.txt`.');
  } else if (analysis.stack === 'go') {
    lines.push('- `gofmt` antes de commitear; `go test ./...` antes de entregar.');
  } else if (analysis.stack === 'rust') {
    lines.push('- `cargo fmt` y `cargo clippy` antes de commitear; `cargo test` antes de entregar.');
  }
  lines.push('- Comentarios que expliquen el *por qué*, no el *qué*.');
  lines.push('');

  lines.push('## Reglas de este repo', '');
  lines.push('- **Autosuficiente**: `git clone` + el comando de verificación debe dejar la app levantada y los tests en verde, sin red y sin ayuda de una persona.');
  lines.push('- **Tests honestos**: nada de `it.skip`, `pytest.mark.skip`, `xfail` ni `assert true` para forzar verde.');
  lines.push('- **Entorno declarativo**: toda variable de entorno va en `.env.example` con un default seguro.');
  lines.push('- **Sin paths de tu máquina**: nada de rutas absolutas locales ni secretos en el código.');
  lines.push('- **Evidencia**: al entregar, reportá el comando que corriste y su salida. Si no pudiste verificar, decilo.');
  lines.push('');

  return lines;
}

/**
 * Construye el bloque markdown generado, con los markers.
 * @param {string} repoName - Nombre del repo
 * @param {RepoAnalysis} analysis - Análisis del repo
 * @param {boolean} [includeHeader=true] - Incluir título y descripción
 * @returns {string} Bloque markdown con los markers
 */
function renderBlock(repoName, analysis, includeHeader = true) {
  const header = [];

  if (includeHeader) {
    header.push(`# AGENTS.md — ${repoName}`, '');
    if (analysis.description) header.push(analysis.description, '');
    header.push(
      '> El bloque entre los markers `g360:agents` lo genera `g360 agents` y se',
      '> regenera sin perder lo que escribas afuera.',
      ''
    );
  }

  return `${BEGIN_MARKER}\n${[...header, ...renderSections(analysis)].join('\n')}${END_MARKER}`;
}

/**
 * Genera el contenido de un `.env.example` con las variables detectadas.
 * @param {RepoAnalysis} analysis - Análisis del repo
 * @returns {string|null} Contenido o null si no hay variables
 */
function renderEnvExample(analysis) {
  if (!analysis.envVars.length) return null;

  const lines = [
    '# Variables de entorno del proyecto.',
    '# Generado por `g360 agents`: completá cada valor con su default real.',
    '# La app debe arrancar con estos defaults o fallar con un error claro.',
    ''
  ];

  for (const name of analysis.envVars) lines.push(`${name}=`);

  return `${lines.join('\n')}\n`;
}

/**
 * Inserta o reemplaza el bloque generado dentro de un AGENTS.md existente.
 * @param {string} existing - Contenido actual
 * @param {string} block - Bloque generado
 * @returns {string} Contenido resultante
 */
function mergeBlock(existing, block) {
  const start = existing.indexOf(BEGIN_MARKER);
  const end = existing.indexOf(END_MARKER);

  if (start !== -1 && end !== -1 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + END_MARKER.length);
  }

  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${separator}${block}\n`;
}

export const agentsGenerator = {
  BEGIN_MARKER,
  END_MARKER,

  /**
   * Analiza un repo y devuelve el stack, comandos y variables detectadas.
   * @param {string} projectDir - Directorio del proyecto
   * @returns {RepoAnalysis}
   */
  analyze,

  /**
   * Genera el bloque markdown de un repo.
   * @param {string} repoName - Nombre del repo
   * @param {RepoAnalysis} analysis - Análisis
   * @param {boolean} [includeHeader=true] - Incluir título y descripción
   * @returns {string}
   */
  renderBlock(repoName, analysis, includeHeader = true) {
    return renderBlock(repoName, analysis, includeHeader);
  },

  /**
   * Crea o actualiza el AGENTS.md de un repo (y opcionalmente el
   * `.env.example` con las variables detectadas).
   * @param {string} projectDir - Directorio del proyecto
   * @param {Object} [options] - Opciones
   * @param {boolean} [options.force=false] - Sobrescribir el archivo entero
   * @param {boolean} [options.dryRun=false] - No escribir, solo simular
   * @param {boolean} [options.envExample=false] - Generar `.env.example` si falta
   * @returns {{status: 'created'|'updated'|'unchanged', path: string, verify: string, content: string, envExample?: string|null}}
   */
  apply(projectDir, options = {}) {
    const { force = false, dryRun = false, envExample = false } = options;
    const eol = detectEol(projectDir);
    const analysis = analyze(projectDir);
    const repoName = resolveRepoName(projectDir);
    const target = path.join(projectDir, 'AGENTS.md');
    const exists = fs.existsSync(target);
    const existing = exists ? readText(target) ?? '' : '';

    let block;

    if (!exists || force) {
      block = renderBlock(repoName, analysis, true);
    } else {
      const start = existing.indexOf(BEGIN_MARKER);
      const end = existing.indexOf(END_MARKER);

      if (start !== -1 && end !== -1 && end > start) {
        // Ya hay bloque generado: se reemplaza conservando su forma.
        const region = existing.slice(start, end);
        block = renderBlock(repoName, analysis, /^\s*#\s/m.test(region));
      } else {
        // Sin bloque previo: se agrega, con título solo si el archivo no tiene.
        block = renderBlock(repoName, analysis, !/^\s*#\s/m.test(existing));
      }
    }

    let content;

    if (!exists) {
      content = `${block}\n`;
    } else if (force) {
      content = `${block}\n`;
    } else {
      content = mergeBlock(existing, block);
    }

    content = content.replace(/\r?\n/g, eol);

    const status = !exists ? 'created' : content === existing ? 'unchanged' : 'updated';

    if (!dryRun && status !== 'unchanged') {
      fs.writeFileSync(target, content, 'utf8');
    }

    let envPath = null;
    if (envExample) {
      const envTarget = path.join(projectDir, '.env.example');
      const envContent = renderEnvExample(analysis);
      if (envContent && !fs.existsSync(envTarget)) {
        envPath = envTarget;
        if (!dryRun) {
          fs.writeFileSync(envTarget, envContent.replace(/\n/g, eol), 'utf8');
        }
      }
    }

    return { status, path: target, verify: analysis.verify, content, envExample: envPath };
  }
};

export default agentsGenerator;
