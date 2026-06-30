#!/usr/bin/env node
/**
 * Utilidad para obtener la ruta al módulo Python empaquetado.
 * Funciona tanto en desarrollo como en ejecutables empaquetados con pkg.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Retorna la ruta al directorio src/g360_core del módulo Python.
 */
export function getPythonModulePath() {
  // Ruta de desarrollo: py/src/g360_core relativo a este archivo
  const devPath = path.join(__dirname, '..', 'py', 'src');
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // En pkg (ejecutable empaquetado)
  const basePath = process.execPath || process.argv[0];
  const pkgPath = path.join(basePath, '..', 'resources', 'py', 'src');
  if (fs.existsSync(pkgPath)) {
    return pkgPath;
  }

  // Fallback: directorio actual
  const cwdPath = path.join(process.cwd(), 'py', 'src');
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  return devPath;
}

/**
 * Genera código Python que configura sys.path correctamente.
 */
export function wrapPythonCode(pyCode) {
  const modulePath = getPythonModulePath().replace(/\\/g, '\\\\');

  return `
import sys
import os
from pathlib import Path

module_path = r"${modulePath}"
if module_path not in sys.path:
    sys.path.insert(0, module_path)

${pyCode}
`;
}

/**
 * Ejecuta código Python y retorna su salida.
 */
export async function runPython(pyCode) {
  const fullCode = wrapPythonCode(pyCode);
  const pyExec = process.env.PYTHON || 'python3';

  const { spawn } = await import('child_process');
  const proc = spawn(pyExec, ['-c', fullCode], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });

  let stdout = '';
  let stderr = '';

  await new Promise((resolve, reject) => {
    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Python código ${code}`));
    });

    proc.on('error', (err) => {
      reject(new Error(`Python no disponible: ${err.message}`));
    });
  });

  return { stdout, stderr };
}