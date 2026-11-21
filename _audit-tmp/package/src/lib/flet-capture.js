/**
 * @file flet-capture.js
 * @description Loop visual para apps Flet: lanza la app via g360_capture.py,
 * espera el primer render y guarda un screenshot para que el agente lo revise.
 * @author @carloscus
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURE_SCRIPT = path.join(__dirname, '../../py/src/g360_capture.py');

/**
 * Detecta el entrypoint Flet de un proyecto.
 * Orden: main.py en raiz, src/main.py, luego --entry explicito.
 * @param {string} projectDir
 * @param {string|null} entryOverride
 * @returns {string|null} ruta absoluta al entrypoint
 */
export function detectFletEntry(projectDir, entryOverride = null) {
  if (entryOverride) {
    const p = path.isAbsolute(entryOverride) ? entryOverride : path.join(projectDir, entryOverride);
    return fs.existsSync(p) ? p : null;
  }
  for (const candidate of ['main.py', path.join('src', 'main.py')]) {
    const p = path.join(projectDir, candidate);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Ejecuta la captura. Resuelve con { ok, output, stderr } (nunca lanza por
 * exit code != 0: el caller decide).
 * @param {Object} opts
 * @param {string} opts.entry - Ruta absoluta al entrypoint
 * @param {string} opts.output - Ruta absoluta al PNG de salida
 * @param {number} [opts.wait=3] - Segundos de espera tras render
 * @param {number} [opts.timeout=45] - Hard timeout en ms
 * @param {string} [opts.pythonPath] - Interprete Python (default: PYTHON env o python3/python)
 * @returns {Promise<{ok: boolean, output: string, stderr: string}>}
 */
export function captureFletApp({ entry, output, wait = 3, timeout = 45000, pythonPath }) {
  const pyExec = pythonPath || process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

  return new Promise((resolve) => {
    const proc = spawn(pyExec, [
      CAPTURE_SCRIPT,
      entry,
      '--out', output,
      '--wait', String(wait),
      '--timeout', String(Math.ceil(timeout / 1000)),
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ ok: false, output, stderr: `Timeout tras ${timeout}ms` });
    }, timeout);

    proc.stdout?.on('data', (d) => { stdout += d.toString(); });
    proc.stderr?.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      // El PNG existe = captura lograda (el proceso puede morir por el
      // watchdog del lado Python con exit code != 0 tras guardar).
      const ok = fs.existsSync(output);
      resolve({ ok, output, stderr: ok ? stderr : (stderr || stdout || `exit code ${code}`) });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, output, stderr: `No se pudo lanzar Python: ${err.message}` });
    });
  });
}
