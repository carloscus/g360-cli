/**
 * @file accent-families.js
 * @description Sistema de familias de acento: estructura simetrica, semánticos
 * fijos, solo cambia el hue. Deriva los tokens accent* desde una familia y
 * valida invariantes de contraste (WCAG) y distancia de hue.
 * @author @carloscus
 * @version 1.0.0
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAMILIES_PATH = path.join(__dirname, '../assets/config/accent-families.json');

/** Carga el archivo de familias. */
export function loadFamilies() {
  return fs.readJsonSync(FAMILIES_PATH);
}

/** Nombres de familias disponibles. */
export function listFamilyNames() {
  return Object.keys(loadFamilies().families);
}

/** Devuelve una familia por nombre (null si no existe). */
export function getFamily(name) {
  const data = loadFamilies();
  return data.families[name] || null;
}

/**
 * Genera el set completo de tokens de color para un tema.
 * @param {string} familyName - Familia de acento
 * @param {string} [mode='dark'] - 'dark' | 'light'
 * @returns {Object|null} tokens listos para escribir en skill.json
 */
export function accentTokensFor(familyName, mode = 'dark') {
  const family = getFamily(familyName);
  if (!family) return null;

  const data = loadFamilies();
  const isLight = mode === 'light';
  const tokens = {
    accent: isLight ? family.accentLight : family.accent,
    accentStrong: family.accentStrong,
    accentBright: family.accentBright,
    accentSoft: family.accentSoft,
    onAccent: isLight ? family.onAccentLight : family.onAccent,
  };

  // Semánticos fijos: iguales en todas las familias (simetria)
  return { ...tokens, ...data.semantics };
}

/* ---------- Invariantes de color (WCAG + hue) ---------- */

export function luminance(hex) {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function hueOf(hex) {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  let h = (r === mx) ? (g - b) / (mx - mn) : (g === mx) ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn);
  return Math.round(((h * 60) + 360) % 360);
}

function hueDistance(a, b) {
  const d = Math.abs(hueOf(a) - hueOf(b));
  return Math.min(d, 360 - d);
}

/**
 * Valida un set de colores contra las reglas del sistema.
 * @param {Object} colors - tokens (bg, surface, text, muted, accent*, success...)
 * @param {Object} [opts]
 * @param {string} [opts.familyName] - familia declarada (para excepciones)
 * @returns {{ok: boolean, issues: string[]}}
 */
export function validateColorTokens(colors, opts = {}) {
  const { familyName = null } = opts;
  const data = loadFamilies();
  const { minContrast, minHueDistance, exemptFamilies } = data.rules;
  const issues = [];
  const exempt = familyName && exemptFamilies[familyName];

  // 1. Igualdad exacta accent === success: siempre prohibida
  if (colors.accent && colors.success && colors.accent.toLowerCase() === colors.success.toLowerCase()) {
    issues.push(`accent === success (${colors.accent}): colision semantica total`);
  }

  // 2. Contraste de texto
  if (colors.text && colors.bg && contrastRatio(colors.text, colors.bg) < minContrast) {
    issues.push(`text/bg ${contrastRatio(colors.text, colors.bg).toFixed(2)} < ${minContrast}`);
  }
  if (colors.muted && colors.bg && contrastRatio(colors.muted, colors.bg) < minContrast) {
    issues.push(`muted/bg ${contrastRatio(colors.muted, colors.bg).toFixed(2)} < ${minContrast}`);
  }
  // Para texto accent se acepta accent o accentBright (iconos grandes pueden usar accent solo)
  if (colors.accent && colors.bg) {
    const txtOk = contrastRatio(colors.accent, colors.bg) >= minContrast
      || (colors.accentBright && contrastRatio(colors.accentBright, colors.bg) >= minContrast);
    if (!txtOk) issues.push(`accent/bg ${contrastRatio(colors.accent, colors.bg).toFixed(2)} < ${minContrast}`);
  }
  if (colors.onAccent && colors.accent && contrastRatio(colors.onAccent, colors.accent) < minContrast) {
    issues.push(`onAccent/accent ${contrastRatio(colors.onAccent, colors.accent).toFixed(2)} < ${minContrast}`);
  }

  // 3. Distancia de hue accent vs success (salvo excepcion documentada)
  if (colors.accent && colors.success && !exempt) {
    const d = hueDistance(colors.accent, colors.success);
    if (d < minHueDistance) {
      issues.push(`dHue(accent, success) = ${d} < ${minHueDistance}`);
    }
  }

  return { ok: issues.length === 0, issues };
}
