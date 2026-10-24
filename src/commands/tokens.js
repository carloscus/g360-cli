import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {
  writeTokens,
  readProjectSkill,
  loadDesignConfig,
  TOKEN_TARGETS
} from '../lib/token-generator.js';

/**
 * g360 tokens — emite los design tokens del proyecto en el formato de cada
 * stack (CSS, Python, Go, Rust). Todos los stacks consumen los mismos roles,
 * asi los componentes quedan simetricos y `g360 set-accent` llega a los
 * estilos (antes solo reescribia skill.json y el CSS se quedaba en verde).
 */
export async function tokens(projectPath, options = {}) {
  const { skill, accent, dryRun = false, verbose = false } = options;
  const projectDir = path.resolve(process.cwd(), projectPath);

  console.log(chalk.bold.cyan('\n🎨 G360 Tokens\n'));
  console.log(chalk.gray(`Proyecto: ${projectDir}\n`));

  if (!fs.existsSync(projectDir)) {
    console.error(chalk.red(`❌ Path not found: ${projectDir}`));
    return;
  }

  const project = readProjectSkill(projectDir);
  const skillName = skill ?? project.skill ?? 'moderno';
  const family = accent ?? project.accentFamily ?? undefined;

  let result;
  try {
    result = writeTokens(projectDir, {
      skill: skillName,
      accentFamily: family,
      // La paleta del proyecto manda: el catalogo aporta los defaults.
      colors: project.colors ?? undefined,
      dryRun
    });
  } catch (error) {
    console.error(chalk.red(`❌ ${error.message}`));
    return;
  }

  const { written, tokens: resolved } = result;

  const primary = resolved[resolved.theme] ?? resolved.dark;
  console.log(chalk.gray(`Skill: ${resolved.skill ?? skillName}   Acento: ${resolved.accentFamily}${resolved.accentFamilyInferred ? ' (inferido)' : ''}   Tema: ${resolved.theme}`));
  console.log(chalk.gray(`Accent: ${primary.accent}   Surface: ${primary.surface}   Text: ${primary.text}\n`));

  if (resolved.issues?.length) {
    console.log(chalk.yellow('⚠️  Contraste (WCAG AA):'));
    for (const issue of resolved.issues) console.log(chalk.yellow(`   ${issue}`));
    console.log(chalk.gray('   El acento como foreground puede apoyarse en accentBright.\n'));
  }

  if (written.length === 0) {
    console.log(chalk.yellow('⚠️  No se detectaron stacks conocidos (web / python / go / rust).'));
    console.log(chalk.gray(`   Destinos conocidos: ${Object.values(TOKEN_TARGETS).join(', ')}\n`));
    return;
  }

  for (const item of written) {
    const icon = dryRun ? chalk.cyan('·') : chalk.green('+');
    console.log(`  ${icon} ${item.stack.padEnd(7)} ${chalk.gray(item.file)}`);
  }

  for (const item of result.patched ?? []) {
    console.log(`  ${chalk.green('+')} ${'meta'.padEnd(7)} ${chalk.gray(item.file)} ${chalk.gray(`(${item.changes.join('; ')})`)}`);
  }

  if (verbose) {
    console.log(chalk.bold.yellow('\nTokens (dark):'));
    for (const [role, value] of Object.entries(resolved.dark)) {
      console.log(chalk.gray(`  ${role}: ${value}`));
    }
  }

  console.log('');
  console.log(dryRun
    ? chalk.yellow('  dry-run: no se escribió nada\n')
    : chalk.green(`  ${written.length} archivo(s) de tokens escritos\n`));

  console.log(chalk.cyan('Para cambiar la familia de acento y reemitir:'));
  console.log(chalk.cyan('  g360 set-accent <familia> --project <ruta>\n'));
}

/**
 * Reemite tokens al cambiar skill o acento. Usado internamente por
 * set-skill y set-accent para que la paleta llegue a los estilos.
 * @param {string} projectDir - Directorio del proyecto
 * @param {Object} options - Opciones
 * @returns {Array} Archivos escritos
 */
export function refreshTokens(projectDir, options = {}) {
  const project = readProjectSkill(projectDir);
  const skillName = options.skill ?? project.skill ?? 'moderno';
  const family = options.accentFamily ?? project.accentFamily ?? undefined;

  try {
    const { written } = writeTokens(projectDir, { skill: skillName, accentFamily: family });
    return written;
  } catch {
    return [];
  }
}

/** Reexporta la config de diseño para los comandos que la necesiten. */
export { loadDesignConfig };
