import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export async function present(projectPath, options) {
  const { depth = 3 } = options;
  const targetDir = path.join(process.cwd(), projectPath);
  
  console.log(chalk.bold.cyan('\n🗂️  G360 Project Structure\n'));
  console.log(chalk.gray(`Path: ${targetDir}\n`));

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Path not found: ${targetDir}`));
    return;
  }

  const manifestPath = path.join(targetDir, 'g360-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(chalk.yellow('📋 Project Info:'));
    console.log(chalk.gray(`  Name: ${manifest.name || 'Unknown'}`));
    console.log(chalk.gray(`  Template: ${manifest.template || 'Unknown'}`));
    console.log(chalk.gray(`  Version: ${manifest.version || 'Unknown'}\n`));
  }

  console.log(chalk.yellow('📁 Structure:'));
  printTree(targetDir, '', parseInt(depth), true);
  console.log();
}

function printTree(dir, prefix, depth, isRoot) {
  if (depth < 0) return;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = items.filter(i => i.isDirectory() && !i.name.startsWith('.') && i.name !== 'node_modules');
  const files = items.filter(i => i.isFile() && !i.name.startsWith('.'));

  dirs.forEach((dirItem, index) => {
    const isLast = index === dirs.length - 1 && files.length === 0;
    const connector = isLast ? '└── ' : '├── ';
    console.log(chalk.cyan(`${prefix}${connector}${dirItem.name}/`));
    
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    printTree(path.join(dir, dirItem.name), newPrefix, depth - 1, false);
  });

  files.forEach((fileItem, index) => {
    const isLast = index === files.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const ext = path.extname(fileItem.name);
    const color = ['.json', '.js', '.jsx', '.ts', '.tsx'].includes(ext) ? chalk.white : chalk.gray;
    console.log(color(`${prefix}${connector}${fileItem.name}`));
  });
}
