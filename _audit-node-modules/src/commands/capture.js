/**
 * @file capture.js
 * @description g360 capture — Loop visual para apps Flet.
 * Lanza la app, espera el primer render y guarda un screenshot en
 * assets/screenshots/ para que el agente lo lea e itere sobre el diseño.
 * @author @carloscus
 * @version 1.0.0
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { detectFletEntry, captureFletApp } from '../lib/flet-capture.js';

export async function capture(options) {
  const { project = '.', entry: entryOpt = null, wait = 3, timeout = 45, out = null, python: pythonPath = null } = options;
  const projectDir = path.resolve(project);

  console.log(chalk.bold.cyan('\n📸 G360 Capture — Loop visual Flet\n'));
  console.log(chalk.gray(`Proyecto: ${projectDir}`));

  if (!fs.existsSync(projectDir)) {
    console.error(chalk.red(`❌ Directorio no encontrado: ${projectDir}`));
    return;
  }

  const entry = detectFletEntry(projectDir, entryOpt);
  if (!entry) {
    console.error(chalk.red('❌ No se encontro entrypoint Flet (main.py o src/main.py).'));
    console.log(chalk.gray('   Usa --entry <archivo.py> si el entrypoint tiene otro nombre.'));
    return;
  }
  console.log(chalk.gray(`Entrypoint: ${entry}`));

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const shotsDir = path.join(projectDir, 'assets', 'screenshots');
  const output = out
    ? path.resolve(projectDir, out)
    : path.join(shotsDir, `capture-${stamp}.png`);

  fs.mkdirpSync(path.dirname(output));

  console.log(chalk.gray(`Espera: ${wait}s | Timeout: ${timeout}s`));
  console.log(chalk.gray('Lanzando app...\n'));

  const result = await captureFletApp({
    entry,
    output,
    wait: Number(wait),
    timeout: Number(timeout) * 1000,
    pythonPath: pythonPath || undefined,
  });

  if (result.ok) {
    console.log(chalk.green(`✅ Captura guardada: ${output}`));
    console.log(chalk.gray('\nProximo paso: que el agente LEA la imagen y compare contra'));
    console.log(chalk.gray('el plan de layout (g360 plan-ui) antes de iterar el codigo.\n'));
  } else {
    console.error(chalk.red(`❌ Captura fallida: ${result.stderr.trim()}`));
    console.log(chalk.gray('\nTroubleshooting:'));
    console.log(chalk.gray('  - pip install flet pillow en el entorno de la app'));
    console.log(chalk.gray('  - Verifica que main(page) renderiza sin errores (corre: python main.py)'));
    console.log(chalk.gray('  - Aumenta --wait si la app tarda en cargar datos\n'));
  }
}
