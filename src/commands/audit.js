import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { auditor } from '../lib/auditor.js';
import { autonomyAuditor } from '../lib/autonomy-auditor.js';

const REPO_MARKERS = [
  '.git', 'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'requirements.txt'
];

const COLUMNS = [
  { id: 'instructions', label: 'AGENTS' },
  { id: 'verification', label: 'VERIF' },
  { id: 'readme', label: 'README' },
  { id: 'lockfile', label: 'LOCK' },
  { id: 'env-example', label: 'ENV' },
  { id: 'skipped-tests', label: 'TESTS' }
];

/**
 * Rellena con espacios hasta el ancho pedido.
 * @param {string} text - Texto a alinear
 * @param {number} width - Ancho objetivo
 * @returns {string}
 */
function pad(text, width) {
  const value = String(text);
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

/**
 * Indica si un directorio parece ser un repositorio de proyecto.
 * @param {string} dir - Directorio
 * @returns {boolean}
 */
function isRepo(dir) {
  return REPO_MARKERS.some((marker) => fs.existsSync(path.join(dir, marker)));
}

/**
 * Audita todos los repos de un workspace y muestra un resumen por repo.
 * @param {string} rootDir - Raíz del workspace (o de la carpeta projects)
 * @param {Object} options - Opciones
 * @param {boolean} [options.verbose=false] - Mostrar el detalle de cada finding
 * @returns {Promise<void>}
 */
export async function auditEcosystem(rootDir, options = {}) {
  const { verbose = false } = options;
  const projectsDir = fs.existsSync(path.join(rootDir, 'projects'))
    ? path.join(rootDir, 'projects')
    : rootDir;

  const repos = fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(projectsDir, entry.name))
    .filter((dir) => isRepo(dir))
    .sort();

  console.log(chalk.bold.cyan('\n🔍 Auditoría de autosuficiencia — ecosistema\n'));
  console.log(chalk.gray(`Proyectos: ${repos.length}  ·  ${projectsDir}\n`));

  const nameWidth = Math.max(10, ...repos.map((repo) => path.basename(repo).length));

  console.log(
    chalk.bold(pad('Proyecto', nameWidth)) + '  ' +
    COLUMNS.map((column) => chalk.bold(pad(column.label, 6))).join('  ') +
    '  ' + chalk.bold('Estado')
  );
  console.log(chalk.gray('-'.repeat(nameWidth + 2 + COLUMNS.length * 8 + 8)));

  const tally = { pass: 0, warn: 0, fail: 0 };

  for (const repo of repos) {
    const { status, findings } = autonomyAuditor.check(repo);
    const byId = Object.fromEntries(findings.map((finding) => [finding.id, finding]));

    const cells = COLUMNS.map((column) => {
      const findingStatus = byId[column.id]?.status;
      if (findingStatus === 'pass') return chalk.green(pad('✓', 6));
      if (findingStatus === 'warn') return chalk.yellow(pad('!', 6));
      if (findingStatus === 'n/a') return chalk.gray(pad('–', 6));
      return chalk.red(pad('✗', 6));
    });

    const label = status === 'pass'
      ? chalk.green('ok')
      : status === 'warn'
        ? chalk.yellow('warn')
        : chalk.red('fail');

    tally[status] += 1;

    console.log(pad(path.basename(repo), nameWidth) + '  ' + cells.join('  ') + '  ' + label);

    if (verbose) {
      for (const finding of findings.filter((item) => item.status !== 'pass')) {
        const icon = finding.status === 'fail' ? chalk.red('✗') : chalk.yellow('!');
        console.log('    ' + icon + ' ' + chalk.gray(`${finding.label}: ${finding.message}`));
      }
    }
  }

  console.log('');
  console.log(
    chalk.green(`  ok: ${tally.pass}`) + '   ' +
    chalk.yellow(`  warn: ${tally.warn}`) + '   ' +
    chalk.red(`  fail: ${tally.fail}`) +
    chalk.gray(`   de ${repos.length} repos`)
  );
  console.log('');
}

/**
 * Audita un proyecto: checks de G360 + checks de autosuficiencia.
 * @param {string} projectPath - Ruta del proyecto (relativa o absoluta)
 * @param {Object} options - Opciones
 * @param {boolean} [options.fix=false] - Auto-corregir cuando sea posible
 * @param {boolean} [options.verbose=false] - Mostrar detalle
 * @param {boolean} [options.autonomy=true] - Incluir checks de autosuficiencia
 * @param {boolean} [options.ecosystem=false] - Auditar todo el workspace
 * @returns {Promise<void>}
 */
export async function audit(projectPath, options) {
  const { fix = false, verbose = false, autonomy = true, ecosystem = false } = options;
  const targetDir = path.resolve(process.cwd(), projectPath);

  if (ecosystem) {
    await auditEcosystem(targetDir, { verbose });
    return;
  }

  console.log(chalk.bold.cyan('\n🔍 G360 Project Audit\n'));
  console.log(chalk.gray(`Path: ${targetDir}\n`));

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Path not found: ${targetDir}`));
    return;
  }

  const results = await auditor.audit(targetDir, { verbose, autonomy });

  console.log(chalk.yellow('📊 Audit Results:'));
  console.log(chalk.green(`  Passed: ${results.passed}`));
  console.log(chalk.red(`  Failed: ${results.failed}`));
  console.log(chalk.cyan(`  Warnings: ${results.warnings}\n`));

  if (results.issues.length > 0) {
    console.log(chalk.bold.yellow('Issues Found:'));
    results.issues.forEach(issue => {
      const icon = issue.severity === 'error' ? chalk.red('✗') : chalk.yellow('!');
      console.log(`  ${icon} ${chalk.gray(issue.file)}: ${issue.message}`);
    });
    console.log();
  }

  if (results.passed === results.total && results.warnings === 0) {
    console.log(chalk.green('✅ Project is G360 compliant!\n'));
  } else {
    console.log(chalk.yellow('⚠️  Some issues need attention.\n'));
  }

  if (autonomy) {
    const { status, findings } = autonomyAuditor.check(targetDir);
    if (status === 'fail') {
      const failed = findings.filter((finding) => finding.status === 'fail').map((finding) => finding.label);
      console.log(chalk.red(`❌ El proyecto no es autosuficiente: ${failed.join(', ')}`));
      console.log(chalk.gray('   Criterio: `git clone` + un comando => app arriba y tests en verde, sin red.\n'));
    } else if (status === 'warn') {
      const warned = findings.filter((finding) => finding.status === 'warn').map((finding) => finding.label);
      console.log(chalk.yellow(`⚠️  Autosuficiencia con pendientes: ${warned.join(', ')}\n`));
    }
  }

  if (fix) {
    console.log(chalk.cyan('Auto-fix not yet implemented.\n'));
  }
}
