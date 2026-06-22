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
    console.log(chalk.gray('\nRun "g360 list all" to see available assets.'));
    return;
  }

  await copyAssets(assetPath, targetDir, dryRun, force);

  if (asset.startsWith('brand')) {
    const brandName = asset.split('/')[1];
    if (brandName) {
      await applyBrand(targetDir, brandName, dryRun);
    }
  }
}

async function applyBrand(targetDir, brandName, dryRun) {
  const brandConfigPath = path.join(targetDir, 'g360', 'brand', 'brand.json');
  if (!fs.existsSync(brandConfigPath)) {
    console.log(chalk.yellow(`\n⚠ brand.json not found. Run 'g360 bring brand' first.`));
    return;
  }

  let brandConfig;
  try {
    brandConfig = fs.readJsonSync(brandConfigPath);
  } catch {
    console.log(chalk.yellow(`\n⚠ Could not parse brand.json.`));
    return;
  }

  const brand = brandConfig.brands?.[brandName];
  if (!brand) {
    console.log(chalk.yellow(`\n⚠ Brand "${brandName}" not found in brand.json`));
    return;
  }

  const skillCandidates = [
    path.join(targetDir, 'skill.json'),
    path.join(targetDir, 'src', 'core', 'skill.json'),
  ];

  let skillPath = null;
  for (const c of skillCandidates) {
    if (fs.existsSync(c)) {
      skillPath = c;
      break;
    }
  }

  if (!skillPath) {
    console.log(chalk.yellow(`\n⚠ No skill.json found. Create one with 'g360 init'.`));
    return;
  }

  if (dryRun) {
    console.log(chalk.yellow(`\n📋 DRY RUN - Would update ${skillPath}`));
    return;
  }

  const skill = fs.readJsonSync(skillPath);
  skill.brand = brandName;

  if (!skill.guidelines) skill.guidelines = {};
  skill.guidelines.logo = brand.default_logo;
  skill.guidelines.description = brand.description;

  if (brand.signature) {
    if (!skill.signature) skill.signature = {};
    skill.signature.mode = brand.signature.mode;
    skill.signature.text = brand.signature.text;
  }

  if (brand.primary_color) {
    if (!skill.colors) skill.colors = {};
    skill.colors.accent = brand.primary_color;
  }

  fs.writeJsonSync(skillPath, skill, { spaces: 2 });
  console.log(chalk.green(`\n✅ Brand "${brandName}" applied to ${skillPath}`));
  console.log(chalk.gray(`   Logo: ${brand.default_logo}`));
  console.log(chalk.gray(`   Signature: ${brand.signature?.text || 'none'}`));
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
