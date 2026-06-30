#!/usr/bin/env node
/**
 * Comando: g360 validate <archivos/directorios>
 * Valida archivos ERP sin procesar completamente.
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function validate(paths, options) {
  const { recursive = false } = options;
  
  console.log(chalk.blue('\n🔍 Validando archivos ERP\n'));

  const filesToCheck = [];
  for (const rawPath of paths) {
    const p = path.resolve(rawPath);
    try {
      const stat = await fs.stat(p);
      if (stat.isFile()) {
        if (/\.(xls|xlsx|csv)$/i.test(p)) {
          filesToCheck.push(p);
        }
      } else if (stat.isDirectory()) {
        const pattern = recursive ? '**/*' : '*';
        const extPattern = /\.(xls|xlsx|csv)$/i;
        const entries = await fs.readdir(p, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(p, entry.name);
          if (entry.isFile() && extPattern.test(entry.name)) {
            filesToCheck.push(fullPath);
          } else if (entry.isDirectory() && recursive) {
            // Simplificado: escaneo recursivo básico
            const sub = await fs.readdir(fullPath, { withFileTypes: true });
            for (const subEntry of sub) {
              if (subEntry.isFile() && extPattern.test(subEntry.name)) {
                filesToCheck.push(path.join(fullPath, subEntry.name));
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(chalk.yellow(`  ⚠ No se pudo acceder a ${p}: ${err.message}`));
    }
  }

  if (filesToCheck.length === 0) {
    console.warn(chalk.yellow('  No se encontraron archivos para validar'));
    return;
  }

  const results = [];

  for (const file of filesToCheck) {
    try {
      const validation = await validateSingleFile(file);
      results.push(validation);
    } catch (err) {
      results.push({ path: file, valid: false, missing: [`ERROR: ${err.message}`] });
    }
  }

  let validCount = 0;
  for (const res of results) {
    const status = res.valid ? chalk.green('✅') : chalk.red('❌');
    const filename = path.basename(res.path);
    console.log(`${status} ${filename} (${res.valid ? 'OK' : 'FALLÓ'})`);
    if (!res.valid && res.missing.length > 0) {
      console.log(chalk.gray(`   Faltan: ${res.missing.join(', ')}`));
    }
    if (res.valid) validCount++;
  }

  console.log(chalk.gray(`\n📊 Resumen: ${validCount}/${results.length} archivos válidos`));
}

async function validateSingleFile(filepath) {
  const pyCode = `
import sys
sys.path.insert(0, '${path.join(__dirname, '..', 'py', 'src')}')
from g360_core.scanner import ERPScanner
from pathlib import Path

scanner = ERPScanner(min_valid_score=10)
try:
    df = scanner._read_headers(Path('${filepath.replace(/'/g, "\\'")}'), nrows=50)
    missing = scanner._validate_columns(df)
    is_valid = len(missing) == 0
    print(f"VALID={is_valid}")
    if missing:
        print(f"MISSING={','.join(missing)}")
except Exception as e:
    print(f"ERROR={str(e)}")
`;

  try {
    const result = await runPython(pyCode);
    const lines = result.stdout.split('\n').filter(l => l.trim());

    let valid = false;
    let missing = [];

    for (const line of lines) {
      if (line.startsWith('VALID=')) {
        valid = line.split('=')[1] === 'True';
      } else if (line.startsWith('MISSING=')) {
        missing = line.split('=')[1].split(',');
      } else if (line.startsWith('ERROR=')) {
        throw new Error(line.split('=')[1]);
      }
    }

    return { path: filepath, valid, missing };
  } catch (err) {
    return { path: filepath, valid: false, missing: [err.message] };
  }
}

function runPython(code) {
  return new Promise((resolve, reject) => {
    const pyExec = process.env.PYTHON || 'python3';
    const proc = spawn(pyExec, ['-c', code], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `Python terminó con código ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`No se pudo ejecutar Python: ${err.message}`));
    });
  });
}