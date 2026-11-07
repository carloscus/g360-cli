/**
 * Comando: g360 setup
 *
 * Instala la configuración global del sistema multiagente G360:
 * - OpenCode: ~/.config/opencode/ (agentes, skills, permisos)
 * - Kilo: ~/.config/kilo/kilo.jsonc (compatibilidad V1)
 * - Cline: ~/.agents/goldfish.ps1 (emulado)
 * - Docs canónicas: ~/.agents/HANDOFF.md, MULTIAGENTE.md
 *
 * Opciones:
 *   --platform opencode|kilo|cline|all  (default: all)
 *   --reset                              Sobrescribe config existente
 *   --dry-run                            Preview sin escribir
 *   --model <id>                         Modelo default (free/paid)
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createManifest } from '../lib/setup-manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ruta robusta a assets: funciona tanto en dev como en global install
// En dev: __dirname = src/commands/, assets = src/assets/harness/
// En global: __dirname = node_modules/g360-cli/src/commands/, assets = node_modules/g360-cli/src/assets/harness/
const ASSETS_DIR = path.resolve(__dirname, '../assets/harness');

// Home del usuario en formato POSIX (las configs de OpenCode/Kilo esperan `/`)
const HOME_POSIX = (process.env.HOME || process.env.USERPROFILE).replace(/\\/g, '/');

/**
 * Rutas de instalación por plataforma
 */
const INSTALL_PATHS = {
  opencode: {
    base: path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'opencode'),
    files: [
      { src: 'opencode/opencode.json.template', dst: 'opencode.json' },
      { src: 'opencode/agents/*.md', dst: 'agents/' },
      { src: 'opencode/skills/orchestrate/SKILL.md', dst: 'skills/orchestrate/SKILL.md' },
    ],
  },
  kilo: {
    base: path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'kilo'),
    files: [
      { src: 'opencode/opencode.json.template', dst: 'kilo.jsonc' }, // shape V1 adaptado
    ],
  },
  cline: {
    base: path.join(process.env.HOME || process.env.USERPROFILE, '.agents'),
    files: [
      { src: 'shared/goldfish.ps1', dst: 'goldfish.ps1' },
    ],
  },
};

/**
 * Docs canónicas siempre instaladas
 */
const SHARED_FILES = [
  { src: 'shared/HANDOFF.md', dst: 'HANDOFF.md' },
  { src: 'shared/MULTIAGENTE.md', dst: 'MULTIAGENTE.md' },
  { src: 'shared/AGENTS.md', dst: 'AGENTS.md' },
  { src: 'shared/MIGRACIONES.md', dst: 'MIGRACIONES.md' },
  { src: 'shared/GLOSARIO.md', dst: 'GLOSARIO.md' },
];

/**
 * Configuración default para Kilo (shape V1).
 * Sincronizada con el canon instalado (~/.config/kilo/kilo.jsonc):
 * modelos con prefijo `kilo/`, prompts que referencian el esquema de
 * HANDOFF.md, y permisos sin comandos destructivos.
 */
const DEFAULT_KILO_CONFIG = {
  $schema: 'https://app.kilo.ai/config.json',
  instructions: [
    `${HOME_POSIX}/.agents/AGENTS.md`,
    `${HOME_POSIX}/.agents/HANDOFF.md`,
    `${HOME_POSIX}/.agents/MIGRACIONES.md`,
    `${HOME_POSIX}/.agents/GLOSARIO.md`,
  ],
  agent: {
    'g360-orchestrator': {
      description:
        'Orquestador G360: clasifica nivel A/B/C, delega a subagentes, consolida el reporte. No escribe código.',
      mode: 'primary',
      model: 'kilo/kilo-auto/free',
      prompt:
        'Sos el orquestador del sistema multiagente G360. El método completo está en HANDOFF.md (ya cargado como instrucción) y el protocolo de migraciones en MIGRACIONES.md: niveles A/B/C, contrato de handoff y esquema de salida. Clasificá la tarea, delegá la implementación a `g360-architect` y la revisión a `g360-reviewer`; nivel C exige aprobación humana antes de implementar y aprobación final después del QA. No escribís código: todo cambio pasa por `g360-architect`. Nunca commit, push, publish ni migración destructiva sin pedido explícito. Entregá siempre el reporte con nivel, subagentes invocados, comando de verificación con su salida y estado final.\n\nRegla de handoff: cuando invoques a `g360-reviewer`, pasale el CRITERIO DE ACEPTACIÓN COMPLETO y la FÓRMULA/CONTRATO de verdad (no resúmenes — el reviewer no conoce el dominio). El reviewer es independiente: si no tiene el criterio concreto, puede fallar.',
      maxSteps: 40,
      permission: {
        edit: 'deny',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'deny',
          'git status': 'allow',
          'git status *': 'allow',
          'git diff': 'allow',
          'git diff *': 'allow',
          'git log': 'allow',
          'git log *': 'allow',
          'git show': 'allow',
          'git show *': 'allow',
          'g360 audit *': 'allow',
        },
        task: {
          '*': 'deny',
          'g360-architect': 'allow',
          explore: 'allow',
          'g360-reviewer': 'allow',
          'g360-security-auditor': 'allow',
          'g360-data-specialist': 'allow',
          'g360-qa-specialist': 'allow',
        },
      },
    },
    'g360-architect': {
      description:
        'Arquitecto implementador. Único agente que escribe código. No publica, no despliega, no migra datos.',
      mode: 'subagent',
      model: 'kilo/nvidia/nemotron-3.5-lightning:free',
      prompt:
        'Sos el rol architect: el único agente del sistema que escribe código. Recibís una especificación, implementás el cambio mínimo y corrés el comando de verificación del repo reportando la salida exacta. No commiteás, no pusheás, no publicás, no desplegás, no migrás ni borrás datos, no instalás dependencias sin autorización. Si la especificación es ambigua, devolvés la pregunta concreta en vez de adivinar. Entregá CAMBIOS / VERIFICACIÓN / SALIDA / PENDIENTE.',
      maxSteps: 40,
      permission: {
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'allow',
          'git push*': 'deny',
          'git push --force*': 'deny',
          'git reset --hard*': 'deny',
          'npm publish*': 'deny',
          'docker *': 'deny',
          'rm -rf *': 'deny',
          'Remove-Item *': 'deny',
        },
      },
    },
    'g360-reviewer': {
      description:
        'Revisor crítico independiente (Goldfish). Ve solo la spec y el diff, nunca el historial. Solo lectura.',
      mode: 'subagent',
      model: 'kilo/kilo-auto/free',
      prompt:
        'Sos un revisor independiente. No participaste de la decisión que revisás y no tenés el historial de la conversación: eso es intencional. Tu trabajo es encontrar defectos reales, no validar al autor. Respondé con el esquema fijo de HANDOFF.md: VEREDICTO, CRÍTICOS (con archivo:línea y evidencia), ADVERTENCIAS y NO VERIFICADO. Un hallazgo sin evidencia ejecutable es advertencia, no crítico. No modificás archivos.',
      maxSteps: 15,
      permission: {
        edit: 'deny',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'deny',
          'git diff': 'allow',
          'git diff *': 'allow',
          'git log': 'allow',
          'git log *': 'allow',
          'git show': 'allow',
          'git show *': 'allow',
          'git status': 'allow',
          'git status *': 'allow',
        },
      },
    },
    'g360-security-auditor': {
      description:
        'Auditor de seguridad y compatibilidad cross-stack (credenciales, CVEs, romper contratos entre repos G360). Solo lectura.',
      mode: 'subagent',
      model: 'kilo/kilo-auto/free',
      prompt:
        'Sos un auditor de seguridad y compatibilidad. Buscás credenciales expuestas, dependencias vulnerables o no fijadas, y rupturas de contrato entre repos del ecosistema G360. Respondé con el esquema fijo de HANDOFF.md. Sin evidencia ejecutable no hay crítico. No modificás archivos ni instalás dependencias.',
      maxSteps: 12,
      permission: {
        edit: 'deny',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'deny',
          'git diff': 'allow',
          'git diff *': 'allow',
          'git log': 'allow',
          'git log *': 'allow',
          'git show': 'allow',
          'git show *': 'allow',
          'git status': 'allow',
          'git status *': 'allow',
          'npm audit *': 'allow',
          'npm ls *': 'allow',
        },
      },
    },
    'g360-data-specialist': {
      description:
        'Especialista en datos y migraciones: esquemas, procesadores ERP, contratos Excel/CSV/JSON, migración incremental.',
      mode: 'subagent',
      model: 'kilo/kilo-auto/free',
      prompt:
        'Sos especialista en datos y migraciones. Auditás cambios de esquema, procesadores de datos ERP y contratos de intercambio (Excel/CSV/JSON). Proponés migraciones incrementales con respaldo y rollback; nunca ejecutás una migración destructiva. Respondé con el esquema fijo de HANDOFF.md. No modificás archivos ni datos.',
      maxSteps: 15,
      permission: {
        edit: 'deny',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'deny',
          'git diff': 'allow',
          'git diff *': 'allow',
          'git log': 'allow',
          'git log *': 'allow',
          'git show': 'allow',
          'git show *': 'allow',
          'git status': 'allow',
          'git status *': 'allow',
        },
      },
    },
    'g360-qa-specialist': {
      description:
        'QA y regresión: corre la suite del repo, valida equivalencia y visual (si aplica). No modifica código ni tests.',
      mode: 'subagent',
      model: 'kilo/kilo-auto/free',
      prompt:
        'Sos QA. Corrés el comando de verificación declarado en el AGENTS.md del repo y reportás la salida exacta. Si hay interfaz visual, capturás screenshots antes/después y validás dimensiones, alineación y consistencia UI (como advertencias, no como cambios automáticos). Si no hay suite de tests, lo decís explícitamente en vez de inventar evidencia. Proponés tests faltantes, pero no los escribís. Respondé con el esquema fijo de HANDOFF.md.',
      maxSteps: 10,
      permission: {
        edit: 'deny',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'deny',
          'npm test *': 'allow',
          'npm run *': 'allow',
          'npx vitest *': 'allow',
          'pytest *': 'allow',
          'uv run pytest *': 'allow',
          'go test *': 'allow',
          'cargo test *': 'allow',
          'g360 audit *': 'allow',
          'git diff': 'allow',
          'git diff *': 'allow',
          'git status': 'allow',
          'git status *': 'allow',
        },
      },
    },
  },
};

/**
 * Configuración default del sistema multiagente (shape OpenCode V2)
 */
const DEFAULT_OPENCODE_CONFIG = {
  $schema: 'https://opencode.ai/config.json',
  username: 'ccusi',
  instructions: [`${HOME_POSIX}/.agents/AGENTS.md`],
  model: 'nvidia/z-ai/glm-5.3-flash',
  small_model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
  shell: 'pwsh',
  logLevel: 'WARN',
  share: 'disabled',
  autoupdate: true,
  snapshot: false,
  subagent_depth: 1,
  agents: {
    orchestrator: {
      description:
        'Orquestador principal: clasifica complejidad, invoca subagentes, consolida entregables. No escribe código.',
      mode: 'primary',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      steps: 40,
      permissions: [
        { action: 'subagent', resource: '*', effect: 'deny' },
        { action: 'subagent', resource: 'architect', effect: 'allow' },
        { action: 'subagent', resource: 'explore', effect: 'allow' },
        { action: 'subagent', resource: 'reviewer', effect: 'allow' },
        { action: 'subagent', resource: 'security-auditor', effect: 'allow' },
        { action: 'subagent', resource: 'data-specialist', effect: 'allow' },
        { action: 'subagent', resource: 'qa-specialist', effect: 'allow' },
        { action: 'shell', resource: 'npm publish *', effect: 'deny' },
        { action: 'shell', resource: 'git push *', effect: 'deny' },
        { action: 'shell', resource: 'docker *', effect: 'deny' },
        { action: 'shell', resource: 'rm -rf *', effect: 'deny' },
      ],
    },
    architect: {
      description:
        'Arquitecto implementador. Recibe especificación y escribe código, tests y configuración. No publica ni migra.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      steps: 40,
      permissions: [
        { action: 'edit', resource: '*', effect: 'allow' },
        { action: 'write', resource: '*', effect: 'allow' },
        { action: 'shell', resource: '*', effect: 'allow' },
        { action: 'shell', resource: 'git push*', effect: 'deny' },
        { action: 'shell', resource: 'npm publish*', effect: 'deny' },
        { action: 'shell', resource: 'rm -rf*', effect: 'deny' },
      ],
    },
    reviewer: {
      description:
        'Revisor crítico independiente (Goldfish). Revisa diffs desde perspectiva totalmente independiente. Solo lectura.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      steps: 15,
      permissions: [
        { action: 'edit', resource: '*', effect: 'deny' },
        { action: 'write', resource: '*', effect: 'deny' },
        { action: 'patch', resource: '*', effect: 'deny' },
        { action: 'shell', resource: '*', effect: 'deny' },
        { action: 'shell', resource: 'git diff*', effect: 'allow' },
        { action: 'shell', resource: 'git log*', effect: 'allow' },
        { action: 'shell', resource: 'git show*', effect: 'allow' },
        { action: 'shell', resource: 'git status*', effect: 'allow' },
        { action: 'read', resource: '*', effect: 'allow' },
        { action: 'glob', resource: '*', effect: 'allow' },
        { action: 'grep', resource: '*', effect: 'allow' },
      ],
    },
    security_auditor: {
      description:
        'Auditor de seguridad y compatibilidad cross-stack. Revisa cambios en busca de vulnerabilidades y ruptura de contratos.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      steps: 12,
      permissions: [
        { action: 'edit', resource: '*', effect: 'deny' },
        { action: 'write', resource: '*', effect: 'deny' },
        { action: 'patch', resource: '*', effect: 'deny' },
        { action: 'shell', resource: '*', effect: 'deny' },
        { action: 'shell', resource: 'git diff*', effect: 'allow' },
        { action: 'shell', resource: 'git log*', effect: 'allow' },
        { action: 'shell', resource: 'git show*', effect: 'allow' },
        { action: 'shell', resource: 'git status*', effect: 'allow' },
        { action: 'shell', resource: 'npm audit*', effect: 'allow' },
        { action: 'shell', resource: 'npm ls*', effect: 'allow' },
        { action: 'read', resource: '*', effect: 'allow' },
        { action: 'glob', resource: '*', effect: 'allow' },
        { action: 'grep', resource: '*', effect: 'allow' },
      ],
    },
    data_specialist: {
      description:
        'Especialista en datos y migraciones. Audita esquemas, procesadores ERP y contratos de intercambio.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      steps: 15,
      permissions: [
        { action: 'edit', resource: '*', effect: 'deny' },
        { action: 'write', resource: '*', effect: 'deny' },
        { action: 'patch', resource: '*', effect: 'deny' },
        { action: 'shell', resource: 'git*', effect: 'allow' },
        { action: 'shell', resource: 'sqlite3*', effect: 'ask' },
        { action: 'shell', resource: 'uv run*', effect: 'allow' },
        { action: 'shell', resource: 'python*', effect: 'allow' },
        { action: 'read', resource: '*', effect: 'allow' },
        { action: 'glob', resource: '*', effect: 'allow' },
        { action: 'grep', resource: '*', effect: 'allow' },
      ],
    },
    qa_specialist: {
      description:
        'QA y pruebas de regresión. Ejecuta suites de tests, detecta regresiones, propone tests adicionales.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      steps: 10,
      permissions: [
        { action: 'edit', resource: '*', effect: 'deny' },
        { action: 'write', resource: '*', effect: 'deny' },
        { action: 'patch', resource: '*', effect: 'deny' },
        { action: 'shell', resource: 'npm test*', effect: 'allow' },
        { action: 'shell', resource: 'npm run test*', effect: 'allow' },
        { action: 'shell', resource: 'npx vitest*', effect: 'allow' },
        { action: 'shell', resource: 'uv run pytest*', effect: 'allow' },
        { action: 'shell', resource: 'pytest*', effect: 'allow' },
        { action: 'shell', resource: 'go test*', effect: 'allow' },
        { action: 'shell', resource: 'cargo test*', effect: 'allow' },
        { action: 'shell', resource: 'g360 audit*', effect: 'allow' },
        { action: 'shell', resource: 'git diff*', effect: 'allow' },
        { action: 'shell', resource: 'git status*', effect: 'allow' },
        { action: 'read', resource: '*', effect: 'allow' },
        { action: 'glob', resource: '*', effect: 'allow' },
        { action: 'grep', resource: '*', effect: 'allow' },
      ],
    },
  },
  compaction: {
    auto: true,
    keep: { tokens: 8000 },
    buffer: '20%',
  },
  tool_output: {
    max_lines: 400,
    max_bytes: 16384,
  },
  disabled_providers: [
    'anthropic',
    'azure',
    'bedrock',
    'cohere',
    'deepseek',
    'fireworks',
    'google',
    'groq',
    'openai',
    'together',
  ],
};

/**
 * Verifica si la plataforma está configurada
 */
function isPlatformInstalled(platform) {
  const paths = {
    opencode: path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'opencode', 'opencode.json'),
    kilo: path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'kilo', 'kilo.jsonc'),
    cline: path.join(process.env.HOME || process.env.USERPROFILE, '.agents', 'goldfish.ps1'),
  };
  return fs.existsSync(paths[platform]);
}

/**
 * Copia archivos desde assets hasta destino
 */
async function copyAssets(srcPattern, destPath, dryRun = false) {
  const srcDir = path.join(ASSETS_DIR, path.dirname(srcPattern));
  const fileName = path.basename(srcPattern);
  const glob = path.join(srcDir, fileName);

  try {
    const files = await fs.readdir(srcDir);
    const matches = files.filter((f) => f === fileName || fileName.includes('*'));

    for (const file of matches) {
      const src = path.join(srcDir, file);
      const relPath = path.relative(srcDir, src);
      const dest = path.join(destPath, relPath);

      if (dryRun) {
        console.log(chalk.gray(`  [dry-run] would copy: ${relPath}`));
        continue;
      }

      await fs.ensureDir(path.dirname(dest));
      await fs.copy(src, dest, { overwrite: true });
      console.log(chalk.green(`  ✓ ${relPath}`));
    }
  } catch (err) {
    console.error(chalk.red(`  ✗ Failed to copy ${srcPattern}: ${err.message}`));
  }
}

/**
 * Backup previo a la instalación.
 *
 * Copia los directorios que se van a sobrescribir a <base>/.backup/<fecha>/.
 * Si ya existe un backup del mismo día se reutiliza (sin duplicados).
 * @param {string} baseDir - Home del usuario
 * @param {string[]} targets - Directorios relativos a respaldar (ej: '.config/opencode')
 * @param {boolean} [dryRun=false] - Solo informar, no escribir
 * @returns {Promise<{dir: string|null, reused: boolean}>}
 */
async function backupExisting(baseDir, targets, dryRun = false) {
  const existing = targets.filter((target) => fs.existsSync(path.join(baseDir, target)));
  if (existing.length === 0) return { dir: null, reused: false };

  const backupRoot = path.join(baseDir, '.backup');
  const now = new Date();
  const pad2 = (n) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;

  // Reutiliza el backup del mismo día si existe para no acumular copias
  let dir = null;
  if (fs.existsSync(backupRoot)) {
    const todays = fs.readdirSync(backupRoot).filter((name) => name.startsWith(`${day}-`)).sort();
    if (todays.length > 0) dir = path.join(backupRoot, todays[0]);
  }
  const reused = dir !== null;
  if (dir === null) dir = path.join(backupRoot, `${day}-${time}`);

  if (dryRun) {
    const action = reused ? 'reuse backup in' : 'create backup in';
    console.log(chalk.gray(`  [dry-run] would ${action} ${dir.replace(baseDir, '~')}`));
    return { dir, reused };
  }

  await fs.ensureDir(dir);
  for (const target of existing) {
    try {
      await fs.copy(path.join(baseDir, target), path.join(dir, target), {
        overwrite: true,
        // El backup preserva prompts y config, no dependencias: excluir
        // node_modules evita symlinks rotos (p. ej. msgpackr-extract) que
        // rompen la copia y abortaban setup entero sin generar el manifest.
        filter: (src) => !src.split(path.sep).includes('node_modules'),
      });
    } catch (err) {
      // Backup parcial > setup caído: sigue, pero deja rastro visible
      console.log(chalk.yellow(`  ⚠ backup parcial de ${target}: ${err.message}`));
    }
  }
  return { dir, reused };
}

/**
 * Instala config para una plataforma específica
 */
async function installPlatform(platform, options) {
  const { dryRun = false, reset = false } = options;
  const installed = isPlatformInstalled(platform);

  if (installed && !reset) {
    console.log(
      chalk.yellow(`  ⚠ ${platform}: ya instalado. Usá --reset para sobrescribir.`)
    );
    return { platform, status: 'skipped', message: 'ya instalado' };
  }

  console.log(chalk.bold(`\n🔧 ${platform.toUpperCase()}`));

  if (platform === 'opencode') {
    const destDir = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.config',
      'opencode'
    );

    if (dryRun) {
      console.log(chalk.gray('  [dry-run] would create:'));
      console.log(chalk.gray('    opencode/opencode.json'));
      console.log(chalk.gray('    opencode/agents/{orchestrator,architect,reviewer,security-auditor,data-specialist,qa-specialist}.md'));
      console.log(chalk.gray('    opencode/skills/orchestrate/SKILL.md'));
      return { platform, status: 'dry-run' };
    }

    await fs.ensureDir(destDir);
    await fs.ensureDir(path.join(destDir, 'agents'));
    await fs.ensureDir(path.join(destDir, 'skills', 'orchestrate'));

    // Write main config
    const configPath = path.join(destDir, 'opencode.json');
    await fs.writeJson(configPath, DEFAULT_OPENCODE_CONFIG, { spaces: 2 });
    console.log(chalk.green('  ✓ opencode/opencode.json'));

    // Copy agent files
    const agentsSrc = path.join(ASSETS_DIR, 'opencode', 'agents');
    const agentsDst = path.join(destDir, 'agents');
    const agentFiles = await fs.readdir(agentsSrc);
    for (const file of agentFiles) {
      if (file.endsWith('.md')) {
        await fs.copy(path.join(agentsSrc, file), path.join(agentsDst, file));
        console.log(chalk.green(`  ✓ agents/${file}`));
      }
    }

    // Copy skill
    const skillSrc = path.join(ASSETS_DIR, 'opencode', 'skills', 'orchestrate', 'SKILL.md');
    const skillDst = path.join(destDir, 'skills', 'orchestrate', 'SKILL.md');
    await fs.copy(skillSrc, skillDst);
    console.log(chalk.green('  ✓ skills/orchestrate/SKILL.md'));

    return { platform, status: 'installed' };
  }

  if (platform === 'kilo') {
    const destDir = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.config',
      'kilo'
    );

    if (dryRun) {
      console.log(chalk.gray('  [dry-run] would create:'));
      console.log(chalk.gray('    kilo/kilo.jsonc'));
      return { platform, status: 'dry-run' };
    }

    await fs.ensureDir(destDir);
    const configPath = path.join(destDir, 'kilo.jsonc');
    await fs.writeFile(configPath, JSON.stringify(DEFAULT_KILO_CONFIG, null, 2));
    console.log(chalk.green('  ✓ kilo/kilo.jsonc'));

    return { platform, status: 'installed' };
  }

  if (platform === 'cline') {
    const destDir = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.agents'
    );

    if (dryRun) {
      console.log(chalk.gray('  [dry-run] would create:'));
      console.log(chalk.gray('    .agents/goldfish.ps1'));
      return { platform, status: 'dry-run' };
    }

    await fs.ensureDir(destDir);
    const goldfishSrc = path.join(ASSETS_DIR, 'shared', 'goldfish.ps1');
    const goldfishDst = path.join(destDir, 'goldfish.ps1');
    await fs.copy(goldfishSrc, goldfishDst);
    console.log(chalk.green('  ✓ .agents/goldfish.ps1'));

    return { platform, status: 'installed' };
  }

  return { platform, status: 'unknown' };
}

/**
 * Instala docs canónicas
 */
async function installSharedDocs(options) {
  const { dryRun = false } = options;
  const destDir = path.join(process.env.HOME || process.env.USERPROFILE, '.agents');

  if (dryRun) {
    console.log(chalk.gray('  [dry-run] would create:'));
    console.log(chalk.gray('    .agents/HANDOFF.md'));
    console.log(chalk.gray('    .agents/MULTIAGENTE.md'));
    console.log(chalk.gray('    .agents/AGENTS.md (copy from canónico)'));
    return;
  }

  await fs.ensureDir(destDir);

  const docs = [
    { src: 'HANDOFF.md', dst: 'HANDOFF.md' },
    { src: 'MULTIAGENTE.md', dst: 'MULTIAGENTE.md' },
  ];

  for (const doc of docs) {
    const src = path.join(ASSETS_DIR, 'shared', doc.src);
    const dst = path.join(destDir, doc.dst);
    await fs.copy(src, dst);
    console.log(chalk.green(`  ✓ .agents/${doc.dst}`));
  }
}

/**
 * Main: g360 setup
 */
export async function setup(options) {
  const {
    platform = 'all',
    reset = false,
    dryRun = false,
    model = null,
  } = options;

  console.log(chalk.bold.cyan('\n🔧 G360 Multi-Agent Setup\n'));
  console.log(chalk.gray(`  Plataforma: ${platform}`));
  console.log(chalk.gray(`  Reset: ${reset ? 'sí' : 'no'}`));
  console.log(chalk.gray(`  Dry-run: ${dryRun ? 'sí' : 'no'}\n`));

  const platforms =
    platform === 'all'
      ? ['opencode', 'kilo', 'cline']
      : [platform];

  if (reset) {
    console.log(chalk.yellow('  [!] --reset eliminará la configuración existente antes de reinstalar\n'));
  }

  // Backup antes de escribir nada: respalda los directorios que esta
  // corrida puede sobrescribir (docs compartidas van siempre a .agents)
  const baseDir = process.env.HOME || process.env.USERPROFILE;
  const targetMap = {
    opencode: path.join('.config', 'opencode'),
    kilo: path.join('.config', 'kilo'),
    cline: '.agents',
  };
  const targets = [...new Set(platforms.map((p) => targetMap[p]).concat('.agents'))];
  const backup = await backupExisting(baseDir, targets, dryRun);
  if (backup.dir && !dryRun) {
    const verb = backup.reused ? 'backup reutilizado en' : 'backup creado en';
    console.log(chalk.green(`✓ ${verb} ${backup.dir.replace(baseDir, '~')}\n`));
  }

  const results = [];

  for (const p of platforms) {
    const result = await installPlatform(p, { dryRun, reset });
    results.push(result);
  }

  // Install shared docs (always)
  console.log(chalk.bold('\n📚 Docs canónicas'));
  await installSharedDocs({ dryRun });

  // Manifest de integridad para `g360 audit --agents`
  if (dryRun) {
    console.log(chalk.gray('\n  [dry-run] would create manifest in ~/.agents/.manifest.json'));
  } else {
    const { path: manifestPath, manifest } = await createManifest(baseDir);
    console.log(chalk.green(`\n✓ manifest creado en ${manifestPath.replace(baseDir, '~')} (${manifest.files.length} archivos)`));
  }

  // Summary
  console.log(chalk.bold('\n📊 Resumen\n'));
  for (const r of results) {
    const icon =
      r.status === 'installed'
        ? chalk.green('✓')
        : r.status === 'skipped'
        ? chalk.yellow('!')
        : r.status === 'dry-run'
        ? chalk.blue('-')
        : chalk.red('✗');
    console.log(`  ${icon} ${r.platform}: ${r.status}`);
  }

  console.log(chalk.gray('\n  Docs: .agents/HANDOFF.md, MULTIAGENTE.md, MIGRACIONES.md, GLOSARIO.md\n'));

  // Verification hint
  console.log(chalk.cyan('✅ Configuración lista.\n'));
  console.log(chalk.gray('  Para verificar:'));
  console.log(chalk.gray('    opencode api get /api/agent    # OpenCode'));
  console.log(chalk.gray('    kilo agent list                  # Kilo'));
  console.log(chalk.gray('    Test con: g360 audit .\n'));
}
