import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, '../../package.json');

export async function update(options) {
  const { check = false } = options;
  
  // Detectar si estamos corriendo en modo portable (pkg)
  const isPortable = process.pkg !== undefined;

  console.log(chalk.bold.cyan('\n⬆️  G360 Update\n'));
  const { version: currentVersion } = fs.readJsonSync(pkgPath);
  
  if (check) {
    try {
      console.log(chalk.gray(`Current version: ${currentVersion}`));
      console.log(chalk.gray('Check npm for latest version...'));
      console.log(chalk.yellow('\nUse: npm install -g g360-cli@latest to update'));
    } catch (error) {
      console.error(chalk.red(`Error checking version: ${error.message}`));
    }
    return;
  }

  if (isPortable) {
    console.log(chalk.cyan('🚀 Estás usando la versión portable de G360-CLI.'));
    console.log(chalk.yellow('Para actualizar, descarga el nuevo binario desde el repositorio oficial.'));
    return;
  }

  try {
    console.log(chalk.yellow('Installing latest g360-cli...\n'));
    execSync('npm install -g g360-cli', { stdio: 'inherit' });
    console.log(chalk.green('\n✅ g360-cli updated successfully!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Update failed. Try:'));
    console.log(chalk.gray('  npm install -g g360-cli@latest\n'));
  }
}
