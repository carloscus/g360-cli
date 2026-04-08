/**
 * @file set-skill.js
 * @description Comando para seleccionar/cambiar skill del proyecto
 * @author @carloscus
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const SKILLS_PATH = path.join(process.cwd(), 'g360-cli/src/assets/config/g360-skills.json');

export async function setSkill(skillName, options) {
  const { verbose = false } = options;
  
  console.log(chalk.bold.cyan('\n🎨 G360 Skill Selector\n'));
  
  // Cargar skills disponibles
  let skillsConfig;
  try {
    const cliPath = path.join(process.cwd(), 'g360-cli/src/assets/config/g360-skills.json');
    skillsConfig = await fs.readJson(cliPath);
  } catch (error) {
    console.error(chalk.red('❌ No se pudo cargar la configuración de skills'));
    return;
  }
  
  // Buscar skill seleccionado
  const skill = skillsConfig.skills.find(s => s.name === skillName);
  
  if (!skill) {
    console.error(chalk.red(`❌ Skill "${skillName}" no encontrado.`));
    console.log(chalk.gray('\nSkills disponibles:'));
    skillsConfig.skills.forEach(s => {
      console.log(chalk.gray(`  - ${s.name}`) + chalk.gray(` (${s.description})`));
    });
    return;
  }
  
  // Verificar si existe skill.json en el proyecto
  const skillJsonPath = path.join(process.cwd(), 'skill.json');
  
  if (fs.existsSync(skillJsonPath)) {
    console.log(chalk.yellow('⚠️  El proyecto ya tiene un skill configurado.'));
    console.log(chalk.gray('Usar --force para sobrescribir'));
    if (!options.force) {
      console.log(chalk.cyan('\nPara cambiar el skill:'));
      console.log(chalk.cyan('  g360 set-skill ') + skillName + chalk.cyan(' --force'));
      return;
    }
  }
  
  // Guardar skill
  try {
    const skillData = {
      skill: skill.name,
      device: skill.device,
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      colors: skill.colors,
      signature: skill.signature
    };
    
    await fs.writeJson(skillJsonPath, skillData, { spaces: 2 });
    
    console.log(chalk.green(`\n✅ Skill "${skillName}" configurado correctamente`));
    console.log(chalk.gray('\nDetalles:'));
    console.log(`  Device: ${skill.device}`);
    console.log(`  Accent: ${skill.colors.accent}`);
    console.log(`  Signature: ${skill.signature.mode}`);
    
    if (verbose) {
      console.log(chalk.gray('\nColores:'));
      Object.entries(skill.colors).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error al guardar skill: ${error.message}`));
  }
}

export default { setSkill };
