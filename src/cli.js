#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { bring } from './commands/bring.js';
import { list } from './commands/list.js';
import { present } from './commands/present.js';
import { audit } from './commands/audit.js';
import { clean } from './commands/clean.js';
import { health } from './commands/health.js';
import { update } from './commands/update.js';

const program = new Command();

program
  .name('g360')
  .description('CLI tool for bootstrapping G360 ecosystem projects')
  .version('1.0.0');

program
  .command('init')
  .argument('<name>', 'Project name')
  .option('-t, --template <type>', 'Project template type', 'web-pwa')
  .option('-d, --dir <path>', 'Target directory', '.')
  .option('--dry-run', 'Preview without creating files')
  .option('--force', 'Overwrite existing files')
  .action(init);

program
  .command('bring')
  .argument('[asset]', 'Specific asset to bring (template/component/skill/all)')
  .option('-p, --path <path>', 'Target path', '.')
  .option('--dry-run', 'Preview without copying')
  .option('--force', 'Overwrite existing files')
  .action(bring);

program
  .command('list')
  .argument('[type]', 'Type to list (templates/components/skills/all)', 'all')
  .option('--json', 'Output as JSON')
  .action(list);

program
  .command('present')
  .argument('[path]', 'Project path to present', '.')
  .option('--depth <n>', 'Max depth to display', '3')
  .action(present);

program
  .command('audit')
  .argument('[path]', 'Path to audit', '.')
  .option('--fix', 'Auto-fix issues when possible')
  .option('--verbose', 'Show detailed output')
  .action(audit);

program
  .command('clean')
  .argument('[path]', 'Path to clean', '.')
  .option('--dry-run', 'Preview files to be removed')
  .option('--force', 'Skip confirmation')
  .action(clean);

program
  .command('health')
  .option('--verbose', 'Show detailed health info')
  .action(health);

program
  .command('update')
  .option('--check', 'Check for updates without installing')
  .action(update);

program.parse();
