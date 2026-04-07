import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { manifest } from '../lib/manifest.js';
import { progress } from '../lib/progress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function init(name, options) {
  const { template = 'web-pwa', dir = '.', dryRun = false, force = false } = options;
  const targetDir = path.join(process.cwd(), dir, name);
  
  console.log(chalk.bold.cyan('\n🚀 G360 Project Initialization\n'));
  console.log(`Project: ${chalk.yellow(name)}`);
  console.log(`Template: ${chalk.blue(template)}`);
  console.log(`Target: ${chalk.gray(targetDir)}\n`);

  const templatesPath = path.join(__dirname, '../assets/templates');
  
  if (!fs.existsSync(templatesPath)) {
    console.error(chalk.red('❌ Templates not found. Run: g360 update'));
    return;
  }

  const templateDir = path.join(templatesPath, template);
  
  if (!fs.existsSync(templateDir)) {
    console.error(chalk.red(`❌ Template "${template}" not found.`));
    console.log(chalk.gray('\nAvailable templates:'));
    const templates = fs.readdirSync(templatesPath);
    templates.forEach(t => console.log(chalk.gray(`  - ${t}`)));
    return;
  }

  if (fs.existsSync(targetDir) && !force) {
    console.error(chalk.red(`❌ Directory "${name}" already exists. Use --force to overwrite.`));
    return;
  }

  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN - No files will be created\n'));
    console.log(chalk.gray(`Would create: ${targetDir}`));
    return;
  }

  const progressBar = progress('Creating project...');
  
  try {
    await fs.copy(templateDir, targetDir);
    await manifest.init(targetDir, { name, template, version: '1.0.0' });
    progressBar.stop();
    
    console.log(chalk.green('\n✅ Project created successfully!\n'));
    console.log(chalk.gray('Next steps:'));
    console.log(`  ${chalk.cyan('cd')} ${name}`);
    console.log(`  ${chalk.cyan('g360 bring')}`);
    console.log(`  ${chalk.cyan('g360 present')}\n`);
  } catch (error) {
    progressBar.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
}
