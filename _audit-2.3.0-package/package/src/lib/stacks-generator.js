/**
 * Genera STACKS.md desde stacks.json
 * El Markdown es legible por humanos; el JSON es la fuente de verdad.
 * Un test verifica que ambos estén sincronizados.
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STACKS_JSON = path.join(__dirname, '..', 'config', 'stacks.json');
const STACKS_MD_TEMPLATE = path.join(__dirname, '..', 'config', 'STACKS.md.template');

/**
 * Lee stacks.json y genera el contenido markdown.
 */
export function generateStacksMd(stacksJson) {
  const { version, lastReview, stacks } = stacksJson;
  const entries = Object.entries(stacks).sort((a, b) => a[1].slug.localeCompare(b[1].slug));

  let md = `# Stacks G360\n\n`;
  md += `> **Fuente de verdad:** \`src/assets/config/stacks.json\` — editar solo ahí.\n`;
  md += `> Este archivo se genera automáticamente con \`node scripts/gen-stacks-md.js\`.\n\n`;
  md += `- Versión del catálogo: **${version}**\n`;
  md += `- Última revisión: **${lastReview}**\n\n`;
  md += `---\n\n`;

  // Resumen por status
  const byStatus = {};
  for (const [, s] of entries) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }
  md += `## Resumen\n\n`;
  md += `- Recomendados: ${byStatus.recommended ?? 0}\n`;
  md += `- Mantenidos: ${byStatus.maintained ?? 0}\n`;
  md += `- Experimentales: ${byStatus.experimental ?? 0}\n`;
  md += `- Obsoletos: ${byStatus.deprecated ?? 0}\n\n`;
  md += `---\n\n`;

  // Tabla
  md += `| Stack | Status | Dominio | Cuándo usar | Cuándo no usar |\n`;
  md += `|---|---|---|---|---|\n`;
  for (const [id, s] of entries) {
    const statusEmoji = {
      recommended: '✅',
      maintained: '🟢',
      experimental: '🧪',
      deprecated: '⚠️',
    }[s.status] || '⚪';
    md += `| \`${s.slug}\` | ${statusEmoji} ${s.status} | ${s.domain} | ${s.whenToUse ?? '—'} | ${s.whenNotToUse ?? '—'} |\n`;
  }
  md += `\n---\n\n`;

  // Detalle por stack
  for (const [id, s] of entries) {
    md += `## ${s.name} (\`${s.slug}\`)\n\n`;
    md += `- **Status:** ${s.status}${s.exception ? ` — excepción: ${s.exception}` : ''}\n`;
    if (s.successor) md += `- **Successor:** \`${s.successor}\`\n`;
    if (s.reviewBy) md += `- **ReviewBy:** ${s.reviewBy}\n`;
    md += `- **Dominio:** ${s.domain}\n`;
    md += `- **Versiones objetivo:** \`${JSON.stringify(s.targetVersions)}\`\n`;
    if (s.whenToUse) md += `- **When to use:** ${s.whenToUse}\n`;
    if (s.whenNotToUse) md += `- **When not to use:** ${s.whenNotToUse}\n`;
    if (s.visualVerification) md += `- **Verificación visual:** ${s.visualVerification}\n`;
    md += `\n`;
  }

  return md;
}

/**
 * Genera STACKS.md desde stacks.json y lo escribe en la ruta indicada.
 */
export async function generateStacksMdFile(outputPath) {
  const json = await fs.readJson(STACKS_JSON);
  const md = generateStacksMd(json);
  await fs.writeFile(outputPath, md, 'utf8');
  return { json, md };
}

/**
 * Verifica que STACKS.md exista y sea coherente con stacks.json.
 * Retorna { ok: boolean, issues: string[] }.
 */
export async function verifyStacksSync(outputPath) {
  const issues = [];
  const json = await fs.readJson(STACKS_JSON);

  if (!await fs.pathExists(outputPath)) {
    issues.push(`STACKS.md no existe en ${outputPath}`);
    return { ok: false, issues };
  }

  const existing = await fs.readFile(outputPath, 'utf8');
  const regenerated = generateStacksMd(json);

  if (existing.trim() !== regenerated.trim()) {
    issues.push('STACKS.md desincronizado respecto a stacks.json — ejecutar gen-stacks-md.js');
  }

  // Validar campos requeridos
  for (const [id, s] of Object.entries(json.stacks)) {
    if (!s.slug) issues.push(`${id}: falta slug`);
    if (!s.status) issues.push(`${id}: falta status`);
    if (!['recommended', 'maintained', 'experimental', 'deprecated'].includes(s.status)) {
      issues.push(`${id}: status inválido "${s.status}"`);
    }
    if (!s.domain) issues.push(`${id}: falta domain`);
    if (!s.targetVersions) issues.push(`${id}: falta targetVersions`);
    if (s.status === 'deprecated' && !s.successor) {
      issues.push(`${id}: deprecated sin successor`);
    }
    if (s.status === 'experimental' && !s.reviewBy) {
      issues.push(`${id}: experimental sin reviewBy`);
    }
  }

  return { ok: issues.length === 0, issues };
}

if (process.argv[1]?.endsWith('gen-stacks-md.js')) {
  const outPath = process.argv[2] || path.join(__dirname, '..', '..', 'STACKS.md');
  const { md } = await generateStacksMdFile(outPath);
  console.log(`Generated ${outPath} (${md.split('\n').length} lines)`);
}
