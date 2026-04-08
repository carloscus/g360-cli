/**
 * @file convert.js
 * @description Comando para convertir proyecto existente a identidad G360
 * @author @carloscus
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRAMEWORK_INDICATORS = {
  lit: { deps: ['lit', '@lit/lit'], files: ['.js'] },
  react: { deps: ['react', 'react-dom'], files: ['.jsx', '.tsx'] },
  vue: { deps: ['vue'], files: ['.vue'] },
  solid: { deps: ['solid-js', 'solid-js/web'], files: ['.jsx', '.tsx'] },
  svelte: { deps: ['svelte'], files: ['.svelte'] },
  vanilla: { deps: [], files: [] }
};

const SAFE_CHANGES = ['create'];
const DANGEROUS_CHANGES = ['modify', 'delete', 'move', 'rename'];

export async function convert(targetPath, options) {
  const { 
    skill = 'corporativo-movil', 
    dryRun = false, 
    restructure = false,
    force = false,
    backup: createBackup = false 
  } = options;

  const projectPath = path.join(process.cwd(), targetPath);
  
  console.log(chalk.bold.cyan('\n🔄 G360 Convert - Proyecto a Identidad G360\n'));
  console.log(`Proyecto: ${chalk.yellow(projectPath)}`);
  console.log(`Skill: ${chalk.magenta(skill)}`);
  console.log(`Modo: ${chalk.gray(dryRun ? 'DRY RUN (sin cambios)' : 'LIVE')}`);
  if (restructure) console.log(`Restructure: ${chalk.yellow('SI')}`);
  console.log('');

  if (!fs.existsSync(projectPath)) {
    console.error(chalk.red(`❌ El directorio "${targetPath}" no existe.`));
    return;
  }

  try {
    const projectInfo = await analyzeProject(projectPath);
    projectInfo.force = force;
    
    console.log(chalk.cyan('📊 Análisis del proyecto:'));
    console.log(`  Framework: ${chalk.white(projectInfo.framework)}`);
    console.log(`  Archivos: ${chalk.white(projectInfo.totalFiles)}`);
    console.log(`  CSS: ${chalk.white(projectInfo.cssFiles)}`);
    console.log(`  Componentes: ${chalk.white(projectInfo.componentFiles)}`);
    console.log('');

    const skillConfig = await loadSkill(skill);
    
    if (!skillConfig) {
      console.error(chalk.red(`❌ Skill "${skill}" no encontrado.`));
      return;
    }

    const changes = planChanges(projectPath, projectInfo, skillConfig, restructure);
    
    const dangerousChanges = changes.filter(c => DANGEROUS_CHANGES.includes(c.type));
    const safeChanges = changes.filter(c => SAFE_CHANGES.includes(c.type));

    if (dangerousChanges.length > 0 && !dryRun && !force) {
      console.log(chalk.yellow(`⚠️  Cambios peligrosos detectados: ${dangerousChanges.length}`));
      dangerousChanges.forEach(c => console.log(`  - ${chalk.gray(c.description)}`));
      console.log(chalk.cyan('\nUsa --dry-run para ver detalles o --force para aplicar de todos modos.'));
      return;
    }

    if (dryRun) {
      console.log(chalk.bold.cyan('\n📋 PREVIEW - Cambios a aplicar:\n'));
      changes.forEach(c => {
        const color = c.type === 'create' ? chalk.green : c.type === 'modify' ? chalk.yellow : chalk.red;
        console.log(`  ${color('●')} ${c.type}: ${c.file}`);
        console.log(chalk.gray(`      ${c.description}`));
      });
      console.log(chalk.gray(`\n  Total: ${changes.length} cambios`));
      return;
    }

    if (createBackup) {
      console.log(chalk.cyan('💾 Creando backup...'));
      await createBackupFolder(projectPath);
      console.log(chalk.green('  ✓ Backup creado'));
    }

    console.log(chalk.cyan('\n🚀 Aplicando cambios...'));
    await applyChanges(projectPath, changes, skillConfig);
    
    console.log(chalk.bold.green('\n✅ Convert completado\n'));
    console.log(chalk.gray('Resumen:'));
    console.log(`  Archivos creados: ${chalk.green(safeChanges.length)}`);
    console.log(`  Archivos modificados: ${chalk.yellow(dangerousChanges.length)}`);
    console.log(`  Skill aplicado: ${chalk.magenta(skill)}`);
    console.log('');

    suggestFramework(projectInfo);

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  }
}

async function analyzeProject(projectPath) {
  const info = {
    framework: 'vanilla',
    cssFiles: 0,
    componentFiles: 0,
    totalFiles: 0,
    hasPackageJson: false,
    packageJson: null,
    files: []
  };

  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    info.hasPackageJson = true;
    info.packageJson = await fs.readJson(packageJsonPath);
    info.framework = detectFramework(info.packageJson);
  }

  const files = await getAllFiles(projectPath);
  info.totalFiles = files.length;
  
  files.forEach(f => {
    if (f.endsWith('.css')) info.cssFiles++;
    if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.svelte') || f.endsWith('.vue')) {
      info.componentFiles++;
    }
    info.files.push(f);
  });

  return info;
}

function detectFramework(packageJson) {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const depsKeys = Object.keys(deps).join(' ');

  for (const [name, indicator] of Object.entries(FRAMEWORK_INDICATORS)) {
    if (name === 'vanilla') continue;
    if (indicator.deps.some(d => depsKeys.includes(d))) {
      return name;
    }
  }
  return 'vanilla';
}

function suggestFramework(projectInfo) {
  console.log(chalk.cyan('\n💡 Sugerencia:'));
  
  const suggestions = {
    react: 'Para proyectos React, Lit sería más ligero y con el mismo rendimiento web components.',
    vue: 'Vue es excelente, pero Lit ofrece mejor portabilidad entre proyectos.',
    vanilla: 'Considera usar un template G360 (lit-web, solid-web) para mejor organización.',
    lit: '¡Ya usas Lit! Perfecto para integración con G360.',
    solid: 'Solid es muy performant, ideal para aplicaciones rápidas.',
    svelte: 'Svelte es excelente, los templates G360 lo soportan.'
  };

  console.log(chalk.gray(`  ${suggestions[projectInfo.framework] || 'Proyecto válido para G360.'}`));
  console.log('');
}

async function loadSkill(skillName) {
  const skillsPath = path.join(__dirname, '../assets/config/g360-skills.json');
  
  if (!fs.existsSync(skillsPath)) {
    throw new Error('g360-skills.json no encontrado');
  }

  const skillsConfig = await fs.readJson(skillsPath);
  const skill = skillsConfig.skills.find(s => s.name === skillName);
  
  if (!skill) {
    const available = skillsConfig.skills.map(s => s.name).join(', ');
    throw new Error(`Skill "${skillName}" no encontrado. Disponibles: ${available}`);
  }

  return skill;
}

function planChanges(projectPath, projectInfo, skillConfig, restructure) {
  const changes = [];
  const projectFiles = projectInfo.files.map(f => path.relative(projectPath, f).replace(/\\/g, '/'));
  const hasSkillJson = projectFiles.some(f => f.endsWith('skill.json'));
  const hasG360Theme = projectFiles.some(f => f.includes('g360-theme'));

  if (!hasSkillJson) {
    changes.push({
      type: 'create',
      file: 'src/core/skill.json',
      description: 'Archivo de configuración del skill G360'
    });
  }

  if (!hasG360Theme) {
    changes.push({
      type: 'create',
      file: 'src/styles/g360-theme.css',
      description: 'Theme dinámico con variables CSS del skill'
    });
  }

  const signatureComponents = projectInfo.files.filter(f => 
    (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.svelte')) &&
    (f.includes('component') || f.includes('App') || f.includes('root') || f.includes('index'))
  );

  signatureComponents.forEach(f => {
    const relPath = path.relative(projectPath, f);
    if (!projectFiles.some(pf => pf.includes('g360-signature') || pf.includes('G360Signature'))) {
      changes.push({
        type: 'modify',
        file: relPath,
        description: 'Agregar import de signature G360',
        dangerous: true
      });
    }
  });

  if (restructure) {
    changes.push({
      type: 'modify',
      file: 'package.json',
      description: 'Actualizar estructura y scripts (requiere revisión manual)',
      dangerous: true
    });
  }

  return changes;
}

async function applyChanges(projectPath, changes, skillConfig) {
  const coreDir = path.join(projectPath, 'src', 'core');
  const stylesDir = path.join(projectPath, 'src', 'styles');

  for (const change of changes) {
    if (change.type === 'create') {
      if (change.file.endsWith('skill.json')) {
        await fs.ensureDir(coreDir);
        const skillData = {
          skill: skillConfig.name,
          device: skillConfig.device,
          template: 'converted',
          version: '1.0.0',
          convertedAt: new Date().toISOString(),
          colors: skillConfig.colors,
          signature: skillConfig.signature
        };
        await fs.writeJson(path.join(coreDir, 'skill.json'), skillData, { spaces: 2 });
        console.log(chalk.green(`  ✓ Creado: ${change.file}`));
      }
      
      if (change.file.endsWith('g360-theme.css')) {
        await fs.ensureDir(stylesDir);
        const css = generateThemeCSS(skillConfig);
        await fs.writeFile(path.join(stylesDir, 'g360-theme.css'), css);
        console.log(chalk.green(`  ✓ Creado: ${change.file}`));
      }
    }

    if (change.type === 'modify' && !change.dangerous) {
      console.log(chalk.yellow(`  ⚠️  Omitido (peligroso): ${change.file}`));
    }
  }
}

function generateThemeCSS(skillConfig) {
  const { colors, effects } = skillConfig;
  
  return `/* ============================================
 * G360 Theme - Generado desde skill: ${skillConfig.name}
 * ============================================ */

:root {
  /* Colores G360 - ${skillConfig.name} */
  --g360-bg: ${colors.bg};
  --g360-surface: ${colors.surface};
  --g360-accent: ${colors.accent};
  --g360-text: ${colors.text};
  --g360-muted: ${colors.muted};
  
  /* Efectos */
  --g360-glass: ${effects.glassmorphism ? colors.surface + 'CC' : 'transparent'};
  --g360-blur: ${effects.blur};
  --g360-rounded: ${effects.rounded};
  
  /* Espaciado */
  --g360-space-xs: 4px;
  --g360-space-sm: 8px;
  --g360-space-md: 16px;
  --g360-space-lg: 24px;
  --g360-space-xl: 32px;
}

/* === ESTILOS BASE === */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--g360-bg);
  color: var(--g360-text);
}

/* === UTILIDADES === */
.g360-card {
  background: var(--g360-surface);
  border-radius: var(--g360-rounded);
  padding: var(--g360-space-md);
}

${effects.glassmorphism ? `.g360-glass {
  background: var(--g360-glass);
  backdrop-filter: blur(var(--g360-blur));
  -webkit-backdrop-filter: blur(var(--g360-blur));
}` : ''}

.g360-btn {
  background: var(--g360-accent);
  color: var(--g360-bg);
  border: none;
  border-radius: var(--g360-rounded);
  padding: var(--g360-space-sm) var(--g360-space-md);
  font-weight: 700;
  cursor: pointer;
}

/* === SIGNATURE === */
.g360-signature {
  color: var(--g360-muted);
  font-size: 12px;
  text-align: center;
  padding: var(--g360-space-md);
}

.g360-signature::after {
  content: "${skillConfig.signature.text}";
}
`;
}

async function createBackupFolder(projectPath) {
  const parentDir = path.dirname(projectPath);
  const projectName = path.basename(projectPath);
  const backupDir = path.join(parentDir, `${projectName}-g360-backup-${Date.now()}`);
  await fs.copy(projectPath, backupDir, {
    filter: (src) => !src.includes('node_modules') && !src.includes('.git')
  });
  console.log(chalk.gray(`  Backup en: ${backupDir}`));
}

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (item.name === 'node_modules' || item.name === '.git') continue;
    
    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

export default { convert };