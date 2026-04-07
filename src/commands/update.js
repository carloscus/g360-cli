import chalk from 'chalk';
import { execSync } from 'child_process';

export async function update(options) {
  const { check = false } = options;
  
  console.log(chalk.bold.cyan('\n⬆️  G360 Update\n'));

  if (check) {
    try {
      const currentVersion = '1.0.0';
      console.log(chalk.gray(`Current version: ${currentVersion}`));
      console.log(chalk.gray('Check npm for latest version...'));
      console.log(chalk.yellow('\nUse: npm install -g g360-cli@latest to update'));
    } catch (error) {
      console.error(chalk.red(`Error checking version: ${error.message}`));
    }
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
