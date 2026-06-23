#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { signature } from './commands/signature.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = fs.readJsonSync(path.join(__dirname, '../package.json'));

const program = new Command();

program
  .name('g360')
  .description('CLI tool for bootstrapping G360 ecosystem projects')
  .version(pkg.version);

program
  .command('init')
  .argument('<name>', 'Project name')
  .option('-t, --template <type>', 'Project template type', 'web-pwa')
  .option('-s, --skill <skill>', 'Skill to use (corporativo, corporativo-movil, moderno, moderno-movil, minimalista, custom, flet-desktop, flet-desktop-corporativo, cipsa, cipsa-movil)', 'corporativo-movil')
  .option('-d, --dir <path>', 'Target directory', '.')
  .option('--dry-run', 'Preview without creating files')
  .option('--force', 'Overwrite existing files')
  .option('--portable', 'Create portable version (for python-flet, python-cli)')
  .option('--no-portable', 'Skip portable version creation')
  .action(init);

program
  .command('set-skill')
  .argument('<skill>', 'Skill name to set')
  .option('--verbose', 'Show detailed output')
  .option('--force', 'Overwrite existing skill')
  .action(setSkill);

program
  .command('bring')
  .argument('[asset]', 'Asset to bring: brand, brand/cipsa, brand/g360, components, templates, skills, all')
  .option('-p, --path <path>', 'Target path', '.')
  .option('--dry-run', 'Preview without copying')
  .option('--force', 'Overwrite existing files')
  .action(bring);

program
  .command('list')
  .argument('[type]', 'Type to list (templates/components/skills/snippets/brands/all)', 'all')
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
  .option('--github', 'Prepare repo for GitHub (update .gitignore)')
  .option('--pre-push', 'Alias for --github (prepare before push)')
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
  .option('-s, --skill <skill>', 'Skill to apply (corporativo, corporativo-movil, moderno, moderno-movil, minimalista, custom, flet-desktop, flet-desktop-corporativo, cipsa, cipsa-movil)', 'corporativo-movil')
  .option('--dry-run', 'Preview without applying')
  .option('--restructure', 'Restructure project files')
  .option('--force', 'Force dangerous changes')
  .option('--backup', 'Create backup before converting')
  .action(convert);

program
  .command('signature')
  .argument('<command>', 'Command to execute: install, positions')
  .description('Install g360-signature branding component')
  .option('-p, --path <path>', 'Target project path', '.')
  .option('--force', 'Force reinstall if already exists')
  .option('-m, --mode <mode>', 'Signature mode: own or powered', 'powered')
  .option('-v, --version <version>', 'Version to display')
  .option('--position <position>', 'Signature position: bottom-right, bottom-left, bottom-center, footer-right, footer-left', 'bottom-right')
  .option('-i, --interactive', 'Interactive mode with guided suggestions')
  .action(signature);

program.parse();
