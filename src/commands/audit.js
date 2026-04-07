import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { auditor } from '../lib/auditor.js';

export async function audit(projectPath, options) {
  const { fix = false, verbose = false } = options;
  const targetDir = path.join(process.cwd(), projectPath);
  
  console.log(chalk.bold.cyan('\n🔍 G360 Project Audit\n'));
  console.log(chalk.gray(`Path: ${targetDir}\n`));

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Path not found: ${targetDir}`));
    return;
  }

  const results = await auditor.audit(targetDir, { verbose });

  console.log(chalk.yellow('📊 Audit Results:'));
  console.log(chalk.green(`  Passed: ${results.passed}`));
  console.log(chalk.red(`  Failed: ${results.failed}`));
  console.log(chalk.cyan(`  Warnings: ${results.warnings}\n`));

  if (results.issues.length > 0) {
    console.log(chalk.bold.yellow('Issues Found:'));
    results.issues.forEach(issue => {
      const icon = issue.severity === 'error' ? chalk.red('✗') : chalk.yellow('!');
      console.log(`  ${icon} ${chalk.gray(issue.file)}: ${issue.message}`);
    });
    console.log();
  }

  if (results.passed === results.total && results.warnings === 0) {
    console.log(chalk.green('✅ Project is G360 compliant!\n'));
  } else {
    console.log(chalk.yellow('⚠️  Some issues need attention.\n'));
  }

  if (fix) {
    console.log(chalk.cyan('Auto-fix not yet implemented.\n'));
  }
}
