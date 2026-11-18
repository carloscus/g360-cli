import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Verifica si npm está disponible ejecutando `npm --version` en lugar de
 * confiar en que la cadena 'npm' aparezca en PATH (heurística falsa en Windows
 * donde la entrada del PATH es el directorio nodejs, no el binario npm).
 * @returns {boolean} true si npm responde con status 0
 */
function npmAvailable() {
  // shell: true resuelve npm.cmd/.bat en Windows (CreateProcess solo ve .exe);
  // en POSIX es un no-op inofensivo. Los args son fijos, sin riesgo de inyección.
  const result = spawnSync('npm', ['--version'], { stdio: 'ignore', shell: true });
  return result.status === 0;
}

export async function health(options) {
  const { verbose = false } = options;
  
  console.log(chalk.bold.cyan('\n🏥 G360 Health Check\n'));

  const checks = [];

  checks.push({
    name: 'Node.js',
    status: process.version ? 'ok' : 'error',
    message: process.version
  });

  const npmOk = npmAvailable();
  checks.push({
    name: 'npm',
    status: npmOk ? 'ok' : 'error',
    message: npmOk ? 'Available' : 'Not found'
  });

  const assetsPath = path.join(__dirname, '../assets');
  const hasAssets = fs.existsSync(assetsPath);
  checks.push({
    name: 'G360 Assets',
    status: hasAssets ? 'ok' : 'warn',
    message: hasAssets ? 'Installed' : 'Run g360 update'
  });

  const manifest = path.join(process.cwd(), 'g360-manifest.json');
  const hasManifest = fs.existsSync(manifest);
  checks.push({
    name: 'Project Manifest',
    status: hasManifest ? 'ok' : 'warn',
    message: hasManifest ? 'Found' : 'Not in a G360 project'
  });

  console.log(chalk.yellow('System Status:'));
  checks.forEach(check => {
    const icon = check.status === 'ok' ? chalk.green('✓') : 
                 check.status === 'warn' ? chalk.yellow('!') : chalk.red('✗');
    console.log(`  ${icon} ${check.name}: ${chalk.gray(check.message)}`);
  });

  const allOk = checks.every(c => c.status !== 'error');
  console.log();
  
  if (allOk) {
    console.log(chalk.green('✅ System is healthy!\n'));
  } else {
    console.log(chalk.red('❌ Some checks failed.\n'));
    process.exitCode = 1;
  }

  if (verbose) {
    console.log(chalk.gray('\nAdditional Info:'));
    console.log(`  CWD: ${process.cwd()}`);
    console.log(`  Platform: ${process.platform}`);
    console.log();
  }
}
