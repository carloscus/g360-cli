#!/usr/bin/env node
/**
 * Comando: g360 validate <archivos/directorios>
 * Valida archivos ERP sin procesar completamente.
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPython, g360CorePath } from '../lib/python-runner.js';
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
        const extPattern = /\.(xls|xlsx|csv)$/i;
        const entries = await fs.readdir(p, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(p, entry.name);
          if (entry.isFile() && extPattern.test(entry.name)) {
            filesToCheck.push(fullPath);
          } else if (entry.isDirectory() && recursive) {
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
    console.log(`${status} ${filename} (${res.valid ? 'OK' : 'FALLO'})`);
    if (!res.valid && res.missing.length > 0) {
      console.log(chalk.gray(`   Faltan: ${res.missing.join(', ')}`));
    }
    if (res.valid) validCount++;
  }

  console.log(chalk.gray(`\n📊 Resumen: ${validCount}/${results.length} archivos validos`));
}

async function validateSingleFile(filepath) {
  const pyCode = `
${g360CorePath(__dirname)}
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
    const { stdout } = await runPython(pyCode);
    const lines = stdout.split('\n').filter(l => l.trim());

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
