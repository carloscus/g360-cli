import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ADDON_REGISTRY = {
  '@google/design.md': {
    name: 'Google Design System',
    type: 'design-system',
    install: async (targetDir) => {
      const addonDir = path.join(targetDir, 'g360', 'addons', 'google-design');
      fs.mkdirpSync(addonDir);
      
      const indexContent = {
        name: 'google-design',
        source: '@google/design.md',
        installedAt: new Date().toISOString(),
        files: [
          'tokens.json',
          'components.css',
          'md3.css'
        ]
      };
      
      fs.writeJsonSync(path.join(addonDir, 'addon.json'), indexContent, { spaces: 2 });
      return addonDir;
    }
  },
  '@m3/material': {
    name: 'Material 3',
    type: 'design-system',
    install: async (targetDir) => {
      const addonDir = path.join(targetDir, 'g360', 'addons', 'm3-material');
      fs.mkdirpSync(addonDir);
      fs.writeJsonSync(path.join(addonDir, 'addon.json'), {
        name: 'm3-material',
        source: '@m3/material',
        installedAt: new Date().toISOString()
      }, { spaces: 2 });
      return addonDir;
    }
  }
};

export async function addon(command, options) {
  const { package: pkg, path: targetPath = '.', dryRun = false, force = false } = options;
  
  console.log(chalk.bold.cyan('\n📦 G360 Addon Manager\n'));
  
  if (command === 'install' || command === 'add') {
    return installAddon(pkg, targetPath, dryRun, force);
  }
  
  if (command === 'list') {
    return listAddons(targetPath);
  }
  
  if (command === 'remove' || command === 'uninstall') {
    return removeAddon(pkg, targetPath, force);
  }
  
  console.log(chalk.yellow('Usage:'));
  console.log(chalk.gray('  g360 addon install <package>'));
  console.log(chalk.gray('  g360 addon list'));
  console.log(chalk.gray('  g360 addon remove <package>'));
}

async function installAddon(pkg, targetPath, dryRun, force) {
  if (!pkg) {
    console.error(chalk.red('❌ Package name required'));
    console.log(chalk.gray('\nAvailable addons:'));
    Object.entries(ADDON_REGISTRY).forEach(([key, value]) => {
      console.log(chalk.gray(`  - ${key} (${value.name})`));
    });
    return;
  }
  
  const targetDir = path.resolve(process.cwd(), targetPath);
  const addonDir = path.join(targetDir, 'g360', 'addons', pkg.replace('@', '').replace('/', '-'));
  
  if (fs.existsSync(addonDir) && !force) {
    console.error(chalk.red(`❌ Addon "${pkg}" already installed`));
    console.log(chalk.gray('Use --force to reinstall'));
    return;
  }
  
  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN - Would install:'));
    console.log(chalk.gray(`  Package: ${pkg}`));
    console.log(chalk.gray(`  Target: ${addonDir}`));
    return;
  }
  
  const registryEntry = ADDON_REGISTRY[pkg];
  
  try {
    fs.mkdirpSync(addonDir);
    
    if (registryEntry?.install) {
      await registryEntry.install(targetDir);
    } else {
      fs.writeJsonSync(path.join(addonDir, 'addon.json'), {
        name: pkg,
        source: pkg,
        installedAt: new Date().toISOString(),
        type: 'external'
      }, { spaces: 2 });
    }
    
    const manifestPath = path.join(targetDir, 'g360', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = fs.readJsonSync(manifestPath);
      if (!manifest.addons) manifest.addons = [];
      manifest.addons.push({ name: pkg, installedAt: new Date().toISOString() });
      fs.writeJsonSync(manifestPath, manifest, { spaces: 2 });
    }
    
    console.log(chalk.green(`\n✅ Addon "${pkg}" installed successfully`));
    console.log(chalk.gray(`   Location: ${addonDir}`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error installing addon: ${error.message}`));
  }
}

async function listAddons(targetPath) {
  const targetDir = path.resolve(process.cwd(), targetPath);
  const addonsDir = path.join(targetDir, 'g360', 'addons');
  
  if (!fs.existsSync(addonsDir)) {
    console.log(chalk.gray('No addons installed'));
    return;
  }
  
  const addons = fs.readdirSync(addonsDir);
  
  if (addons.length === 0) {
    console.log(chalk.gray('No addons installed'));
    return;
  }
  
  console.log(chalk.bold.yellow('\n📦 Installed Addons:'));
  for (const addon of addons) {
    const addonJsonPath = path.join(addonsDir, addon, 'addon.json');
    if (fs.existsSync(addonJsonPath)) {
      const addonData = fs.readJsonSync(addonJsonPath);
      console.log(chalk.gray(`  - ${addonData.name || addon}`));
      console.log(chalk.gray(`    Source: ${addonData.source || 'external'}`));
      console.log(chalk.gray(`    Installed: ${addonData.installedAt || 'unknown'}`));
    }
  }
}

async function removeAddon(pkg, targetPath, force) {
  if (!pkg) {
    console.error(chalk.red('❌ Package name required'));
    return;
  }
  
  const targetDir = path.resolve(process.cwd(), targetPath);
  const addonDir = path.join(targetDir, 'g360', 'addons', pkg.replace('@', '').replace('/', '-'));
  
  if (!fs.existsSync(addonDir)) {
    console.error(chalk.red(`❌ Addon "${pkg}" not found`));
    return;
  }
  
  try {
    fs.removeSync(addonDir);
    
    const manifestPath = path.join(targetDir, 'g360', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = fs.readJsonSync(manifestPath);
      if (manifest.addons) {
        manifest.addons = manifest.addons.filter(a => a.name !== pkg);
        fs.writeJsonSync(manifestPath, manifest, { spaces: 2 });
      }
    }
    
    console.log(chalk.green(`\n✅ Addon "${pkg}" removed successfully`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error removing addon: ${error.message}`));
  }
}