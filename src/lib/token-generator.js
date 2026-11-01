import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { contrastRatio, hueOf, luminance } from './accent-families.js';
import { detectEnvVars, walkFiles } from './env-detector.js';

/**
 * Generador de design tokens.
 *
 * Fuente unica: `src/assets/config/g360-skills.json` (skill + paleta) y
 * `src/assets/config/accent-families.json` (familias de acento).
 *
 * Antes, cada plantilla repetia la paleta a mano (4 CSS + 3 temas Python +
 * 25 snippets), y `g360 set-accent` solo reescribia `skill.json`: las
 *styles se quedaban con el verde original. Con esta capa, la familia de
 * acento llega a TODOS los stacks y los componentes quedan simetricos.
 *
 * Roles emitidos (mismo nombre en todos los stacks):
 *   bg, surface, surfaceAlt, overlay, border, borderStrong,
 *   text, textMuted, textInverse,
 *   accent, accentStrong, accentBright, accentSoft, accentHover, onAccent,
 *   success, warning, error, info,
 *   glass, blur, radius, radiusSm,
 *   font, fontMono, fontSize,
 *   spaceXs, spaceSm, spaceMd, spaceLg, spaceXl
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(__dirname, '..', 'assets', 'config');
export const ASSETS_DIR = path.join(__dirname, '..', 'assets');
export const TEMPLATES_DIR = path.join(ASSETS_DIR, 'templates');

/** Paleta categorica por defecto (series de datos). */
const DEFAULT_CHART_PALETTE = {
  dark: ['#06b6d4', '#8b5cf6', '#0ea5e9', '#6366f1', '#ec4899', '#f59e0b', '#ef4444', '#f97316'],
  light: ['#0891b2', '#7c3aed', '#0284c7', '#4f46e5', '#db2777', '#b45309', '#dc2626', '#ea580c']
};

/** Roles y su valor por defecto (dark). */
export const TOKEN_ROLES = [
  'bg', 'surface', 'surfaceAlt', 'overlay',
  'border', 'borderStrong',
  'text', 'textMuted', 'textInverse',
  'accent', 'accentStrong', 'accentBright', 'accentSoft', 'accentHover', 'onAccent',
  'success', 'warning', 'error', 'info',
  'glass', 'blur', 'radius', 'radiusSm',
  'font', 'fontMono', 'fontSize',
  'spaceXs', 'spaceSm', 'spaceMd', 'spaceLg', 'spaceXl'
];

/** Valores que no dependen del color (tipografia, espaciado, efectos). */
const NEUTRAL_DEFAULTS = {
  surfaceAlt: '#1c2941',
  overlay: 'rgba(11, 18, 32, 0.90)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  textInverse: '#0b1220',
  glass: 'rgba(21, 30, 46, 0.75)',
  blur: '16px',
  radius: '16px',
  radiusSm: '8px',
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'Consolas', monospace",
  fontSize: '14px',
  spaceXs: '4px',
  spaceSm: '8px',
  spaceMd: '16px',
  spaceLg: '24px',
  spaceXl: '32px'
};

const NEUTRAL_DEFAULTS_LIGHT = {
  surfaceAlt: '#eef2f7',
  overlay: 'rgba(255, 255, 255, 0.92)',
  border: 'rgba(0, 0, 0, 0.10)',
  borderStrong: 'rgba(0, 0, 0, 0.18)',
  textInverse: '#ffffff',
  glass: 'rgba(255, 255, 255, 0.75)'
};

/** Contraste minimo (WCAG AA) para texto sobre fondo. */
export const MIN_CONTRAST = 4.5;

/** Destinos por stack. */
export const TOKEN_TARGETS = {
  web: 'src/styles/g360-tokens.css',
  tailwind: 'src/styles/g360-tokens.tailwind.css',
  python: 'src/core/g360_tokens.py',
  go: 'internal/theme/tokens.go',
  rust: 'src-tauri/src/theme.rs'
};

/**
 * @returns {{skills: Object[], families: Object, semantics: Object, bases: Object}}
 */
export function loadDesignConfig() {
  const skills = fs.readJsonSync(path.join(CONFIG_DIR, 'g360-skills.json')).skills ?? [];
  const accent = fs.readJsonSync(path.join(CONFIG_DIR, 'accent-families.json'));
  const charts = fs.readJsonSync(path.join(CONFIG_DIR, 'chart-palettes.json'));

  return {
    skills,
    families: accent.families ?? {},
    semantics: accent.semantics ?? {},
    bases: accent.bases ?? {},
    charts: charts.palettes ?? {},
    chartRoles: charts.roles ?? {}
  };
}

/**
 * Detecta la version mayor de Tailwind del proyecto (null si no usa Tailwind).
 * @param {string} projectDir - Directorio del proyecto
 * @returns {number|null} Version mayor
 */
export function detectTailwindVersion(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  try {
    const pkg = fs.readJsonSync(pkgPath);
    const declared = pkg.devDependencies?.tailwindcss ?? pkg.dependencies?.tailwindcss;
    if (!declared) return null;
    const major = parseInt(String(declared).replace(/[^\d.]/g, ''), 10);
    return Number.isNaN(major) ? null : major;
  } catch {
    return null;
  }
}

/**
 * Resuelve el juego de tokens canonico (dark + light) de un skill.
 * @param {Object} options - Opciones
 * @param {string} [options.skill] - Nombre del skill (g360-skills.json)
 * @param {string} [options.accentFamily] - Familia de acento a forzar
 * @param {Object} [options.config] - Config ya cargada (para tests)
 * @returns {Object} Tokens, efectos, firma y origen
 */
export function resolveTokens(options = {}) {
  const config = options.config ?? loadDesignConfig();
  const skillName = options.skill;
  const skill = skillName
    ? config.skills.find((item) => item.name === skillName)
    : null;

  // Un proyecto puede declarar un skill propio (nombre propio, paleta propia).
  // Si no esta en el catalogo pero trae colores, se usan esos.
  const projectColors = options.colors ?? null;

  if (skillName && !skill && !projectColors) {
    throw new Error(`Skill desconocido: "${skillName}". Disponibles: ${config.skills.map((s) => s.name).join(', ')}`);
  }

  const colors = projectColors ?? skill?.colors ?? {};
  const effects = skill?.effects ?? { glassmorphism: true, blur: '16px', rounded: '16px' };

  let familyName = options.accentFamily ?? skill?.accentFamily ?? null;
  let inferred = false;

  if (options.accentFamily && !config.families[options.accentFamily]) {
    // Familia pedida explicitamente y no existe: es un error de tipeo.
    throw new Error(`Familia de acento desconocida: "${options.accentFamily}"`);
  }

  if (!familyName || !config.families[familyName]) {
    // Sin familia valida: se infiere por tono del acento.
    familyName = inferFamily(colors.accent ?? '#00d084', config.families);
    inferred = true;
  }

  const family = config.families[familyName];

  if (!family) {
    throw new Error(`Familia de acento desconocida: "${familyName}"`);
  }

  const semantics = config.semantics ?? {};
  const baseDark = config.bases?.dark ?? { bg: '#0b1220', surface: '#151e2e', text: '#f0f4f8', muted: '#94a3b8' };
  const baseLight = config.bases?.light ?? { bg: '#ffffff', surface: '#f8fafc', text: '#1e293b', muted: '#64748b' };

  // Tema principal del skill: "dark" por defecto, "light" para los claros.
  // Si el proyecto no lo declara, se infiere del fondo (claro u oscuro).
  const primaryTheme = skill?.theme ?? inferTheme(colors.bg ?? baseDark.bg);
  const darkNeutral = skill?.dark ?? (primaryTheme === 'dark' ? colors : baseDark);
  const lightNeutral = skill?.light ?? (primaryTheme === 'light' ? colors : baseLight);

  const semanticDark = semantics.dark ?? semantics ?? {};
  const semanticLight = semantics.light ?? semantics ?? {};

  const dark = {
    ...NEUTRAL_DEFAULTS,
    bg: darkNeutral.bg ?? baseDark.bg,
    surface: darkNeutral.surface ?? baseDark.surface,
    text: darkNeutral.text ?? baseDark.text,
    textMuted: darkNeutral.muted ?? baseDark.muted,
    accent: family.accent,
    accentStrong: family.accentStrong,
    accentBright: family.accentBright,
    accentSoft: family.accentSoft,
    accentHover: family.accentBright,
    onAccent: family.onAccent,
    success: semanticDark.success ?? colors.success ?? '#22c55e',
    warning: semanticDark.warning ?? colors.warning ?? '#f59e0b',
    error: semanticDark.error ?? colors.error ?? '#ef4444',
    info: semanticDark.info ?? colors.info ?? '#3b82f6',
    blur: effects.blur ?? '16px',
    radius: effects.rounded ?? '16px',
    radiusSm: '8px'
  };

  const light = {
    ...NEUTRAL_DEFAULTS,
    ...NEUTRAL_DEFAULTS_LIGHT,
    bg: lightNeutral.bg ?? baseLight.bg,
    surface: lightNeutral.surface ?? baseLight.surface,
    text: lightNeutral.text ?? baseLight.text,
    textMuted: lightNeutral.muted ?? baseLight.muted,
    accent: family.accentLight ?? family.accent,
    accentStrong: family.accentLight ?? family.accentStrong,
    accentBright: family.accent,
    accentSoft: family.accentSoft,
    accentHover: family.accentLight ?? family.accentStrong,
    onAccent: family.onAccentLight ?? family.onAccent,
    success: semanticLight.success ?? '#15803d',
    warning: semanticLight.warning ?? '#b45309',
    error: semanticLight.error ?? '#dc2626',
    info: semanticLight.info ?? '#0369a1'
  };

  const tokens = {
    dark,
    light,
    chart: {
      dark: config.charts?.g360?.dark ?? DEFAULT_CHART_PALETTE.dark,
      light: config.charts?.g360?.light ?? DEFAULT_CHART_PALETTE.light
    },
    effects,
    signature: skill?.signature ?? { mode: 'powered', text: 'powered by G360' },
    skill: skill?.name ?? skillName ?? null,
    accentFamily: familyName,
    accentFamilyInferred: inferred,
    theme: primaryTheme
  };

  tokens.issues = validateTokens(tokens);

  return tokens;
}

/**
 * Infiere el tema (dark/light) a partir del color de fondo.
 * @param {string} bg - Color de fondo
 * @returns {'dark'|'light'}
 */
export function inferTheme(bg) {
  if (!bg || !bg.startsWith('#') || bg.length < 7) return 'dark';
  return luminance(bg) > 0.45 ? 'light' : 'dark';
}

/**
 * Elige la familia de acento mas cercana por tono (hue).
 * @param {string} accent - Color del acento
 * @param {Object} families - Familias disponibles
 * @returns {string} Nombre de la familia
 */
export function inferFamily(accent, families) {
  if (!accent || !accent.startsWith('#')) return 'emerald';

  const hue = hueOf(accent);
  let best = 'emerald';
  let bestDistance = Infinity;

  for (const [name, family] of Object.entries(families)) {
    const distance = Math.min(Math.abs(hue - family.hue), 360 - Math.abs(hue - family.hue));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }

  return best;
}

/**
 * Valida los pares de color que importan (WCAG AA) en cada tema.
 * @param {Object} tokens - Tokens resueltos
 * @returns {string[]} Avisos legibles
 */
export function validateTokens(tokens) {
  const issues = [];

  for (const mode of ['dark', 'light']) {
    const values = tokens[mode];
    const pairs = [
      ['text', 'bg'],
      ['textMuted', 'bg'],
      ['accent', 'bg'],
      ['onAccent', 'accent'],
      ['success', 'bg'],
      ['warning', 'bg'],
      ['error', 'bg'],
      ['info', 'bg']
    ];

    for (const [foreground, background] of pairs) {
      const ratio = contrastRatio(values[foreground], values[background]);
      if (ratio >= MIN_CONTRAST) continue;

      // El acento puede apoyarse en su tono bright: es la regla documentada.
      if (foreground === 'accent' && values.accentBright
        && contrastRatio(values.accentBright, values[background]) >= MIN_CONTRAST) {
        issues.push(
          `${mode}: accent/bg ${ratio.toFixed(2)} < ${MIN_CONTRAST} `
          + `(usar accentBright: ${contrastRatio(values.accentBright, values[background]).toFixed(2)})`
        );
        continue;
      }

      issues.push(`${mode}: ${foreground}/${background} ${ratio.toFixed(2)} < ${MIN_CONTRAST}`);
    }
  }

  return issues;
}

/**
 * Alias CSS: nombres que ya usaban las plantillas y proyectos existentes.
 * Se emiten junto al nombre canonico para no romper nada.
 */
export const CSS_ALIASES = {
  textMuted: ['muted'],
  radius: ['rounded']
};

/**
 * Normaliza un color a hex en minuscula (rgba queda igual).
 * @param {string} value - Color
 * @returns {string}
 */
function normalizeColor(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/#([0-9a-fA-F]{3,8})\b/g, (_, hex) => `#${hex.toLowerCase()}`);
}

/**
 * Emite las custom properties CSS.
 *
 * Cada rol se emite dos veces: el valor oscuro como fallback y despues
 * `light-dark()` (Chrome 123+, Safari 17.5+, Firefox 120+). Si el navegador
 * no soporta `light-dark()`, la declaracion invalida y queda el fallback.
 *
 * El tema lo decide `color-scheme`: `dark light` sigue la preferencia del
 * sistema, y un toggle de app se hace con `html[data-theme="light"]`.
 *
 * @param {Object} tokens - Tokens resueltos
 * @returns {string} Contenido CSS
 */
export function renderCss(tokens) {
  const block = (values, indent = '  ') => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .flatMap((role) => {
      const lines = [];
      const dark = normalizeColor(values[role]);
      const light = normalizeColor(tokens.light[role]);
      lines.push(`${indent}--g360-${kebab(role)}: ${dark};`);
      if (dark !== light) {
        // CSS: light-dark(<valor en tema claro>, <valor en tema oscuro>).
        lines.push(`${indent}--g360-${kebab(role)}: light-dark(${light}, ${dark});`);
      }
      for (const alias of CSS_ALIASES[role] ?? []) {
        lines.push(`${indent}--g360-${alias}: ${dark};`);
      }
      return lines;
    })
    .join('\n');

  const chartBlock = (values, indent = '  ') => (values ?? [])
    .flatMap((color, index) => {
      const dark = normalizeColor(color);
      const light = normalizeColor(tokens.chart?.light?.[index] ?? color);
      const lines = [`${indent}--g360-chart-${index + 1}: ${dark};`];
      if (dark !== light) {
        lines.push(`${indent}--g360-chart-${index + 1}: light-dark(${light}, ${dark});`);
      }
      return lines;
    })
    .join('\n');

  return `/* ============================================
 * G360 Design Tokens
 * Generado por \`g360 tokens\` — no editar a mano.
 * Skill: ${tokens.skill ?? 'default'} | acento: ${tokens.accentFamily} | tema: ${tokens.theme ?? 'dark'}
 *
 * Tema: \`color-scheme\` decide. \`dark light\` = sigue al sistema.
 * Toggle manual: <html data-theme="light"> (o "dark").
 * ============================================ */

:root {
  color-scheme: dark light;

${block(tokens.dark)}
${chartBlock(tokens.chart?.dark)}
}

html[data-theme="light"] { color-scheme: light; }
html[data-theme="dark"] { color-scheme: dark; }
`;
}

/**
 * Emite el bloque `@theme` de Tailwind v4 (CSS-first: el tema vive en CSS,
 * no en un tailwind.config.js). Importar este archivo despues de "tailwindcss".
 * @param {Object} tokens - Tokens resueltos
 * @returns {string} Contenido CSS
 */
export function renderTailwindTheme(tokens) {
  const colorRoles = TOKEN_ROLES.filter((role) => !['font', 'fontMono', 'fontSize', 'blur', 'radius', 'radiusSm', 'spaceXs', 'spaceSm', 'spaceMd', 'spaceLg', 'spaceXl'].includes(role));

  const colors = colorRoles
    .filter((role) => tokens.dark[role] !== undefined)
    .map((role) => `  --color-g360-${kebab(role)}: var(--g360-${kebab(role)});`)
    .join('\n');

  const chart = (tokens.chart?.dark ?? [])
    .map((_, index) => `  --color-g360-chart-${index + 1}: var(--g360-chart-${index + 1});`)
    .join('\n');

  return `/* ============================================
 * G360 Design Tokens — tema Tailwind v4
 * Generado por \`g360 tokens\` — no editar a mano.
 *
 * Uso (en el CSS principal del proyecto):
 *   @import "tailwindcss";
 *   @import "./styles/g360-tokens.tailwind.css";
 *
 * A partir de aca: bg-g360-accent, text-g360-muted, border-g360-border, ...
 * ============================================ */

@theme {
${colors}
${chart}

  --font-g360: var(--g360-font);
  --font-g360-mono: var(--g360-font-mono);
  --radius-g360: var(--g360-radius);
  --radius-g360-sm: var(--g360-radius-sm);
  --spacing-g360-xs: var(--g360-space-xs);
  --spacing-g360-sm: var(--g360-space-sm);
  --spacing-g360-md: var(--g360-space-md);
  --spacing-g360-lg: var(--g360-space-lg);
  --spacing-g360-xl: var(--g360-space-xl);
}
`;
}
/**
 * Emite un modulo Python con el snapshot de tokens.
 * @param {Object} tokens - Tokens resueltos
 * @returns {string} Contenido Python
 */
export function renderPython(tokens) {
  const dict = (values) => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .map((role) => `    "${role}": ${JSON.stringify(values[role])},`)
    .join('\n');

  const chartDict = ['dark', 'light']
    .map((mode) => `        "${mode}": [${(tokens.chart?.[mode] ?? []).map((color) => JSON.stringify(color)).join(', ')}],`)
    .join('\n');

  return `"""G360 Design Tokens.

Generado por \`g360 tokens\` â€” no editar a mano.
Snapshot estatico: tras cambiar la familia de acento, regenerar con
\`g360 tokens --project <ruta>\`.

Los roles son los mismos que en CSS, Go y Rust, para que los componentes
sean simetricos entre stacks.
"""

SKILL = ${JSON.stringify(tokens.skill)}
ACCENT_FAMILY = ${JSON.stringify(tokens.accentFamily)}

TOKENS = {
    "dark": {
${dict(tokens.dark)}
    },
    "light": {
${dict(tokens.light)}
    },
    "chart": {
${chartDict}
    },
}
`;
}

/**
 * Emite constantes Go.
 * @param {Object} tokens - Tokens resueltos
 * @returns {string} Contenido Go
 */
export function renderGo(tokens) {
  const consts = (values) => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .map((role) => `    ${goConst(role)} = ${JSON.stringify(values[role])}`)
    .join('\n');

  const pairs = (values) => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .map((role) => `\t${JSON.stringify(role)}: ${JSON.stringify(values[role])},`)
    .join('\n');

  const chartConsts = (values) => (values ?? [])
    .map((color, index) => `    Chart${index + 1} = ${JSON.stringify(color)}`)
    .join('\n');

  const chartPairs = (values) => (values ?? [])
    .map((color, index) => `\t${JSON.stringify(`chart${index + 1}`)}: ${JSON.stringify(color)},`)
    .join('\n');

  return `// Package theme contiene los design tokens de G360.
//
// Generado por \`g360 tokens\` â€” no editar a mano.
// Skill: ${tokens.skill ?? 'default'} | acento: ${tokens.accentFamily}
package theme

// Tokens del tema oscuro (default).
const (
${consts(tokens.dark)}
)

// Tokens del tema claro.
const (
${consts(tokens.light).replace(/^/gm, '    ')}
)

// Paleta categorica para series de datos (tema oscuro).
const (
${chartConsts(tokens.chart?.dark)}
)

// Paleta categorica para series de datos (tema claro).
const (
${chartConsts(tokens.chart?.light).replace(/^/gm, '    ')}
)

// Dark devuelve el mapa de tokens del tema oscuro.
func Dark() map[string]string {
	return map[string]string{
${pairs(tokens.dark)}
${chartPairs(tokens.chart?.dark)}
	}
}

// Light devuelve el mapa de tokens del tema claro.
func Light() map[string]string {
	return map[string]string{
${pairs(tokens.light)}
${chartPairs(tokens.chart?.light)}
	}
}
`;
}

/**
 * Emite constantes Rust.
 * @param {Object} tokens - Tokens resueltos
 * @returns {string} Contenido Rust
 */
export function renderRust(tokens) {
  const consts = (values) => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .map((role) => `pub const ${rustConst(role)}: &str = ${JSON.stringify(values[role])};`)
    .join('\n');

  const pairs = (values) => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .map((role) => `    ("${role}", ${rustConst(role)}),`)
    .join('\n');

  const chartConsts = (values) => (values ?? [])
    .map((color, index) => `pub const CHART_${index + 1}: &str = ${JSON.stringify(color)};`)
    .join('\n');

  const chartPairs = (values) => (values ?? [])
    .map((color, index) => `    ("chart${index + 1}", CHART_${index + 1}),`)
    .join('\n');

  return `//! Design tokens de G360.
//!
//! Generado por \`g360 tokens\` â€” no editar a mano.
//! Skill: ${tokens.skill ?? 'default'} | acento: ${tokens.accentFamily}

/// Tokens del tema oscuro (default).
pub mod dark {
${consts(tokens.dark).replace(/^/gm, '    ')}
}

/// Tokens del tema claro.
pub mod light {
${consts(tokens.light).replace(/^/gm, '    ')}
}

/// Paleta categorica para series de datos (tema oscuro).
pub mod chart_dark {
${chartConsts(tokens.chart?.dark).replace(/^/gm, '    ')}
}

/// Paleta categorica para series de datos (tema claro).
pub mod chart_light {
${chartConsts(tokens.chart?.light).replace(/^/gm, '    ')}
}

/// Tokens del tema oscuro como pares (nombre, valor).
pub const DARK: &[(&str, &str)] = &[
${pairs(tokens.dark)}
${chartPairs(tokens.chart?.dark)}
];

/// Tokens del tema claro como pares (nombre, valor).
pub const LIGHT: &[(&str, &str)] = &[
${pairs(tokens.light)}
${chartPairs(tokens.chart?.light)}
];
`;
}

/**
 * Detecta los stacks presentes en un proyecto y el archivo destino de tokens.
 * @param {string} projectDir - Directorio del proyecto
 * @returns {Array<{stack: string, file: string}>} Destinos
 */
export function detectTokenTargets(projectDir) {
  const has = (rel) => fs.existsSync(path.join(projectDir, rel));
  const targets = [];

  // Python: si hay pyproject/requirements/main.py, es Python (aunque tenga src/).
  const isPython = has('pyproject.toml') || has('requirements.txt') || has('main.py') || has('run.py');
  // Web: package.json o index.html (un src/ solo no alcanza).
  const isWeb = has('package.json') || has('index.html');

  if (isWeb && !isPython) {
    targets.push({ stack: 'web', file: TOKEN_TARGETS.web });
  }
  if (isPython) {
    targets.push({ stack: 'python', file: TOKEN_TARGETS.python });
  }
  if (has('go.mod')) {
    targets.push({ stack: 'go', file: TOKEN_TARGETS.go });
  }
  if (has('Cargo.toml') || has('src-tauri')) {
    targets.push({ stack: 'rust', file: TOKEN_TARGETS.rust });
  }

  return targets;
}

/**
 * Conecta el archivo de tokens con las hojas de estilo del proyecto.
 *
 * Transformacion quirurgica:
 *  1. De cada bloque `:root` se retiran SOLO las variables de paleta que
 *     define el token file; las propias de la app se conservan.
 *  2. Se agrega el `@import` al principio del archivo (CSS exige que los
 *     imports precedan a las reglas; un `@import` en el medio se ignora).
 *  3. El bloque de modo claro se elimina solo si define paleta (si no,
 *     pisaria los tokens).
 *
 * @param {string} projectDir - Directorio del proyecto
 * @param {Object} tokens - Tokens resueltos
 * @param {Object} [options] - Opciones
 * @param {boolean} [options.dryRun=false] - No escribir
 * @param {string} [options.css] - CSS renderizado (para dry-run)
 * @returns {Array<{file: string, changes: string[], missing: string[]}>} Hojas tocadas
 */
export function wireCss(projectDir, tokens, options = {}) {
  const tokenFile = path.join(projectDir, TOKEN_TARGETS.web);
  // En dry-run el archivo no existe todavia: se usa el contenido renderizado.
  const tokenCss = options.css
    ?? (fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8') : renderCss(tokens));
  if (!tokenCss) return [];

  const paletteVars = new Set(
    [...tokenCss.matchAll(/(--g360-[a-z0-9-]+)\s*:/g)].map((match) => match[1])
  );

  const isStylesheet = (file) =>
    file.endsWith('.css') &&
    // Los archivos generados por la herramienta no se rewirian.
    !['g360-tokens.css', 'g360-tokens.tailwind.css'].includes(path.basename(file)) &&
    // Artefactos de build y galeria de plantillas: no se tocan.
    !file.split(path.sep).some((part) => ['g360', '_app', 'dist', 'build', 'out', '.svelte-kit', '.next'].includes(part));

  const stylesheets = walkFiles(projectDir, {
    maxFiles: 200,
    maxDepth: 4,
    filter: isStylesheet
  });

  // Variables definidas en cualquier parte del proyecto (para no falsos positivos).
  const definedAnywhere = new Set(paletteVars);
  for (const file of stylesheets) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/(--[a-z0-9-]+)\s*:/g)) definedAnywhere.add(match[1]);
  }

  const touched = [];

  for (const file of stylesheets) {
    const original = fs.readFileSync(file, 'utf8');
    if (!original.includes('--g360-')) continue;

    const importPath = `./${path
      .relative(path.dirname(file), tokenFile)
      .split(path.sep)
      .join('/')}`;

    let content = original;
    const changes = [];

    // 1. Retirar de cada :root las variables de paleta (las de la app quedan).
    content = content.replace(/:root\s*\{([^}]*)\}/g, (match, body) => {
      const kept = body
        .split(';')
        .filter((declaration) => {
          const name = declaration.match(/(--[a-z0-9-]+)\s*:/i)?.[1];
          return !name || !paletteVars.has(name);
        })
        .map((declaration) => declaration.trim())
        .filter(Boolean);

      if (kept.length === 0) {
        changes.push(':root de paleta eliminado');
        return '';
      }

      changes.push(`:root sin paleta (${kept.length} variable(s) propias conservadas)`);
      return `:root {\n  ${kept.join(';\n  ')};\n}`;
    });

    // 2. Modo claro: se elimina solo si define paleta.
    content = content.replace(
      /@media\s*\(prefers-color-scheme:\s*light\)\s*\{\s*:root\s*\{([^}]*)\}\s*\}/g,
      (match, body) => {
        const definesPalette = [...body.matchAll(/(--g360-[a-z0-9-]+)\s*:/g)]
          .some((found) => paletteVars.has(found[1]));
        if (!definesPalette) return match;
        changes.push(':root de modo claro eliminado');
        return '';
      }
    );

    // 3. Import al principio del archivo (CSS exige imports antes de las reglas).
    if (!content.includes(`@import '${importPath}'`)) {
      const importStatement = `@import '${importPath}';`;
      const charset = content.match(/^@charset[^;]*;\s*/);
      const offset = charset ? charset[0].length : 0;
      content = content.slice(0, offset) + importStatement + '\n' + content.slice(offset);
      changes.push('@import agregado al inicio');
    }

    // 4. Variables usadas y no definidas ni en los tokens ni en el proyecto.
    const used = new Set(
      [...content.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1])
    );
    const missing = [...used].filter((name) => !definedAnywhere.has(name));
    if (missing.length > 0) changes.push(`sin definir: ${missing.join(', ')}`);

    if (content === original) continue;

    if (!options.dryRun) {
      fs.writeFileSync(file, content, 'utf8');
    }

    touched.push({ file: path.relative(projectDir, file), changes, missing });
  }

  return touched;
}
/**
 * Sincroniza los archivos que no pueden leer custom properties: el manifest
 * de la PWA y los meta theme-color del index.html.
 * @param {string} projectDir - Directorio del proyecto
 * @param {Object} tokens - Tokens resueltos
 * @returns {Array<{file: string, changes: string[]}>} Archivos tocados
 */
export function patchWebMeta(projectDir, tokens) {
  const touched = [];

  // --- manifest.json de la PWA ---
  const manifestPaths = ['public/manifest.json', 'manifest.json', 'src/manifest.json'];
  for (const rel of manifestPaths) {
    const manifestPath = path.join(projectDir, rel);
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = fs.readJsonSync(manifestPath);
      const changes = [];

      if (manifest.theme_color && manifest.theme_color !== tokens.dark.accent) {
        changes.push(`theme_color ${manifest.theme_color} -> ${tokens.dark.accent}`);
        manifest.theme_color = tokens.dark.accent;
      }
      if (manifest.background_color && manifest.background_color !== tokens.dark.bg) {
        changes.push(`background_color ${manifest.background_color} -> ${tokens.dark.bg}`);
        manifest.background_color = tokens.dark.bg;
      }

      if (changes.length > 0) {
        fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
        touched.push({ file: rel, changes });
      }
    } catch {
      // Un manifest invalido no debe romper la emision de tokens.
    }
    break;
  }

  // --- index.html: meta theme-color ---
  const indexPath = path.join(projectDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const original = fs.readFileSync(indexPath, 'utf8');
    const updated = original.replace(
      /<meta\s+name="theme-color"([^>]*?)content="#[0-9a-fA-F]{6}"([^>]*?)\/?>/g,
      (match, before, after) => {
        const isLight = /prefers-color-scheme:\s*light/i.test(before);
        const color = isLight ? tokens.light.accent : tokens.dark.accent;
        return `<meta name="theme-color"${before}content="${color}"${after}/>`;
      }
    );

    if (updated !== original) {
      fs.writeFileSync(indexPath, updated, 'utf8');
      touched.push({ file: 'index.html', changes: ['meta theme-color actualizado'] });
    }
  }

  return touched;
}

/**
 * Escribe los archivos de tokens del proyecto.
 * @param {string} projectDir - Directorio del proyecto
 * @param {Object} options - Opciones
 * @param {string} [options.skill] - Skill a aplicar
 * @param {string} [options.accentFamily] - Familia de acento
 * @param {boolean} [options.dryRun=false] - No escribir
 * @param {Object} [options.config] - Config de diseÃ±o precargada
 * @returns {{written: Array, tokens: Object, patched: Array}}
 */
export function writeTokens(projectDir, options = {}) {
  const tokens = resolveTokens(options);
  const targets = options.targets ?? detectTokenTargets(projectDir);
  const written = [];
  const notes = [];

  const renderers = {
    web: renderCss,
    python: renderPython,
    go: renderGo,
    rust: renderRust
  };

  for (const target of targets) {
    const renderer = renderers[target.stack];
    if (!renderer) continue;

    const filePath = path.join(projectDir, target.file);
    const content = renderer(tokens);

    if (!options.dryRun) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }

    written.push({ stack: target.stack, file: target.file, path: filePath });
  }

  // Tailwind v4 es CSS-first: el tema se emite como bloque @theme aparte.
  // En v3 el proyecto usa tailwind.config.js y este archivo no aplica.
  const tailwindMajor = detectTailwindVersion(projectDir);
  if (tailwindMajor !== null && targets.some((item) => item.stack === 'web')) {
    if (tailwindMajor >= 4) {
      const tailwindPath = path.join(projectDir, TOKEN_TARGETS.tailwind);
      if (!options.dryRun) {
        fs.mkdirSync(path.dirname(tailwindPath), { recursive: true });
        fs.writeFileSync(tailwindPath, renderTailwindTheme(tokens), 'utf8');
      }
      written.push({
        stack: 'tailwind',
        file: TOKEN_TARGETS.tailwind,
        path: tailwindPath,
        note: 'Tailwind v4: importar despues de "tailwindcss"'
      });
    } else {
      notes.push(
        `Tailwind v${tailwindMajor}: el tema va en tailwind.config.js (no se emite @theme)`
      );
    }
  }

  // Manifest PWA y theme-color: no pueden leer custom properties.
  let patched = [];
  if (targets.some((target) => target.stack === 'web')) {
    if (options.dryRun) {
      patched = [];
    } else {
      patched = patchWebMeta(projectDir, tokens);
    }
  }

  // Conectar el token file con las hojas de estilo del proyecto.
  let wired = [];
  if (options.wireCss && targets.some((target) => target.stack === 'web')) {
    wired = wireCss(projectDir, tokens, { dryRun: options.dryRun, css: renderCss(tokens) });
  }

  return { written, tokens, patched, wired, notes };
}

/**
 * Lee el skill.json de un proyecto (si existe) para heredar skill y acento.
 * @param {string} projectDir - Directorio del proyecto
 * @returns {{skill: string|null, accentFamily: string|null}}
 */
export function readProjectSkill(projectDir) {
  for (const rel of ['skill.json', 'src/core/skill.json']) {
    const filePath = path.join(projectDir, rel);
    if (!fs.existsSync(filePath)) continue;
    try {
      const skill = fs.readJsonSync(filePath);
      return {
        skill: skill.skill ?? skill.name ?? null,
        accentFamily: skill.accentFamily ?? null,
        colors: skill.colors ?? null,
        theme: skill.theme ?? null
      };
    } catch {
      return { skill: null, accentFamily: null, colors: null, theme: null };
    }
  }
  return { skill: null, accentFamily: null, colors: null, theme: null };
}

/**
 * kebab-case para nombres CSS.
 * @param {string} value - Nombre del rol
 * @returns {string}
 */
function kebab(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Nombre de constante Go.
 * @param {string} role - Nombre del rol
 * @returns {string}
 */
function goConst(role) {
  const pascal = role.charAt(0).toUpperCase() + role.slice(1);
  return pascal.replace(/[A-Z]/g, (letter) => letter);
}

/**
 * Nombre de constante Rust.
 * @param {string} role - Nombre del rol
 * @returns {string}
 */
function rustConst(role) {
  return role.replace(/[A-Z]/g, (letter) => `_${letter.toUpperCase()}`);
}

export default {
  resolveTokens,
  renderCss,
  renderPython,
  renderGo,
  renderRust,
  detectTokenTargets,
  writeTokens,
  readProjectSkill,
  loadDesignConfig,
  TOKEN_ROLES,
  TOKEN_TARGETS
};
