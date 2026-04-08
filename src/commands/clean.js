/**
 * @file clean.js
 * @description Comando para limpiar código muerto, descontinuado y redundante
 * @author @carloscus
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEAD_PATTERNS = [
  'backup', 'backup-old', 'backups',
  'temp', 'tmp', '.tmp',
  'old', 'deprecated', 'archive',
  'unused', 'trash', 'garbage'
];

const DUPLICATE_EXTENSIONS = ['.bak', '.orig', '.swp', '.swo', '~'];

export async function clean(projectPath, options) {
  const { 
    dryRun = false, 
    force = false,
    dead = false,
    duplicates = false,
    orphans = false,
    organize = false,
    all = false 
  } = options;
  
  const targetDir = path.join(process.cwd(), projectPath);
  
  console.log(chalk.bold.cyan('\n🧹 G360 Clean - Limpeza de Proyecto\n'));
  console.log(chalk.gray(`Path: ${targetDir}\n`));

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Path no encontrado: ${targetDir}`));
    return;
  }

  const allFiles = await getAllFiles(targetDir);
  const issues = {
    dead: [],
    duplicates: [],
    orphans: [],
    misplaced: [],
    emptyDirs: []
  };

  if (dead || all) {
    console.log(chalk.cyan('🔍 Buscando archivos muertos/descontinuados...'));
    issues.dead = findDeadFiles(allFiles);
    console.log(chalk.gray(`  Encontrados: ${issues.dead.length}`));
  }

  if (duplicates || all) {
    console.log(chalk.cyan('🔍 Buscando duplicados...'));
    issues.duplicates = findDuplicateFiles(allFiles);
    console.log(chalk.gray(`  Encontrados: ${issues.duplicates.length}`));
  }

  if (orphans || all) {
    console.log(chalk.cyan('🔍 Buscando archivos huérfanos (sin referencias)...'));
    issues.orphans = await findOrphanFiles(targetDir, allFiles);
    console.log(chalk.gray(`  Encontrados: ${issues.orphans.length}`));
  }

  if (organize || all) {
    console.log(chalk.cyan('🔍 Analizando organización de componentes...'));
    issues.misplaced = analyzeFileOrganization(allFiles);
    console.log(chalk.gray(`  Encontrados: ${issues.misplaced.length}`));
  }

  console.log(chalk.cyan('🔍 Buscando carpetas vacías...'));
  issues.emptyDirs = findEmptyDirectories(targetDir);
  console.log(chalk.gray(`  Encontradas: ${issues.emptyDirs.length}`));

  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalIssues === 0) {
    console.log(chalk.green('\n✅ ¡Proyecto limpio! No se encontraron problemas.\n'));
    return;
  }

  console.log(chalk.bold.yellow(`\n⚠️  Problemas encontrados: ${totalIssues}\n`));

  if (issues.dead.length > 0) {
    console.log(chalk.bold.red('📁 Archivos muertos/descontinuados:'));
    issues.dead.forEach(f => console.log(chalk.gray(`  - ${f}`)));
  }

  if (issues.duplicates.length > 0) {
    console.log(chalk.bold.red('📋 Duplicados:'));
    issues.duplicates.forEach(f => console.log(chalk.gray(`  - ${f}`)));
  }

  if (issues.orphans.length > 0) {
    console.log(chalk.bold.yellow('🔗 Archivos huérfanos (sin referencias):'));
    issues.orphans.forEach(f => console.log(chalk.gray(`  - ${f}`)));
  }

  if (issues.misplaced.length > 0) {
    console.log(chalk.bold.cyan('📍 Archivos descolocados (sugerencias):'));
    issues.misplaced.forEach(f => console.log(chalk.gray(`  - ${f.file} → mover a ${f.suggested}`)));
  }

  if (issues.emptyDirs.length > 0) {
    console.log(chalk.bold.magenta('📂 Carpetas vacías:'));
    issues.emptyDirs.forEach(f => console.log(chalk.gray(`  - ${f}`)));
  }

  if (dryRun) {
    console.log(chalk.yellow('\n📋 DRY RUN - Usa --force para aplicar limpieza\n'));
    return;
  }

  if (!force) {
    console.log(chalk.yellow('\n⚠️  Usa --force para confirmar limpieza'));
    console.log(chalk.gray('O usa flags específicos: --dead, --duplicates, --orphans, --organize'));
    return;
  }

  console.log(chalk.cyan('\n🚀 Aplicando limpieza...'));
  
  let cleaned = 0;

  for (const file of issues.dead) {
    await fs.remove(path.join(targetDir, file));
    cleaned++;
  }

  for (const file of issues.duplicates) {
    await fs.remove(path.join(targetDir, file));
    cleaned++;
  }

  for (const dir of issues.emptyDirs) {
    await fs.remove(path.join(targetDir, dir));
    cleaned++;
  }

  console.log(chalk.green(`\n✅ Limpieza completada: ${cleaned} elementos eliminados\n`));
}

function findDeadFiles(files) {
  const dead = [];
  
  for (const file of files) {
    const lower = file.toLowerCase();
    const basename = path.basename(file).toLowerCase();
    
    if (DEAD_PATTERNS.some(p => lower.includes(p))) {
      dead.push(file);
      continue;
    }
    
    const ext = path.extname(file);
    if (DUPLICATE_EXTENSIONS.includes(ext)) {
      dead.push(file);
    }
  }
  
  return dead;
}

function findDuplicateFiles(files) {
  const byName = {};
  const duplicates = [];

  for (const file of files) {
    const name = path.basename(file).toLowerCase();
    const ext = path.extname(file);
    const baseName = name.replace(ext, '');
    
    const key = `${baseName}${ext}`;
    if (!byName[key]) {
      byName[key] = [];
    }
    byName[key].push(file);
  }

  for (const [key, paths] of Object.entries(byName)) {
    if (paths.length > 1) {
      const isCommonFile = ['index.js', 'index.jsx', 'index.ts', 'index.tsx'].includes(key.toLowerCase());
      if (!isCommonFile) {
        paths.slice(1).forEach(p => duplicates.push(p));
      }
    }
  }

  return duplicates;
}

async function findOrphanFiles(projectDir, allFiles) {
  const orphans = [];
  const sourceFiles = allFiles.filter(f => {
    const ext = path.extname(f);
    return ['.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue'].includes(ext);
  });

  const referencedFiles = new Set();

  for (const file of sourceFiles) {
    const fullPath = path.join(projectDir, file);
    if (!fs.existsSync(fullPath)) continue;
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const imported = match[1].replace(/^\.\/|\.\.\//g, '');
        const importedPath = path.join(path.dirname(file), imported);
        
        for (const f of allFiles) {
          if (f.includes(imported) || f.includes(imported + '.js') || f.includes(imported + '.jsx')) {
            referencedFiles.add(f);
          }
        }
      }
    } catch (e) {}
  }

  const components = sourceFiles.filter(f => {
    const name = path.basename(f);
    return /^[A-Z][a-zA-Z]*\.jsx?$/.test(name) || 
           /^[A-Z][a-zA-Z]*\.tsx?$/.test(name) ||
           /^[A-Z][a-zA-Z]*\.svelte$/.test(name) ||
           /^[A-Z][a-zA-Z]*\.vue$/.test(name);
  });

  for (const component of components) {
    if (!referencedFiles.has(component)) {
      orphans.push(component);
    }
  }

  return orphans;
}

function analyzeFileOrganization(files) {
  const misplaced = [];
  const structureRules = {
    'src/components': ['.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue'],
    'src/pages': ['.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue'],
    'src/utils': ['.js', '.ts'],
    'src/hooks': ['.js', '.ts'],
    'src/services': ['.js', '.ts'],
    'src/styles': ['.css', '.scss', '.less'],
    'src/assets': ['.png', '.jpg', '.svg', '.gif', '.webp']
  };

  const components = files.filter(f => {
    const name = path.basename(f);
    return /^[A-Z][a-zA-Z]*\.jsx?$/.test(name) || 
           /^[A-Z][a-zA-Z]*\.tsx?$/.test(name);
  });

  for (const comp of components) {
    const dir = path.dirname(comp);
    const parentDir = path.basename(dir);
    
    if (!dir.includes('src/components') && !dir.includes('component')) {
      misplaced.push({
        file: comp,
        suggested: 'src/components'
      });
    }
  }

  return misplaced;
}

function findEmptyDirectories(dir, baseDir = dir) {
  const empty = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (!item.isDirectory()) continue;
    if (item.name === 'node_modules' || item.name === '.git') continue;
    
    const fullPath = path.join(dir, item.name);
    const subItems = fs.readdirSync(fullPath);
    
    if (subItems.length === 0) {
      empty.push(path.relative(baseDir, fullPath));
    } else {
      empty.push(...findEmptyDirectories(fullPath, baseDir));
    }
  }

  return empty;
}

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'out', '.nuxt', 'coverage', '.cache'];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    if (ignoreDirs.includes(item.name)) continue;
    
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    
    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

export default { clean };