import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { reviewProject, REVIEW_LEVELS } from '../lib/ui-review.js';

export async function review(targetLevel, options) {
  const { project, json = false } = options;
  const level = REVIEW_LEVELS.includes(targetLevel) ? targetLevel : 'all';
  const targetDir = project ? path.resolve(project) : path.resolve(targetLevel && !REVIEW_LEVELS.includes(targetLevel) ? targetLevel : '.');

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Directorio no encontrado: ${targetDir}`));
    return;
  }

  const result = reviewProject(targetDir, level);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(chalk.bold.cyan('\n🎨 G360 Review — Inspeccion UI/UX\n'));
  console.log(chalk.gray(`Path: ${targetDir}`));
  console.log(chalk.gray(`Nivel: ${level}`));
  console.log(chalk.gray(`Framework: ${result.framework}`));
  console.log(chalk.gray(`Paleta: ${result.palette ? `${result.palette.file} (${result.palette.colors.length} colores)` : 'sin skill.json'}`));
  console.log(chalk.gray(`Archivos UI: ${result.summary.filesScanned}\n`));

  if (result.findings.length === 0) {
    console.log(chalk.green('✅ UI limpia. Sin hallazgos.\n'));
    return;
  }

  const groups = [
    ['critical', '🔴 Criticos', chalk.red],
    ['important', '🟡 Importantes', chalk.yellow],
    ['minor', '🔵 Menores', chalk.blue],
  ];

  for (const [severity, label, color] of groups) {
    const items = result.findings.filter((f) => f.severity === severity);
    if (items.length === 0) continue;
    console.log(color(`\n${label} (${items.length}):\n`));
    for (const f of items) printFinding(f);
  }

  console.log(chalk.bold(`\n📊 Puntaje UI: ${result.score}/100`));
  console.log(chalk.gray(`   Criticos: ${result.summary.critical} | Importantes: ${result.summary.important} | Menores: ${result.summary.minor}`));
  if (result.palette) {
    console.log(chalk.gray(`   Archivos con tokens: ${result.summary.tokenBasedFiles} | Con literales: ${result.summary.hardcodedFiles}`));
  }
  if (result.summary.componentsMissing.length > 0) {
    console.log(chalk.gray(`   Esenciales ausentes: ${result.summary.componentsMissing.join(', ')}`));
  }
  console.log();
}

function printFinding(f) {
  console.log(chalk.bold(`[${f.type}]`));
  console.log(chalk.white(`  ${f.message}`));
  console.log(chalk.gray(`  Archivo: ${f.file}`));
  if (f.recommended) {
    console.log(chalk.green(`  Recomendado: ${f.recommended}`));
  }
  console.log();
}
