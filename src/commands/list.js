import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function list(type, options) {
  const { json = false } = options;
  const assetsPath = path.join(__dirname, '../assets');
  
  console.log(chalk.bold.cyan('\n📋 G360 Assets\n'));

  const assets = {
    templates: [],
    components: [],
    skills: []
  };

  const templatesPath = path.join(assetsPath, 'templates');
  const componentsPath = path.join(assetsPath, 'components');
  const skillsPath = path.join(assetsPath, 'skills');
  const enginePath = path.join(assetsPath, 'engine');

  if (fs.existsSync(templatesPath)) {
    assets.templates = fs.readdirSync(templatesPath);
  }
  if (fs.existsSync(componentsPath)) {
    assets.components = fs.readdirSync(componentsPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  }
  if (fs.existsSync(skillsPath)) {
    assets.skills = fs.readdirSync(skillsPath).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
  }
  if (fs.existsSync(enginePath)) {
    assets.engine = fs.readdirSync(enginePath).filter(f => f.startsWith('g360-skill-'));
  }

  if (json) {
    console.log(JSON.stringify(assets, null, 2));
    return;
  }

  if (!type || type === 'all' || type === 'templates') {
    console.log(chalk.bold.yellow('\n📁 Templates:'));
    if (assets.templates.length) {
      assets.templates.forEach(t => console.log(chalk.gray(`  - ${t}`)));
    } else {
      console.log(chalk.gray('  No templates found'));
    }
  }

  if (!type || type === 'all' || type === 'components') {
    console.log(chalk.bold.yellow('\n🧩 Components:'));
    if (assets.components.length) {
      assets.components.forEach(c => console.log(chalk.gray(`  - ${c}`)));
    } else {
      console.log(chalk.gray('  No components found'));
    }
  }

  if (!type || type === 'all' || type === 'skills') {
    console.log(chalk.bold.yellow('\n⚡ Skills:'));
    if (assets.engine.length) {
      assets.engine.forEach(s => console.log(chalk.gray(`  - ${s}`)));
    } else {
      console.log(chalk.gray('  No skills found'));
    }
  }

  console.log();
}
