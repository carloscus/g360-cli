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
    skills: [],
    brands: []
  };

  const templatesPath = path.join(assetsPath, 'templates');
  const componentsPath = path.join(assetsPath, 'components');
  const configPath = path.join(assetsPath, 'config');
  const snippetsPath = path.join(assetsPath, 'snippets');
  const brandPath = path.join(assetsPath, 'brand');

  if (fs.existsSync(templatesPath)) {
    assets.templates = fs.readdirSync(templatesPath);
  }
  if (fs.existsSync(componentsPath)) {
    assets.components = fs.readdirSync(componentsPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  }
  
  if (fs.existsSync(configPath)) {
    const g360SkillsPath = path.join(configPath, 'g360-skills.json');
    if (fs.existsSync(g360SkillsPath)) {
      try {
        const skillsData = fs.readJsonSync(g360SkillsPath);
        assets.skills = skillsData.skills.map(skill => ({
          name: skill.name,
          description: skill.description,
          device: skill.device
        }));
      } catch (error) {
        console.log(chalk.yellow(`Warning: Could not read skills config: ${error.message}`));
      }
    }
  }
  
  if (fs.existsSync(snippetsPath)) {
    const snippetsJsonPath = path.join(snippetsPath, 'snippets.json');
    if (fs.existsSync(snippetsJsonPath)) {
      try {
        const snippetsData = fs.readJsonSync(snippetsJsonPath);
        assets.snippets = snippetsData.snippets.map(snippet => ({
          name: snippet.name,
          description: snippet.description,
          language: snippet.language
        }));
      } catch (error) {
        console.log(chalk.yellow(`Warning: Could not read snippets config: ${error.message}`));
      }
    }
  }

  if (fs.existsSync(brandPath)) {
    const brandConfigPath = path.join(brandPath, 'brand.json');
    if (fs.existsSync(brandConfigPath)) {
      try {
        const brandData = fs.readJsonSync(brandConfigPath);
        assets.brands = Object.entries(brandData.brands || {}).map(([key, val]) => ({
          name: key,
          description: val.description,
          logo: val.default_logo
        }));
      } catch (error) {
        console.log(chalk.yellow(`Warning: Could not read brand config: ${error.message}`));
      }
    }
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
    if (assets.skills.length) {
      assets.skills.forEach(skill => {
        console.log(chalk.gray(`  - ${skill.name}`));
        console.log(chalk.gray(`    ${skill.description}`));
        console.log(chalk.gray(`    Device: ${skill.device}`));
      });
    } else {
      console.log(chalk.gray('  No skills found'));
    }
  }

  if (!type || type === 'all' || type === 'brands') {
    console.log(chalk.bold.yellow('\n🎨 Brands:'));
    if (assets.brands.length) {
      assets.brands.forEach(b => console.log(chalk.gray(`  - ${b.name}`)));
    } else {
      console.log(chalk.gray('  No brands found'));
    }
  }

  if (!type || type === 'all' || type === 'snippets') {
    console.log(chalk.bold.yellow('\n📝 Snippets:'));
    if (assets.snippets && assets.snippets.length) {
      assets.snippets.forEach(snippet => {
        console.log(chalk.gray(`  - ${snippet.name}`));
        console.log(chalk.gray(`    ${snippet.description}`));
        console.log(chalk.gray(`    Language: ${snippet.language}`));
      });
    } else {
      console.log(chalk.gray('  No snippets found'));
    }
  }

  console.log();
}
