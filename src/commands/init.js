import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { manifest } from '../lib/manifest.js';
import { progress } from '../lib/progress.js';
import { setSkill } from './set-skill.js';
import { bring } from './bring.js';
import inquirer from 'inquirer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORTABLE_TEMPLATES = ['python-flet', 'python-flet-migrate', 'python-flet-polished', 'python-cli', 'python-customtkinter'];

// Templates por defecto segun skill (mapeo automatico)
const TEMPLATE_DEFAULTS = {
  'flet-desktop': 'python-flet-polished',
  'flet-desktop-corporativo': 'python-flet-polished',
  'flet-desktop-polished': 'python-flet-polished',
  'cipsa': 'python-flet-polished',
  'cipsa-movil': 'python-flet-polished',
  'corporativo': 'web-pwa',
  'corporativo-movil': 'web-pwa',
  'corporativo-g360': 'web-pwa',
  'corporativo-g360-movil': 'web-pwa',
  'moderno': 'web-pwa',
  'moderno-movil': 'web-pwa',
  'minimalista': 'python-cli',
  'custom': 'web-pwa',
};

async function askPortableOption(template) {
  if (!PORTABLE_TEMPLATES.includes(template)) {
    return false;
  }

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'portable',
      message: '¿Deseas crear una versión portable del proyecto? (ejecutable standalone)',
      default: false
    }
  ]);

  return answers.portable;
}

export async function init(name, options) {
  const {
    template: rawTemplate,
    skill = 'corporativo-movil',
    dir = '.',
    dryRun = false,
    force = false,
    portable = null,
    brand = false,
  } = options;

  // Resolver template: usar default segun skill si no se especifico
  let template = rawTemplate || TEMPLATE_DEFAULTS[skill] || 'web-pwa';

  // Advertir si se usa template legacy
  if (template === 'python-flet') {
    console.log(chalk.yellow('⚠️  Template "python-flet" esta deprecado. Se usara "python-flet-polished" (estandar actual).\n'));
    template = 'python-flet-polished';
  }

  // Si el template es auto, usar default segun skill
  if (template === 'auto') {
    template = TEMPLATE_DEFAULTS[skill] || 'web-pwa';
  }

  const targetDir = path.join(process.cwd(), dir, name);

  // Leer version del CLI desde package.json
  const cliPkgPath = path.join(__dirname, '..', '..', 'package.json');
  let cliVersion = '1.0.0';
  try {
    const cliPkg = fs.readJsonSync(cliPkgPath);
    cliVersion = cliPkg.version || '1.0.0';
  } catch {
    // fallback si no se puede leer
  }

  console.log(chalk.bold.cyan('\n🚀 G360 Project Initialization\n'));
  console.log(`Project: ${chalk.yellow(name)}`);
  console.log(`Template: ${chalk.blue(template)}`);
  console.log(`Skill: ${chalk.magenta(skill)}`);
  console.log(`CLI Version: ${chalk.gray(cliVersion)}`);
  console.log(`Target: ${chalk.gray(targetDir)}\n`);

  let wantPortable = false;

  if (portable === true) {
    wantPortable = true;
    console.log(chalk.yellow('📦 Versión portable: SÍ (flag)\n'));
  } else if (portable === false) {
    console.log(chalk.gray('📦 Versión portable: NO\n'));
  } else {
    wantPortable = await askPortableOption(template);
    if (wantPortable) {
      console.log(chalk.yellow('📦 Versión portable: SÍ\n'));
    }
  }

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
    await fs.ensureDir(path.dirname(targetDir));

    await fs.copy(templateDir, targetDir);
    await manifest.init(targetDir, { name, template, version: '1.0.0', portable: wantPortable });

    if (wantPortable) {
      const portableDir = path.join(targetDir, 'portable');
      await fs.ensureDir(portableDir);
      const buildScript = path.join(targetDir, 'build-portable.bat');
      if (fs.existsSync(buildScript)) {
        await fs.copy(buildScript, path.join(portableDir, 'build.bat'));
      }
      console.log(chalk.gray('  📦 Carpeta portable/ creada para builds\n'));
    }

    await setSkill(skill, { force: true, verbose: options.verbose, cwd: targetDir });

    await createG360Structure(targetDir, templatesPath);

    progressBar.stop();

    console.log(chalk.green('\n✅ Project created successfully!\n'));
    if (wantPortable) {
      console.log(chalk.yellow('📦 Versión portable habilitada\n'));
    }

    let appliedBrand = false;
    if (brand) {
      appliedBrand = true;
      console.log(chalk.bold.cyan('\n🔖 Aplicando marca G360\n'));
      await applyBrandToProject(targetDir, skill, dryRun);
    } else if (!dryRun) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'applyBrand',
          message: '¿Deseas aplicar la marca G360 (logo, colores, firma) al proyecto?',
          default: true,
        },
      ]);
      if (answers.applyBrand) {
        appliedBrand = true;
        console.log(chalk.bold.cyan('\n🔖 Aplicando marca G360\n'));
        await applyBrandToProject(targetDir, skill, dryRun);
      }
    }

    console.log(chalk.gray('\nNext steps:'));
    console.log(`  ${chalk.cyan('cd')} ${name}`);
    console.log(`  ${chalk.cyan('g360 present')}`);
    if (!appliedBrand) {
      console.log(`  ${chalk.cyan('g360 bring brand')}    # Aplicar marca G360`);
    }
    console.log(`  ${chalk.cyan('g360 audit')}`);
    console.log();
} catch (error) {
    progressBar.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
}

async function applyBrandToProject(targetDir, skill, dryRun) {
  const brandName = skill?.includes('cipsa') ? 'cipsa' : 'g360';
  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] Would apply brand: ${brandName}`));
    return;
  }
  try {
    await bring(brandName, { path: targetDir, dryRun: false, force: false });
    console.log(chalk.green(`  ✅ Marca "${brandName}" aplicada`));
  } catch (error) {
    console.log(chalk.yellow(`  ⚠ No se pudo aplicar la marca: ${error.message}`));
  }
}

async function createG360Structure(projectPath, assetsDir) {
  try {
    const g360Dir = path.join(projectPath, 'g360');
    await fs.ensureDir(g360Dir);
    
    const subdirs = ['skills', 'snippets', 'samples', 'config', 'engine'];
    for (const dir of subdirs) {
      await fs.ensureDir(path.join(g360Dir, dir));
    }
    
    const skillJsonPath = path.join(g360Dir, 'skill.json');
    if (!fs.existsSync(skillJsonPath)) {
      const exampleSkillPath = path.join(assetsDir, 'config/skills.json');
      if (fs.existsSync(exampleSkillPath)) {
        await fs.copy(exampleSkillPath, skillJsonPath);
      }
    }
    
    const snippetsDir = path.join(g360Dir, 'snippets');
    const exampleSnippetsPath = path.join(assetsDir, 'snippets/snippets.json');
    if (fs.existsSync(exampleSnippetsPath) && !fs.existsSync(path.join(snippetsDir, 'snippets.json'))) {
      await fs.copy(exampleSnippetsPath, path.join(snippetsDir, 'snippets.json'));
    }
    
  } catch (error) {
    console.log(chalk.yellow(`Warning: Could not create G360 structure: ${error.message}`));
  }
}
