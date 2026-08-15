/**
 * @file python-runner.js
 * @description Runner consolidado para ejecutar codigo Python desde Node.js
 * @author @carloscus
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import path from 'path';

/**
 * Ejecuta codigo Python y retorna stdout/stderr
 * @param {string} code - Codigo Python a ejecutar
 * @param {Object} options - Opciones opcionales
 * @param {string} options.pythonPath - Ruta al interprete Python
 * @param {number} options.timeout - Timeout en ms
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export function runPython(code, options = {}) {
  const { pythonPath, timeout } = options;

  return new Promise((resolve, reject) => {
    const pyExec = pythonPath || process.env.PYTHON || 'python3';
    const proc = spawn(pyExec, ['-c', code], {
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
 * @param {Object} options - Mismas opciones que runPython
 * @returns {Promise<string>} stdout
 */
export async function runPythonStdout(code, options = {}) {
  const { stdout } = await runPython(code, options);
  return stdout;
}

/**
 * Crea el prefijo de Python para importar desde src/py/src
 * @param {string} commandDir - Directorio del comando que invoca (usar __dirname o import.meta)
 * @returns {string} Lineas Python para sys.path.insert
 */
export function g360CorePath(commandDir) {
  const pySrc = path.join(commandDir, '..', 'py', 'src').replace(/\\/g, '\\\\');
  return `import sys\nsys.path.insert(0, '${pySrc}')`;
}
