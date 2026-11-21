/**
 * Comando g360 registry: descubrimiento de APIs y consumers del ecosistema.
 */
import chalk from 'chalk';
import { getCatalog, validateEcosystem, getConsumersOf } from '../lib/ecosystem-catalog.js';

const PAD_REPO = 32;
const PAD_ROLE = 14;

export async function registry(options = {}) {
  const { schema, external, cross } = options;
  if (schema) return showSchema(schema);
  if (external !== undefined) return listExternals(external);
  if (cross) return showCross(cross);
  listRegistry();
}

function pad(s, n) { return String(s).padEnd(n); }

function listRegistry() {
  const cat = getCatalog();
  const repos = cat.repos || {};
  console.log(chalk.bold.cyan(String.fromCharCode(10) + String.fromCharCode(128269) + ' G360 Registry -- Ecosistema' + String.fromCharCode(10) + String.fromCharCode(10)));
  console.log(chalk.gray('Version: ' + cat.version + ' | Updated: ' + cat.lastUpdated + String.fromCharCode(10)));
  const val = validateEcosystem();
  if (!val.valid) {
    console.log(chalk.yellow(String.fromCharCode(10) + 'Issues found in catalog:' + String.fromCharCode(10)));
    val.issues.forEach(function(i) { console.log(chalk.yellow('  - [' + i.rule + '] ' + i.repo + ': ' + i.message)); });
    console.log('');
  }
  console.log(chalk.bold(pad('Repo', PAD_REPO)) + '  ' + chalk.bold(pad('Role', PAD_ROLE)) + '  ' + chalk.bold('Dependencias'));
  console.log(chalk.gray('-'.repeat(PAD_REPO + PAD_ROLE + 40)));
  for (const [name, info] of Object.entries(repos).sort((a,b) => a[0].localeCompare(b[0]))) {
    var st = info.status === 'experimental' ? chalk.yellow('~') : chalk.green(String.fromCharCode(10003));
    var deps = (info.depends_on || []).length > 0 ? info.depends_on.map(function(d){return chalk.cyan(d);}).join(', ') : chalk.gray(String.fromCharCode(8212));
    console.log(chalk.white(pad(name, PAD_REPO)) + '  ' + pad(info.role || '?', PAD_ROLE) + '  ' + deps + ' ' + st);
  }
  var ext = cat.externals || {};
  var ek = Object.keys(ext);
  if (ek.length > 0) {
    console.log(chalk.bold.yellow(String.fromCharCode(10) + 'Externos registrados:' + String.fromCharCode(10)));
    for (const [n, info] of Object.entries(ext).sort()) {
      var c = (info.consumes || []).map(function(a){return chalk.cyan(a);}).join(', ');
      console.log(chalk.white(pad(n, PAD_REPO)) + '  ' + pad(info.status || '?', PAD_ROLE) + '  ' + c + (info.notes ? ' -- ' + info.notes : ''));
    }
  }
  var ac = Object.values(repos).filter(function(r){return r.role==='api';}).length;
  var pc = Object.values(repos).filter(function(r){return r.role==='provider';}).length;
  var appc = Object.values(repos).filter(function(r){return r.role==='app';}).length;
  console.log(chalk.gray(String.fromCharCode(10) + Object.keys(repos).length + ' repos | ' + pc + ' providers | ' + ac + ' apis | ' + appc + ' apps | ' + ek.length + ' externos' + String.fromCharCode(10)));
}

function showSchema(repoName) {
  var repo = getCatalog().repos && getCatalog().repos[repoName];
  if (!repo) { console.log(chalk.red('No encontrado: ' + repoName)); return; }
  console.log(chalk.bold.cyan(String.fromCharCode(10) + 'Schema: ' + repoName + String.fromCharCode(10)));
  console.log('  Role:     ' + repo.role);
  console.log('  Status:   ' + (repo.status || String.fromCharCode(8212)));
  console.log('  Deps:     ' + ((repo.depends_on || []).join(', ') || String.fromCharCode(8212)));
  console.log('  Desc:     ' + (repo.descripcion || String.fromCharCode(8212)));
}

function listExternals(showAll) {
  var ext = getCatalog().externals || {};
  var names = Object.keys(ext).sort();
  if (names.length === 0) { console.log(chalk.yellow('  No hay externals.' + String.fromCharCode(10))); return; }
  if (!showAll) {
    console.log(chalk.bold.cyan('  Externos:' + String.fromCharCode(10)));
    names.forEach(function(n) { console.log(chalk.white('    ' + n)); });
    console.log(chalk.gray(String.fromCharCode(10) + '  Total: ' + names.length + String.fromCharCode(10)));
    return;
  }
  console.log(chalk.bold.cyan('  Detalle:' + String.fromCharCode(10)));
  for (var i=0;i<names.length;i++){
    var n = names[i]; var info = ext[n];
    console.log(chalk.bold('  ' + n));
    console.log('    Consumes: ' + (info.consumes || []).join(', '));
    console.log('    Notes:    ' + (info.notes || String.fromCharCode(8212)));
    console.log('');
  }
}

function showCross(apiNames) {
  var arr = Array.isArray(apiNames) ? apiNames : [apiNames];
  console.log(chalk.bold.cyan(String.fromCharCode(10) + 'Cross-API: ' + arr.join(' x ') + String.fromCharCode(10)));
  for (var i=0;i<arr.length;i++){
    var api = arr[i];
    var consumers = getConsumersOf(api);
    if (consumers.length) console.log(chalk.cyan('  ' + api + ' -> ' + consumers.join(', ')));
    else console.log(chalk.gray('  ' + api + ' (sin consumidores internos)'));
  }
  console.log('');
}
