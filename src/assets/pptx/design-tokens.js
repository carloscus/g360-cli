/**
 * Design tokens del sistema de presentaciones G360.
 * Fuente unica de verdad: todas las paletas, tipografia y espaciados
 * se definen aqui y son consumidos por themes/ y layouts/.
 *
 * Principios:
 *  - Formato 16:9 widescreen (13.333 x 7.5 in), tipo deck corporativo.
 *  - Un acento principal + un oscuro para titulos + tintes suaves para superficies.
 *  - Ambar reservado para advertencias/limites; rojo solo para errores.
 *  - Texto principal casi-negro, secundario gris slate.
 */

/** Paletas de marca disponibles */
export const PALETTES = {
  /** G360 — esmeralda tech sobre slate neutro */
  g360: {
    accent: '10B981',
    accentDark: '047857',
    accentSoft: 'E7F6F0',
    onAccent: 'FFFFFF',
    text: '0F172A',
    textMuted: '64748B',
    bg: 'FFFFFF',
    surface: 'F3F5F9',
    border: 'E3E8F0',
    warning: 'B45309',
    warningSoft: 'FDF3E3',
    info: '3B82F6',
    violet: '8B5CF6',
    success: '059669',
    danger: 'DC2626',
    coverTitle: '064E3B',
  },

  /** CIPSA — verde corporativo (alineado al manual de ventas-pulse) */
  cipsa: {
    accent: '008F5D',
    accentDark: '0B6B47',
    accentSoft: 'E3F0EB',
    onAccent: 'FFFFFF',
    text: '1F2937',
    textMuted: '64748B',
    bg: 'FFFFFF',
    surface: 'F8FAF9',
    border: 'C8E6D8',
    warning: 'B45309',
    warningSoft: 'FBF1E4',
    info: '0369A1',
    violet: '6D28D9',
    success: '008F5D',
    danger: 'DC2626',
    coverTitle: '0B6B47',
  },

  /** Corporate — azul marino neutral para apps sin marca definida */
  corporate: {
    accent: '1E40AF',
    accentDark: '172554',
    accentSoft: 'E7ECF9',
    onAccent: 'FFFFFF',
    text: '0F172A',
    textMuted: '64748B',
    bg: 'FFFFFF',
    surface: 'F4F6FB',
    border: 'D6DEF0',
    warning: 'B45309',
    warningSoft: 'FDF3E3',
    info: '0E7490',
    violet: '6D28D9',
    success: '047857',
    danger: 'DC2626',
    coverTitle: '172554',
  },
};

/** Tipografia: pila de fuentes y escala de puntos */
export const TYPO = {
  font: 'Inter',
  fallback: 'Arial',
  sizes: {
    coverTitle: 44,
    coverSubtitle: 16,
    coverMeta: 12,
    sectionTitle: 21,
    cardTitle: 12,
    cardBody: 9.5,
    body: 11.5,
    bodySmall: 10,
    caption: 9.5,
    footer: 8,
    kpiValue: 28,
    kpiLabel: 11,
    stepNumber: 12,
    stepTitle: 11.5,
    stepBody: 10.5,
  },
};

/** Espaciados y metricas del lienzo 16:9 */
export const SPACING = {
  page: { width: 13.333, height: 7.5 },
  marginX: 0.6,
  get contentWidth() {
    return this.page.width - this.marginX * 2;
  },
  sectionTitleY: 0.3,
  sectionRuleY: 0.85,
  contentTopY: 1.1,
  footerY: 7.12,
  cardGap: 0.2,
  radius: 0.06,
};

/** Layout por defecto registrado en pptxgenjs */
export const DEFAULT_LAYOUT = 'LAYOUT_16x9_G360';

/**
 * Resuelve una paleta por nombre con fallback seguro.
 * @param {string} name — 'g360' | 'cipsa' | 'corporate'
 * @returns {object} paleta
 */
export function resolvePalette(name) {
  return PALETTES[name] || PALETTES.g360;
}
