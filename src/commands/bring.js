import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { progress } from '../lib/progress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INGESTION_FILES = [
  { src: 'ingestion/core/ingestion.py', dest: 'src/core/ingestion.py' },
  { src: 'ingestion/core/__init__.py', dest: 'src/core/__init__.py' },
  { src: 'ingestion/ui/ingestion_panel.py', dest: 'src/ui/ingestion_panel.py' },
  { src: 'ingestion/ui/__init__.py', dest: 'src/ui/__init__.py' },
];

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

  if (asset === 'ingestion') {
    return installIngestion(targetDir, dryRun, force);
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

async function installIngestion(targetDir, dryRun, force) {
  const assetsPath = path.join(__dirname, '../assets');
  const ingestionDir = path.join(assetsPath, 'ingestion');

  if (!fs.existsSync(ingestionDir)) {
    console.error(chalk.red('❌ Ingestion asset not found in package.'));
    return;
  }

  const hasFlet = (
    fs.existsSync(path.join(targetDir, 'pyproject.toml')) &&
    fs.existsSync(path.join(targetDir, 'src', 'main.py'))
  );

  if (!hasFlet) {
    console.error(chalk.red('❌ This command requires a G360 Flet project.'));
    console.log(chalk.gray('   Run "g360 init <name> --template python-flet" first.'));
    return;
  }

  const srcCore = path.join(targetDir, 'src', 'core');
  const srcUi = path.join(targetDir, 'src', 'ui');

  if (!fs.existsSync(srcCore)) {
    if (!dryRun) fs.mkdirpSync(srcCore);
    console.log(chalk.gray('   Created src/core/'));
  }
  if (!fs.existsSync(srcUi)) {
    if (!dryRun) fs.mkdirpSync(srcUi);
    console.log(chalk.gray('   Created src/ui/'));
  }

  if (dryRun) {
    console.log(chalk.yellow('\n📋 DRY RUN - Would install:'));
    for (const f of INGESTION_FILES) {
      console.log(chalk.gray(`   ${f.dest}`));
    }
    return;
  }

  console.log(chalk.cyan('\n📦 Option A — Install via pip (recommended):'));
  console.log(chalk.white('     pip install g360-core'));

  const progressBar = progress('Installing local fallback files...');

  try {
    let copied = 0;
    for (const f of INGESTION_FILES) {
      const srcFile = path.join(assetsPath, f.src);
      const destFile = path.join(targetDir, f.dest);

      if (fs.existsSync(destFile) && !force) {
        console.log(chalk.yellow(`\n⚠ ${f.dest} exists. Use --force to overwrite.`));
        continue;
      }

      await fs.copy(srcFile, destFile, { overwrite: force });
      copied++;
    }

    progressBar.stop();

    if (copied > 0) {
      console.log(chalk.green(`\n✅ ${copied} local fallback file(s) installed\n`));
      console.log(chalk.gray('   These files are used when g360-core pip package is not available.'));
      console.log(chalk.cyan('\n   Import (auto-detects pip package → local fallback):'));
      console.log(chalk.white('     from ui.ingestion_panel import IngestionPanel'));
    }

    console.log(chalk.cyan('\n   Or add to your pyproject.toml:'));
    console.log(chalk.white('     "g360-core>=0.1.0"'));
  } catch (error) {
    progressBar.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
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
