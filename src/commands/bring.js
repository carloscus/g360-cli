import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { progress } from '../lib/progress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function bring(asset, options) {
  const { path: targetPath = '.', dryRun = false, force = false } = options;
  const targetDir = path.join(process.cwd(), targetPath);
  const assetsPath = path.join(__dirname, '../assets');
  
  console.log(chalk.bold.cyan('\n📦 G360 Asset Manager\n'));

  if (!asset || asset === 'all') {
    console.log(chalk.yellow('Bringing all G360 assets...\n'));
    return copyAssets(assetsPath, targetDir, dryRun, force);
  }

  const assetPath = path.join(assetsPath, asset);
  
  if (!fs.existsSync(assetPath)) {
    console.error(chalk.red(`❌ Asset "${asset}" not found.`));
    console.log(chalk.gray('\nRun "g360 list assets" to see available assets.'));
    return;
  }

  await copyAssets(assetPath, targetDir, dryRun, force);
}

async function copyAssets(src, dest, dryRun, force) {
  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN - No files will be copied\n'));
    return;
  }

  const progressBar = progress('Copying assets...');
  
  try {
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, 'g360', item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        await fs.copy(srcPath, destPath, { overwrite: force });
      }
    }
    
    progressBar.stop();
    console.log(chalk.green('\n✅ Assets copied successfully!\n'));
  } catch (error) {
    progressBar.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
}
