/**
 * @file python-runner.js
 * @description Runner consolidado para ejecutar codigo Python desde Node.js
 * @author @carloscus
 * @version 1.1.0
 */

import { spawn } from 'child_process';
import path from 'path';

/**
 * Ejecuta codigo Python y retorna stdout/stderr.
 * Soporta args adicionales pasados como sys.argv[1..].
 *
 * @param {string} code - Codigo Python a ejecutar
 * @param {Object|string[]} [optionsOrArgs] - Opciones ({pythonPath, timeout})
 *   o array de argumentos para sys.argv (cuando es array, extraOptions contiene las opts)
 * @param {Object} [extraOptions] - Opciones cuando se pasan args por segundo parametro
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export function runPython(code, optionsOrArgs = {}, extraOptions = {}) {
  // Deteksi: si optionsOrArgs es un array, son args; si es objeto plano, son opciones
  const args = Array.isArray(optionsOrArgs) ? optionsOrArgs : [];
  const opts = Array.isArray(optionsOrArgs) ? extraOptions : optionsOrArgs;
  const { pythonPath, timeout } = opts;

  return new Promise((resolve, reject) => {
    const pyExec = pythonPath || process.env.PYTHON || 'python3';
    const proc = spawn(pyExec, ['-c', code, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timer;

    if (timeout) {
      timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`Python timeout despues de ${timeout}ms`));
      }, timeout);
    }

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `Python termino con codigo ${code}`));
      }
    });

    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar Python: ${err.message}`));
    });
  });
}

/**
 * Ejecuta codigo Python y retorna solo stdout
 * @param {string} code - Codigo Python a ejecutar
 * @param {Object|string[]} [optionsOrArgs] - Mismas opciones que runPython
 * @param {Object} [extraOptions] - Opciones adicionales
 * @returns {Promise<string>} stdout
 */
export async function runPythonStdout(code, optionsOrArgs = {}, extraOptions = {}) {
  const { stdout } = await runPython(code, optionsOrArgs, extraOptions);
  return stdout;
}

/**
 * Crea el prefijo de Python para importar desde src/py/src
 * @param {string} commandDir - Directorio del comando que invoca
 * @returns {string} Lineas Python para sys.path.insert
 */
export function g360CorePath(commandDir) {
  const pySrc = path.join(commandDir, '..', 'py', 'src').replace(/\\/g, '\\\\');
  return `import sys\nsys.path.insert(0, '${pySrc}')`;
}