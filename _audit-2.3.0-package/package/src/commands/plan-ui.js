/**
 * @file plan-ui.js
 * @description g360 plan-ui — Wireframe en texto antes de generar codigo.
 * Emite un plan de layout (bloques, orden, densidad) a partir de un layout
 * del catalogo, para que el agente lo llene y el usuario lo apruebe antes
 * de escribir una linea de Flet/React.
 * @author @carloscus
 * @version 1.0.0
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAYOUTS_DIR = path.join(__dirname, '../assets/layouts');

/** Lee el indice de layouts del catalogo. */
export function getLayouts() {
  const idx = path.join(LAYOUTS_DIR, 'layouts.json');
  if (!fs.existsSync(idx)) return [];
  return fs.readJsonSync(idx).layouts || [];
}

/** Devuelve el contenido markdown de un layout. */
export function getLayoutBody(name) {
  const layout = getLayouts().find((l) => l.name === name);
  if (!layout) return null;
  const file = path.join(LAYOUTS_DIR, layout.file);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

/**
 * Genera el plan UI en markdown a partir del layout elegido.
 * @param {string} layoutName
 * @param {Object} opts
 * @param {string} [opts.appName] - Nombre de la app/pantalla
 * @param {string[]} [opts.sections] - Secciones pedidas por el usuario
 * @returns {string} markdown del plan
 */
export function buildPlan(layoutName, { appName = 'App G360', sections = [] } = {}) {
  const layout = getLayouts().find((l) => l.name === layoutName);
  const body = getLayoutBody(layoutName);

  const header = [
    `# UI Plan — ${appName}`,
    '',
    `> Layout base: **${layoutName}**${layout ? ` — ${layout.description}` : ''}`,
    `> Cuándo aplica: ${layout?.useWhen || 'N/A'}`,
    '',
    '## Objetivo de la pantalla',
    '',
    '_[El agente completa: qué decide o hace el usuario en esta pantalla]_',
    '',
    '## Bloques (en orden visual)',
    '',
  ].join('\n');

  const sectionsBlock = sections.length
    ? sections.map((s, i) => `${i + 1}. ${s} — _[alto, estado vacío, estado carga]_`).join('\n')
    : '_[El agente completa: lista de bloques de arriba a abajo, con alto aproximado y estados (vacío, carga, error)]_';

  const checklist = [
    '',
    '## Checklist de composición',
    '',
    '- [ ] Máximo 1 elemento protagonista por pantalla',
    '- [ ] Cada bloque tiene estado vacío y de carga definidos',
    '- [ ] Acciones principales: máximo 2 visibles en header',
    '- [ ] Espaciado consistente: 16px entre bloques, 12px padding de card',
    '- [ ] Tokens de color del skill del proyecto (sin hex hardcoded)',
    '',
    '## Loop de verificación',
    '',
    '1. Implementar siguiendo este plan',
    '2. `g360 capture` → leer la captura',
    '3. Comparar captura vs este plan → corregir desviaciones',
    '4. `g360 review` → objetivo >= 90/100',
    '',
  ].join('\n');

  return `${header}${sectionsBlock}\n\n${body ? `---\n\n${body}\n` : ''}${checklist}`;
}

export async function planUi(layoutName, options) {
  const { project = '.', app = 'App G360', sections = null, out = null, print = false } = options;

  const layouts = getLayouts();
  console.log(chalk.bold.cyan('\n🗺  G360 Plan UI — Wireframe antes de codigo\n'));

  if (!layoutName || !layouts.find((l) => l.name === layoutName)) {
    console.log(chalk.red(layoutName ? `❌ Layout "${layoutName}" no existe.\n` : '❌ Indica el layout base.\n'));
    console.log(chalk.bold.yellow('Layouts disponibles:'));
    for (const l of layouts) {
      console.log(chalk.gray(`  - ${l.name}`));
      console.log(chalk.gray(`    ${l.description}`));
    }
    console.log(chalk.white('\nUso: g360 plan-ui <layout> --app "Mi pantalla" --project <ruta>\n'));
    return;
  }

  const sectionList = sections
    ? String(sections).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const plan = buildPlan(layoutName, { appName: app, sections: sectionList });

  if (print || !out) {
    console.log(plan);
  }

  if (out) {
    const outFile = path.resolve(path.resolve(project), out);
    fs.outputFileSync(outFile, plan, 'utf8');
    console.log(chalk.green(`✅ Plan guardado: ${outFile}`));
    console.log(chalk.gray('\nSiguiente: completar el plan, aprobarlo, y recien ahi generar codigo.\n'));
  }
}
