#!/usr/bin/env node
/**
 * Comando: g360 scan <directorio>
 * Escanea un directorio para detectar archivos ERP válidos.
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function scan(directory, options) {
  const { recursive = true, minScore = 10 } = options;
  
  console.log(chalk.blue(`\n🔍 Escaneando directorio: ${directory}`));

  const pyCode = `
import sys
sys.path.insert(0, '${path.join(__dirname, '..', 'py', 'src')}')
from g360_core.scanner import find_erp_files_in_dir
from pathlib import Path
import json

valid, invalid = find_erp_files_in_dir(Path('${directory}'), recursive=${recursive})
result = {
    "valid": [{"path": str(v.path), "erp_type": v.erp_type, "size_bytes": v.size_bytes} for v in valid],
    "invalid": [{"path": str(i.path), "error_msg": i.error_msg} for i in invalid],
    "stats": {"total": len(valid) + len(invalid), "valid": len(valid), "invalid": len(invalid)}
}
print(json.dumps(result, indent=2))
`;

  try {
    const result = await runPython(pyCode);
    const data = JSON.parse(result.stdout);
    
    console.log(chalk.gray(`\n   Total archivos: ${data.stats.total}`));
    console.log(chalk.green(`   Válidos: ${data.stats.valid}`));
    console.log(chalk.red(`   Inválidos: ${data.stats.invalid}`));
    
    if (data.valid.length > 0) {
      console.log(chalk.cyan('\n📋 Archivos válidos:'));
      data.valid.forEach(f => {
        console.log(chalk.gray(`   ${f.path} (${f.erp_type})`));
      });
    }
    
    if (data.invalid.length > 0) {
      console.log(chalk.yellow('\n⚠️  Archivos inválidos:'));
      data.invalid.forEach(f => {
        console.log(chalk.red(`   ${f.path}: ${f.error_msg}`));
      });
    }
    
  } catch (err) {
    console.error(chalk.red(`\n❌ Error escaneando: ${err.message}`));
    if (err.stdout) console.log(chalk.gray(err.stdout));
    if (err.stderr) console.error(chalk.red(err.stderr));
    process.exit(1);
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