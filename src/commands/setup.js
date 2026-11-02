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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ruta robusta a assets: funciona tanto en dev como en global install
// En dev: __dirname = src/commands/, assets = src/assets/harness/
// En global: __dirname = node_modules/g360-cli/src/commands/, assets = node_modules/g360-cli/src/assets/harness/
const ASSETS_DIR = path.resolve(__dirname, '../assets/harness');

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
];

/**
 * Configuración default del sistema multiagente (shape OpenCode V2)
 */
const DEFAULT_OPENCODE_CONFIG = {
  $schema: 'https://opencode.ai/config.json',
  username: 'ccusi',
  instructions: ['C:/Users/ccusi/.agents/AGENTS.md'],
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
 * Forma V1 de permisos para Kilo
 */
const DEFAULT_KILO_CONFIG = {
  $schema: 'https://app.kilo.ai/config.json',
  instructions: ['C:/Users/ccusi/.agents/AGENTS.md'],
  agent: {
    'g360-orchestrator': {
      description:
        'Orquestador G360: clasifica nivel A/B/C, invoca subagentes, consolida reporte. No escribe código.',
      mode: 'primary',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      prompt:
        'Sos el orquestador del sistema multiagente G360. El método completo está en HANDOFF.md. Clasificá la tarea, delegá a g360-architect y revisá con g360-reviewer. Nivel C exige aprobación humana antes de implementar. Regla crítica: pasale el CRITERIO DE ACEPTACIÓN COMPLETO al reviewer.\n\nFormato de entrega:\n- Nivel: A/B/C\n- Subagentes invocados\n- Comando de verificación y salida\n- Estado: APROBADO/RECHAZADO/NECESITA-REVISION',
      maxSteps: 40,
      permission: {
        edit: 'deny',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'deny',
          'git status *': 'allow',
          'git diff *': 'allow',
          'git log *': 'allow',
          'git show *': 'allow',
          'g360 audit *': 'allow',
        },
        task: {
          '*': 'deny',
          'g360-architect': 'allow',
          'g360-reviewer': 'allow',
          'g360-security-auditor': 'allow',
          'g360-data-specialist': 'allow',
          'g360-qa-specialist': 'allow',
          explore: 'allow',
        },
      },
    },
    'g360-architect': {
      description:
        'Arquitecto implementador. Escribe código según especificación. No publica ni migra.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      prompt:
        'Sos el rol architect: el único agente que escribe código. Recibís una especificación del orquestador, implementás el cambio mínimo y corrés el comando de verificación. No commiteás, no pusheás, no publicás. Si la especificación es ambigua, devolvé la pregunta concreta.\n\nFormato de entrega:\n- CAMBIOS: lista de archivos modificados\n- VERIFICACIÓN: comando ejecutado\n- SALIDA: resultado\n- PENDIENTE: lo que quedó fuera de alcance',
      maxSteps: 40,
      permission: {
        edit: 'allow',
        webfetch: 'deny',
        websearch: 'deny',
        bash: {
          '*': 'allow',
          'git push*': 'deny',
          'git push --force*': 'deny',
          'npm publish*': 'deny',
          'rm -rf*': 'deny',
          'Remove-Item*': 'deny',
        },
      },
    },
    'g360-reviewer': {
      description:
        'Revisor crítico independiente (Goldfish). Solo lectura, nunca modifica archivos.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      prompt:
        'Sos un revisor independiente. No participaste de la decisión que revisás. Tu trabajo es encontrar defectos reales, no validar al autor.\n\nEsquema de salida obligatorio:\nVEREDICTO: APROBADO | CONDICIONAL | RECHAZADO\nCRÍTICOS: <n> | ninguno\n  - [archivo:línea] <hallazgo> — <evidencia>\nADVERTENCIAS: <n> | ninguna\nNO VERIFICADO: <qué no se pudo comprobar y por qué',
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
        'Auditor de seguridad y compatibilidad cross-stack. Solo lectura.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      prompt:
        'Sos un auditor de seguridad. Buscás credenciales expuestas, dependencias vulnerables y rupturas de contrato entre repos G360.\n\nEsquema de salida: VEREDICTO + CRÍTICOS + ADVERTENCIAS + NO VERIFICADO',
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
        'Especialista en datos y migraciones. Audita esquemas y contratos.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      prompt:
        'Sos especialista en datos. Auditás cambios de esquema, procesadores ERP y contratos Excel/CSV/JSON. Proponés migraciones incrementales con rollback.',
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
          'sqlite3 *': 'ask',
          'uv run *': 'allow',
          'python *': 'allow',
        },
      },
    },
    'g360-qa-specialist': {
      description:
        'QA y regresión. Corre la suite de tests y reporta evidencia.',
      mode: 'subagent',
      model: 'nvidia/deepseek-ai/deepseek-v4.1-flash',
      prompt:
        'Sos QA. Corrés el comando de verificación declarado en AGENTS.md y reportás la salida exacta. Si no hay suite, lo decís explícitamente.',
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
          'git diff *': 'allow',
          'git status *': 'allow',
        },
      },
    },
  },
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

  const results = [];

  for (const p of platforms) {
    const result = await installPlatform(p, { dryRun, reset });
    results.push(result);
  }

  // Install shared docs (always)
  console.log(chalk.bold('\n📚 Docs canónicas'));
  await installSharedDocs({ dryRun });

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

  console.log(chalk.gray('\n  Docs: .agents/HANDOFF.md, MULTIAGENTE.md\n'));

  // Verification hint
  console.log(chalk.cyan('✅ Configuración lista.\n'));
  console.log(chalk.gray('  Para verificar:'));
  console.log(chalk.gray('    opencode api get /api/agent    # OpenCode'));
  console.log(chalk.gray('    kilo agent list                  # Kilo'));
  console.log(chalk.gray('    Test con: g360 audit .\n'));
}
