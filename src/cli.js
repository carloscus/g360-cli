#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from './commands/init.js';
import { setSkill } from './commands/set-skill.js';
import { bring } from './commands/bring.js';
import { list } from './commands/list.js';
import { present } from './commands/present.js';
import { audit } from './commands/audit.js';
import { clean } from './commands/clean.js';
import { health } from './commands/health.js';
import { update } from './commands/update.js';
import { convert } from './commands/convert.js';

const program = new Command();

program
  .name('g360')
  .description('CLI tool for bootstrapping G360 ecosystem projects')
  .version('1.0.0');

program
  .command('init')
  .argument('<name>', 'Project name')
  .option('-t, --template <type>', 'Project template type', 'web-pwa')
  .option('-s, --skill <skill>', 'Skill to use (corporativo, corporativo-movil, moderno, moderno-movil, minimalista, custom)', 'corporativo-movil')
  .option('-d, --dir <path>', 'Target directory', '.')
  .option('--dry-run', 'Preview without creating files')
  .option('--force', 'Overwrite existing files')
  .action(init);

program
  .command('set-skill')
  .argument('<skill>', 'Skill name to set')
  .option('--verbose', 'Show detailed output')
  .option('--force', 'Overwrite existing skill')
  .action(setSkill);

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
  .option('--dead', 'Remove dead/deprecated files')
  .option('--duplicates', 'Remove duplicate files')
  .option('--orphans', 'Remove orphan files (unreferenced)')
  .option('--organize', 'Show misplaced files suggestions')
  .option('--all', 'Run all cleanup tasks')
  .action(clean);

program
  .command('health')
  .option('--verbose', 'Show detailed health info')
  .action(health);

program
  .command('update')
  .option('--check', 'Check for updates without installing')
  .action(update);

program
  .command('convert')
  .argument('[path]', 'Path to convert', '.')
  .option('-s, --skill <skill>', 'Skill to apply', 'corporativo-movil')
  .option('--dry-run', 'Preview without applying')
  .option('--restructure', 'Restructure project files')
  .option('--force', 'Force dangerous changes')
  .option('--backup', 'Create backup before converting')
  .action(convert);

program.parse();
