import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { manifest } from '../lib/manifest.js';

export async function clean(projectPath, options) {
  const { dryRun = false, force = false } = options;
  const targetDir = path.join(process.cwd(), projectPath);
  
  console.log(chalk.bold.cyan('\n🧹 G360 Clean\n'));
  console.log(chalk.gray(`Path: ${targetDir}\n`));

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Path not found: ${targetDir}`));
    return;
  }

  const g360Dir = path.join(targetDir, 'g360');
  if (!fs.existsSync(g360Dir)) {
    console.log(chalk.yellow('No g360 assets found to clean.'));
    return;
  }

  const assetsToClean = getAssetsToClean(g360Dir);
  
  console.log(chalk.yellow('Assets to be removed:'));
  assetsToClean.forEach(asset => console.log(chalk.gray(`  - ${asset}`)));
  console.log();

  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN - No files will be removed\n'));
    return;
  }

  if (!force) {
    console.log(chalk.gray('Run with --force to confirm deletion.'));
    return;
  }

  try {
    await fs.remove(g360Dir);
    await manifest.remove(targetDir);
    console.log(chalk.green('\n✅ G360 assets cleaned successfully!\n'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
}

function getAssetsToClean(dir, baseDir = dir) {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      items.push(...getAssetsToClean(fullPath, baseDir));
    } else {
      items.push(relativePath);
    }
  }
  
  return items;
}
