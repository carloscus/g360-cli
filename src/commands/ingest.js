#!/usr/bin/env node
/**
 * Comando: g360 ingest <archivo|directorio> [-o salida.csv]
 * Procesa archivos ERP y genera maestro_ventas_crm.csv
 */

import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function ingest(input, options) {
  const { output = 'maestro_ventas_crm.csv' } = options;
  
  console.log(chalk.blue(`\n🚀 Iniciando ingesta: ${input}`));

  const inputPath = path.resolve(input);
  const outputPath = path.resolve(output);

  // Determinar si es archivo o directorio
  try {
    await fs.access(inputPath);
  } catch {
    console.error(chalk.red(`❌ Ruta no encontrada: ${inputPath}`));
    process.exit(1);
  }

  const stat = await fs.stat(inputPath);
  let filepaths;

  if (stat.isFile()) {
    filepaths = [inputPath];
  } else if (stat.isDirectory()) {
    console.log(chalk.gray(`📁 Escaneando directorio...`));
    const result = await scanDirectory(inputPath);
    filepaths = result.valid.map(info => info.path);
    if (filepaths.length === 0) {
      console.error(chalk.red('❌ No se encontraron archivos ERP válidos en el directorio'));
      process.exit(1);
    }
    console.log(chalk.green(`   Encontrados ${filepaths.length} archivos válidos`));
  } else {
    console.error(chalk.red(`❌ Ruta no válida: ${inputPath}`));
    process.exit(1);
  }

  // Procesar archivos
  console.log(chalk.blue(`\n⚙️  Procesando ${filepaths.length} archivo(s)...`));

  try {
    const combinedCsv = await runBatchIngest(filepaths);

    // Escribir salida
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, combinedCsv, 'utf-8');
    console.log(chalk.green(`\n✅ Ingesta completada: ${outputPath}`));

    // Resumen por archivo
    const lines = combinedCsv.split('\n');
    const header = lines[0];
    const dataLines = lines.filter(l => l && l !== header);
    console.log(chalk.gray(`   Total filas: ${dataLines.length}`));

    // Conteo por ARCHIVO_ORIGEN
    const counts = new Map();
    for (const line of dataLines) {
      const cols = line.split(',');
      const idx = header.split(',').indexOf('ARCHIVO_ORIGEN');
      if (idx !== -1 && cols[idx]) {
        counts.set(cols[idx], (counts.get(cols[idx]) || 0) + 1);
      }
    }
    if (counts.size > 0) {
      console.log(chalk.cyan('\n📊 Resumen por archivo:'));
      for (const [file, count] of counts) {
        console.log(`   ${file}: ${count} filas`);
      }
    }

  } catch (err) {
    console.error(chalk.red('\n❌ Error durante la ingesta:'), err.message);
    if (err.stdout) console.error(chalk.gray(err.stdout));
    if (err.stderr) console.error(chalk.red(err.stderr));
    process.exit(1);
  }
}

async function scanDirectory(dir) {
  const pyCode = `
import sys
sys.path.insert(0, '${path.join(__dirname, '..', 'py', 'src')}')
from g360_core.scanner import find_erp_files_in_dir
from pathlib import Path

valid, invalid = find_erp_files_in_dir(Path('${dir}'), recursive=True)
for v in valid:
    print(f"VALID::{v.path.name}::{v.erp_type}::${v.size_bytes}")
for i in invalid[:10]:
    print(f"INVALID::{i.path.name}::${i.error_msg}")
`;

  const result = await runPython(pyCode);
  const lines = result.stdout.split('\n').filter(l => l.trim());
  const valid = [];
  const invalid = [];

  for (const line of lines) {
    if (line.startsWith('VALID::')) {
      const [, name, type, size] = line.split('::');
      valid.push({ path: path.join(dir, name), erp_type: type, size_bytes: parseInt(size) });
    } else if (line.startsWith('INVALID::')) {
      const [, name, error] = line.split('::');
      invalid.push({ path: path.join(dir, name), error_msg: error });
    }
  }

  return { valid, invalid };
}

async function runBatchIngest(filepaths) {
  const pyCode = `
import sys
sys.path.insert(0, '${path.join(__dirname, '..', 'py', 'src')}')
from g360_core.scanner import batch_process_files
from pathlib import Path
import pandas as pd

filepaths = [${JSON.stringify(filepaths).replace(/"/g, "'")}]
df = batch_process_files([Path(p) for p in filepaths], merge_results=True)
sys.stdout.write(df.to_csv(index=False))
`;

  return new Promise((resolve, reject) => {
    const pyExec = process.env.PYTHON || 'python3';
    const proc = spawn(pyExec, ['-c', pyCode], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Python terminó con código ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`No se pudo ejecutar Python: ${err.message}`));
    });
  });
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