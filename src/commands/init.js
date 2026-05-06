import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { manifest } from '../lib/manifest.js';
import { progress } from '../lib/progress.js';
import { setSkill } from './set-skill.js';
import inquirer from 'inquirer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORTABLE_TEMPLATES = ['python-flet', 'python-flet-migrate', 'python-cli', 'python-customtkinter'];

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
    template = 'web-pwa',
    skill = 'corporativo-movil',
    dir = '.',
    dryRun = false,
    force = false,
    portable = null
  } = options;

  const targetDir = path.join(process.cwd(), dir, name);

  console.log(chalk.bold.cyan('\n🚀 G360 Project Initialization\n'));
  console.log(`Project: ${chalk.yellow(name)}`);
  console.log(`Template: ${chalk.blue(template)}`);
  console.log(`Skill: ${chalk.magenta(skill)}`);
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
    console.log(chalk.gray('Next steps:'));
    console.log(`  ${chalk.cyan('cd')} ${name}`);
    console.log(`  ${chalk.cyan('g360 bring')}`);
    console.log(`  ${chalk.cyan('g360 present')}\n`);
} catch (error) {
    progressBar.stop();
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
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
