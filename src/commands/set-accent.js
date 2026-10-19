/**
 * @file set-accent.js
 * @description g360 set-accent — Cambia la familia de acento del proyecto
 * reescribiendo los tokens accent* de su skill.json (derivacion simetrica).
 * @author @carloscus
 * @version 1.0.0
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { listFamilyNames, accentTokensFor, validateColorTokens, contrastRatio, loadFamilies } from '../lib/accent-families.js';

const SKILL_CANDIDATES = ['skill.json', 'src/core/skill.json'];

function findSkillJson(projectDir) {
  for (const rel of SKILL_CANDIDATES) {
    const p = path.join(projectDir, rel);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function setAccent(familyName, options = {}) {
  const { project = '.', dryRun = false, mode = 'dark' } = options;
  const all = loadFamilies().families;
  // Familias seleccionables = las no-legacy (las legacy son tonos de skills existentes)
  const families = Object.entries(all).filter(([, f]) => !f.legacy).map(([name]) => name);
  const known = Object.keys(all).includes(familyName);

  console.log(chalk.bold.cyan('\n🎨 G360 Set Accent — Familia de acento\n'));

  if (!familyName || !families.includes(familyName)) {
    console.log(chalk.red(familyName ? `❌ Familia "${familyName}" no existe.\n` : '❌ Indica la familia.\n'));
    console.log(chalk.bold.yellow('Familias disponibles:'));
    families.forEach((f) => {
      const tokens = accentTokensFor(f);
      console.log(chalk.gray(`  - ${f}`) + chalk.gray(`  →  accent ${tokens.accent}`));
    });
    console.log(chalk.white(`\nUso: g360 set-accent <familia> --project <ruta>\n`));
    if (familyName && known && all[familyName].legacy) {
      console.log(chalk.yellow(`(la familia "${familyName}" es legacy: tono fijo de skills existentes)\n`));
    }
    return;
  }

  const projectDir = path.resolve(project);
  const skillPath = findSkillJson(projectDir);

  if (!skillPath) {
    console.error(chalk.red('❌ No se encontro skill.json en el proyecto.'));
    console.log(chalk.gray('   Crea uno con: g360 set-skill <skill>'));
    return;
  }

  let skill;
  try {
    skill = fs.readJsonSync(skillPath);
  } catch {
    console.error(chalk.red(`❌ No se pudo leer ${skillPath}`));
    return;
  }

  const tokens = accentTokensFor(familyName, mode);
  const merged = { ...(skill.colors || {}), ...tokens };

  const validation = validateColorTokens(merged, { familyName });
  if (!validation.ok) {
    validation.issues.forEach((i) => console.log(chalk.yellow(`   ⚠ ${i}`)));
    console.log();
  }

  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN - Cambios que se aplicarian:'));
    for (const [k, v] of Object.entries(tokens)) {
      console.log(chalk.gray(`   ${k}: ${skill.colors?.[k] || '(vacío)'} → ${v}`));
    }
    console.log();
    return;
  }

  skill.colors = merged;
  skill.accentFamily = familyName;
  skill.updatedAt = new Date().toISOString();
  fs.writeJsonSync(skillPath, skill, { spaces: 2 });

  console.log(chalk.green(`✅ Familia "${familyName}" aplicada (${mode}) a ${skillPath}\n`));
  Object.entries(tokens).forEach(([k, v]) => {
    console.log(chalk.gray(`   ${k}: ${v}`));
  });
  if (skill.colors.accent) {
    console.log(chalk.gray(`\n   Verificacion: onAccent/accent = ${contrastRatio(skill.colors.onAccent, skill.colors.accent).toFixed(2)} (objetivo >= 4.5)`));
  }
  console.log(chalk.cyan('\nSiguiente: g360 capture para verificar visualmente el cambio.\n'));
}
