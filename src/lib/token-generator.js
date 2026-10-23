import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { contrastRatio } from './accent-families.js';

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
  return {
    skills,
    families: accent.families ?? {},
    semantics: accent.semantics ?? {},
    bases: accent.bases ?? {}
  };
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

  if (skillName && !skill) {
    throw new Error(`Skill desconocido: "${skillName}". Disponibles: ${config.skills.map((s) => s.name).join(', ')}`);
  }

  const colors = skill?.colors ?? {};
  const effects = skill?.effects ?? { glassmorphism: true, blur: '16px', rounded: '16px' };
  const familyName = options.accentFamily ?? skill?.accentFamily ?? 'emerald';
  const family = config.families[familyName];

  if (!family) {
    throw new Error(`Familia de acento desconocida: "${familyName}"`);
  }

  const semantics = config.semantics ?? {};
  const baseDark = config.bases?.dark ?? { bg: '#0b1220', surface: '#151e2e', text: '#f0f4f8', muted: '#94a3b8' };
  const baseLight = config.bases?.light ?? { bg: '#ffffff', surface: '#f8fafc', text: '#1e293b', muted: '#64748b' };

  // Tema principal del skill: "dark" por defecto, "light" para los claros.
  // El tema alterno usa la base global salvo que el skill declare la suya.
  const primaryTheme = skill?.theme ?? 'dark';
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
    effects,
    signature: skill?.signature ?? { mode: 'powered', text: 'powered by G360' },
    skill: skill?.name ?? null,
    accentFamily: familyName,
    theme: primaryTheme
  };

  tokens.issues = validateTokens(tokens);

  return tokens;
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
 * @param {Object} tokens - Tokens resueltos
 * @returns {string} Contenido CSS
 */
export function renderCss(tokens) {
  const block = (values, indent = '  ') => TOKEN_ROLES
    .filter((role) => values[role] !== undefined)
    .flatMap((role) => {
      const lines = [`${indent}--g360-${kebab(role)}: ${normalizeColor(values[role])};`];
      for (const alias of CSS_ALIASES[role] ?? []) {
        lines.push(`${indent}--g360-${alias}: ${normalizeColor(values[role])};`);
      }
      return lines;
    })
    .join('\n');

  return `/* ============================================
 * G360 Design Tokens
 * Generado por \`g360 tokens\` — no editar a mano.
 * Skill: ${tokens.skill ?? 'default'} | acento: ${tokens.accentFamily} | tema: ${tokens.theme ?? 'dark'}
 *
 * El tema por defecto es ${tokens.theme ?? 'dark'}. Para forzar el otro:
 *   <html data-theme="light">  (o "dark")
 * Sin data-theme se respeta la preferencia del sistema.
 * ============================================ */

:root {
${block(tokens.dark)}
}

@media (prefers-color-scheme: light) {
  :root {
${block(tokens.light, '    ')}
  }
}

html[data-theme="light"] {
${block(tokens.light)}
}

html[data-theme="dark"] {
${block(tokens.dark)}
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

  return `"""G360 Design Tokens.

Generado por \`g360 tokens\` — no editar a mano.
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

  return `// Package theme contiene los design tokens de G360.
//
// Generado por \`g360 tokens\` — no editar a mano.
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

// Dark devuelve el mapa de tokens del tema oscuro.
func Dark() map[string]string {
	return map[string]string{
${pairs(tokens.dark)}
	}
}

// Light devuelve el mapa de tokens del tema claro.
func Light() map[string]string {
	return map[string]string{
${pairs(tokens.light)}
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

  return `//! Design tokens de G360.
//!
//! Generado por \`g360 tokens\` — no editar a mano.
//! Skill: ${tokens.skill ?? 'default'} | acento: ${tokens.accentFamily}

/// Tokens del tema oscuro (default).
pub mod dark {
${consts(tokens.dark).replace(/^/gm, '    ')}
}

/// Tokens del tema claro.
pub mod light {
${consts(tokens.light).replace(/^/gm, '    ')}
}

/// Tokens del tema oscuro como pares (nombre, valor).
pub const DARK: &[(&str, &str)] = &[
${pairs(tokens.dark)}
];

/// Tokens del tema claro como pares (nombre, valor).
pub const LIGHT: &[(&str, &str)] = &[
${pairs(tokens.light)}
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

  if (has('package.json') || has('index.html') || has('src')) {
    targets.push({ stack: 'web', file: TOKEN_TARGETS.web });
  }
  if (has('pyproject.toml') || has('requirements.txt') || has('main.py')) {
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
 * Escribe los archivos de tokens del proyecto.
 * @param {string} projectDir - Directorio del proyecto
 * @param {Object} options - Opciones
 * @param {string} [options.skill] - Skill a aplicar
 * @param {string} [options.accentFamily] - Familia de acento
 * @param {boolean} [options.dryRun=false] - No escribir
 * @param {Object} [options.config] - Config de diseño precargada
 * @returns {{written: Array, tokens: Object}}
 */
export function writeTokens(projectDir, options = {}) {
  const tokens = resolveTokens(options);
  const targets = options.targets ?? detectTokenTargets(projectDir);
  const written = [];

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

  return { written, tokens };
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
        accentFamily: skill.accentFamily ?? null
      };
    } catch {
      return { skill: null, accentFamily: null };
    }
  }
  return { skill: null, accentFamily: null };
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
