/**
 * @file set-skill.js
 * @description Comando para seleccionar/cambiar skill del proyecto
 * @author @carloscus
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_PATH = path.resolve(__dirname, '../assets/config/g360-skills.json');

export async function setSkill(skillName, options = {}) {
  const { verbose = false, cwd = process.cwd(), force = false } = options;
  const isInternalCall = options.cwd !== undefined;
  
  if (!isInternalCall) {
    console.log(chalk.bold.cyan('\n🎨 G360 Skill Selector\n'));
  }
  
  // Cargar skills disponibles
  let skillsConfig;
  try {
    skillsConfig = await fs.readJson(SKILLS_PATH);
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
  const skillJsonPath = path.join(cwd, 'skill.json');
  
  if (fs.existsSync(skillJsonPath)) {
    if (!force) {
      console.log(chalk.yellow('⚠️  El proyecto ya tiene un skill configurado.'));
      console.log(chalk.gray('Usar --force para sobrescribir'));
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
      theme: skill.theme ?? 'dark',
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      colors: skill.colors,
      signature: skill.signature
    };

    // Variantes de tema propias del skill (si declara).
    if (skill.light) skillData.light = skill.light;
    if (skill.dark) skillData.dark = skill.dark;
    
    await fs.writeJson(skillJsonPath, skillData, { spaces: 2 });

    // Reemitir los tokens del proyecto con el skill nuevo (CSS/Go/Rust/Python).
    const { refreshTokens } = await import('./tokens.js');
    const written = refreshTokens(cwd, { skill: skillName });

    if (!isInternalCall) {
      console.log(chalk.green(`\n✅ Skill "${skillName}" configurado correctamente`));
      console.log(chalk.gray('\nDetalles:'));
      console.log(`  Device: ${skill.device}`);
      console.log(`  Accent: ${skill.colors.accent}`);
      console.log(`  Signature: ${skill.signature.mode}`);
      if (written.length > 0) {
        console.log(chalk.gray(`  Tokens: ${written.map((item) => item.file).join(', ')}`));
      }

      if (verbose) {
        console.log(chalk.gray('\nColores:'));
        Object.entries(skill.colors).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error al guardar skill: ${error.message}`));
  }
}

export default { setSkill };
