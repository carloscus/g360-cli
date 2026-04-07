import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export const auditor = {
  async audit(projectDir, options = {}) {
    const { verbose = false } = options;
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
      issues: []
    };

    const checks = [
      { name: 'manifest', check: () => this.checkManifest(projectDir) },
      { name: 'structure', check: () => this.checkStructure(projectDir) },
      { name: 'config', check: () => this.checkConfig(projectDir) }
    ];

    for (const { name, check } of checks) {
      const result = await check();
      results.total++;
      
      if (result.status === 'pass') {
        results.passed++;
      } else if (result.status === 'fail') {
        results.failed++;
        results.issues.push({ ...result.issue, severity: 'error' });
      } else if (result.status === 'warn') {
        results.warnings++;
        results.issues.push({ ...result.issue, severity: 'warning' });
      }

      if (verbose && result.details) {
        console.log(chalk.gray(`  ${name}: ${result.details}`));
      }
    }

    return results;
  },

  checkManifest(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      return { status: 'pass', details: 'Manifest found' };
    }
    return { status: 'warn', issue: { file: 'g360-manifest.json', message: 'No manifest found' } };
  },

  checkStructure(projectDir) {
    const g360Dir = path.join(projectDir, 'g360');
    if (fs.existsSync(g360Dir)) {
      return { status: 'pass', details: 'G360 assets directory found' };
    }
    return { status: 'warn', issue: { file: 'g360/', message: 'No G360 assets found' } };
  },

  checkConfig(projectDir) {
    const configPath = path.join(projectDir, 'g360', 'config');
    if (fs.existsSync(configPath)) {
      return { status: 'pass', details: 'Config directory found' };
    }
    return { status: 'pass' };
  }
};
