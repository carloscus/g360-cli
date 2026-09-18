/**
 * Gate de publicacion: valida assets y archivos publicados antes de `npm publish`.
 * Uso: node scripts/validate-assets.js (falla con exit 1 si algo no cumple).
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { assetValidator } from '../src/lib/asset-validator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let failed = false;
function fail(msg) {
  console.error(`❌ ${msg}`);
  failed = true;
}
function ok(msg) {
  console.log(`✅ ${msg}`);
}

const pkg = fs.readJsonSync(path.join(ROOT, 'package.json'));

// 1. Skills contra schema
const skills = fs.readJsonSync(path.join(ROOT, 'src/assets/config/g360-skills.json'));
const r1 = await assetValidator.validateSkills(skills);
if (r1.valid) ok(`skills-schema: ${skills.skills.length} skills validos`);
else fail(`skills-schema: ${r1.errors.join('; ')}`);

// 2. Snippets contra schema
const snippetsPath = path.join(ROOT, 'src/assets/snippets/snippets.json');
if (fs.existsSync(snippetsPath)) {
  const snippets = fs.readJsonSync(snippetsPath);
  const r2 = await assetValidator.validateSnippets(snippets);
  if (r2.valid) ok(`snippets-schema: ${snippets.snippets.length} snippets validos`);
  else fail(`snippets-schema: ${r2.errors.join('; ')}`);
}

// 3. Archivos declarados en `files` existen en disco
const positives = (pkg.files || []).filter((f) => !f.startsWith('!'));
for (const f of positives) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) fail(`files: falta en disco "${f}"`);
}
if (!failed) ok(`files: ${positives.length} entradas verificadas en disco`);

// 4. Version sincronizada (package.json <-> opencode-config.json)
const ocPath = path.join(ROOT, 'opencode-config.json');
if (fs.existsSync(ocPath)) {
  const oc = fs.readJsonSync(ocPath);
  if (oc.version === pkg.version) ok(`version: ${pkg.version} sincronizada`);
  else fail(`version: package.json=${pkg.version} vs opencode-config.json=${oc.version}`);
}

if (failed) {
  console.error('\n⛔ validate-assets: publicacion bloqueada. Corrige los errores.');
  process.exit(1);
}
console.log('\n✅ validate-assets: listo para publicar.');
