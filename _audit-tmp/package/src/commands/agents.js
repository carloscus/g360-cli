import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { agentsGenerator } from '../lib/agents-generator.js';

const REPO_MARKERS = [
  '.git', 'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'requirements.txt'
];

/**
 * Indica si un directorio parece ser un repositorio de proyecto.
 * @param {string} dir - Directorio
 * @returns {boolean}
 */
function isRepo(dir) {
  return REPO_MARKERS.some((marker) => fs.existsSync(path.join(dir, marker)));
}

/**
 * Genera o actualiza el AGENTS.md de un proyecto (o de todo el workspace).
 * @param {string} projectPath - Ruta del proyecto
 * @param {Object} options - Opciones
 * @param {boolean} [options.dryRun=false] - Simular sin escribir
 * @param {boolean} [options.force=false] - Sobrescribir el archivo entero
 * @param {boolean} [options.ecosystem=false] - Tratar la ruta como workspace
 * @returns {Promise<Object|Object[]>} Resultado de la generación
 */
export async function agents(projectPath, options = {}) {
  const { dryRun = false, force = false, ecosystem = false, envExample = false } = options;
  const targetDir = path.resolve(process.cwd(), projectPath);

  if (ecosystem) {
    return agentsEcosystem(targetDir, { dryRun, force, envExample });
  }

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Path not found: ${targetDir}`));
    return { status: 'error' };
  }

  const result = agentsGenerator.apply(targetDir, { dryRun, force, envExample });

  const icon = result.status === 'created' ? chalk.green('+')
    : result.status === 'updated' ? chalk.yellow('~')
      : chalk.gray('=');

  const label = result.status === 'created' ? 'creado'
    : result.status === 'updated' ? 'actualizado'
      : 'sin cambios';

  const envNote = result.envExample ? chalk.cyan('  + .env.example') : '';

  console.log(
    `  ${icon} ${chalk.bold(path.basename(targetDir).padEnd(28))} ` +
    `${label.padEnd(13)} ${chalk.gray(result.verify)}${envNote}`
  );

  return result;
}

/**
 * Genera el AGENTS.md de todos los repos de un workspace.
 * @param {string} rootDir - Raíz del workspace
 * @param {Object} options - Opciones
 * @param {boolean} [options.dryRun=false] - Simular sin escribir
 * @param {boolean} [options.force=false] - Sobrescribir los archivos enteros
 * @returns {Promise<Object[]>} Resultados por repo
 */
export async function agentsEcosystem(rootDir, options = {}) {
  const { dryRun = false, force = false, envExample = false } = options;
  const projectsDir = fs.existsSync(path.join(rootDir, 'projects'))
    ? path.join(rootDir, 'projects')
    : rootDir;

  const repos = fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(projectsDir, entry.name))
    .filter((dir) => isRepo(dir))
    .sort();

  console.log(chalk.bold.cyan('\n📝 AGENTS.md por repo\n'));
  console.log(chalk.gray(`Proyectos: ${repos.length}  ·  ${projectsDir}\n`));
  if (dryRun) console.log(chalk.yellow('  ⚠️  dry-run: no se escribe nada\n'));

  const results = [];
  for (const repo of repos) {
    results.push(await agents(repo, { dryRun, force, envExample }));
  }

  const created = results.filter((result) => result.status === 'created').length;
  const updated = results.filter((result) => result.status === 'updated').length;
  const unchanged = results.filter((result) => result.status === 'unchanged').length;

  console.log('');
  console.log(
    chalk.green(`  + creados: ${created}`) + '   ' +
    chalk.yellow(`  ~ actualizados: ${updated}`) + '   ' +
    chalk.gray(`  = sin cambios: ${unchanged}`) +
    chalk.gray(`   de ${repos.length} repos`)
  );
  console.log('');

  return results;
}
