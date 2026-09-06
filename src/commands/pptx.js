/**
 * Comando: g360 pptx [path] [opciones]
 * Genera presentacion/manual PPTX para una app G360.
 */
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';

import { analyzeApp } from '../assets/pptx/scripts/analyze-app.js';
import { generateManualPptx } from '../assets/pptx/templates/app-manual.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function pptx(targetPath, options) {
  const {
    mode = 'manual',
    theme: themeName = null,
    out,
    dryRun = false,
    screenshots,
  } = options;

  const targetDir = path.resolve(process.cwd(), targetPath || '.');

  if (!await fs.pathExists(targetDir)) {
    console.error(chalk.red(`❌ Directorio no encontrado: ${targetDir}`));
    return;
  }

  // Detectar branding desde skill.json (campo brand o nombre de skill cipsa-*)
  const skillPath = path.join(targetDir, 'skill.json');
  let detectedBrand = null;
  if (await fs.pathExists(skillPath)) {
    try {
      const skill = await fs.readJson(skillPath);
      detectedBrand = skill.brand
        || (/^cipsa/i.test(skill.skill || '') ? 'cipsa' : null);
      if (detectedBrand === 'cipsa' && !themeName) themeName = 'cipsa';
    } catch {}
  }

  console.log(chalk.bold.cyan('\n📊 G360 App → PPTX Generator\n'));
  console.log(chalk.gray(`  Proyecto: ${targetDir}`));
  console.log(chalk.gray(`  Modo: ${mode}`));
  const themeLabel = themeName || detectedBrand || 'g360';
  console.log(chalk.gray(`  Theme: ${themeLabel}`));
  if (out) console.log(chalk.gray(`  Salida: ${out}`));
  console.log('');

  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN — Outline generado:\n'));
    console.log(chalk.gray('  [1] Portada'));
    console.log(chalk.gray('  [2] Introducción (¿Qué es?)'));
    console.log(chalk.gray('  [3] Módulos (tabla + capturas)'));
    console.log(chalk.gray('  [4] Flujo de trabajo'));
    console.log(chalk.gray('  [5-N] Funcionalidades (una por módulo UI detectado)'));
    console.log(chalk.gray('  [N+1] Flujos de trabajo (modales)'));
    console.log(chalk.gray('  [N+2] Arquitectura'));
    console.log(chalk.gray('  [N+3] Buenas prácticas'));
    console.log(chalk.gray('  [N+4] Límites conocidos (si aplica)'));
    console.log(chalk.gray('  [N+5] Resumen'));
    console.log(chalk.gray(`\nFormato: 16:9 widescreen · Theme: ${themeName || detectedBrand}`));
    return;
  }

  const spinner = ora('Analizando aplicación...').start();
  try {
    const appData = await analyzeApp(targetDir);
    spinner.text = `Generando ${mode} (${appData.features.length} módulos detectados)...`;

      const pptxPath = await generateManualPptx(appData, {
      mode,
      theme: themeName || detectedBrand || 'g360',
      targetDir: targetDir,
      outPath: out,
    });

    spinner.succeed(chalk.green(`✅ PPTX generado: ${pptxPath}`));
    console.log(chalk.gray(`   Tamaño: ${Math.round((await fs.stat(pptxPath)).size / 1024)} KB`));
    console.log(chalk.gray(`   Formato: 16:9 widescreen (modo ${mode})`));
    console.log('');
    console.log(chalk.cyan('  Siguiente paso:'));
    console.log(chalk.gray('    Revisar el archivo y reemplazar placeholders de screenshots'));
    console.log(chalk.gray(`    con imágenes reales de la app en ${path.join(targetDir, 'assets', 'screenshots')}/`));
    console.log('');
  } catch (err) {
    spinner.fail(chalk.red(`❌ Error: ${err.message}`));
    console.error(err.stack);
    process.exit(1);
  }
}
