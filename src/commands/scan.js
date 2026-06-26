#!/usr/bin/env node
/**
 * Comando: g360 scan <directorio>
 * Escanea un directorio para detectar archivos ERP válidos.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export = (program: Command) => {
  program
    .command('scan')
    .argument('<directorio>', 'Directorio a escanear')
    .option('-r, --recursive', 'Buscar recursivamente', true)
    .option('--min-score <n>', 'Puntuación mínima', '10')
    .action(async (directorio, options) => {
      console.log(chalk.blue(`\n🔍 Escaneando directorio: ${directorio}`));

      const pyCode = `
import sys
from pathlib import Path

from g360_core.scanner import ERPScanner

scanner = ERPScanner(min_valid_score=${options.minScore})
files = scanner.scan_directory(Path('${directorio}'), recursive=${options.recursive})
valid = scanner.get_valid_files(files)
invalid = scanner.get_invalid_files(files)

print(f"TOTAL={len(files)}")
print(f"VALIDOS={len(valid)}")
print(f"INVALIDOS={len(invalid)}")

for erp_type, flist in scanner.group_by_erp_type(files).items():
    if erp_type not in ('UNKNOWN', 'ERROR'):
        print(f"TIPO::{erp_type}::{len(flist)}")
        for info in flist[:5]:
            print(f"FILE::{info.path.name}::{info.size_bytes}")

for info in invalid[:10]:
    print(f"INVALID::{info.path.name}::${info.error_msg}")
`;

      try {
        const { runPython } = await import('../lib/python_runner.js');
        const result = await runPython(pyCode);
        const lines = result.stdout.split('\n').filter(l => l.trim());

        let total = 0, validCount = 0, invalidCount = 0;
        const types = new Map();

        for (const line of lines) {
          if (line.startsWith('TOTAL=')) total = parseInt(line.split('=')[1]);
          else if (line.startsWith('VALIDOS=')) validCount = parseInt(line.split('=')[1]);
          else if (line.startsWith('INVALIDOS=')) invalidCount = parseInt(line.split('=')[1]);
          else if (line.startsWith('TIPO::')) {
            const [, tipo, count] = line.split('::');
            types.set(tipo, parseInt(count));
          }
        }

        console.log(chalk.gray(`\n📈 Resultados:`));
        console.log(`   Total archivos: ${total}`);
        console.log(chalk.green(`   Válidos: ${validCount}`));
        console.log(chalk.red(`   Inválidos/Error: ${invalidCount}`));

        if (types.size > 0) {
          console.log(chalk.green('\n✅ Archivos válidos por tipo ERP:'));
          for (const [tipo, count] of types) {
            console.log(`  ${tipo}: ${count} archivos`);
          }
        }

        if (invalidCount > 0) {
          console.log(chalk.red('\n❌ Archivos con problemas:'));
          let invalidLines = lines.filter(l => l.startsWith('INVALID::'));
          for (const line of invalidLines.slice(0, 10)) {
            const parts = line.split('::');
            console.log(`  • ${parts[1]}: ${parts.slice(2).join('::')}`);
          }
          if (invalidLines.length > 10) {
            console.log(`  ... y ${invalidLines.length - 10} más`);
          }
        }

        if (validCount > 0) {
          console.log(chalk.cyan('\n💡 Para procesar todos estos archivos:'));
          console.log(`   g360 ingest "${directorio}" -o maestro_ventas_crm.csv`);
        }

      } catch (err: any) {
        console.error(chalk.red('❌ Error durante escaneo:'), err.message);
        if (err.stdout) console.error(chalk.gray(err.stdout));
        if (err.stderr) console.error(chalk.red(err.stderr));
        process.exit(1);
      }
    });
};
