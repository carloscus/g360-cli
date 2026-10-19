/**
 * @file accent-families.test.js
 * @description Invariantes del sistema de familias de acento:
 * contraste WCAG, distancia de hue, semánticos fijos y ausencia de
 * colisiones accent === success en g360-skills.json.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadFamilies, listFamilyNames, getFamily, accentTokensFor,
  validateColorTokens, contrastRatio, hueOf,
} from './accent-families.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_PATH = path.join(__dirname, '../assets/config/g360-skills.json');
const HEX = /^#[0-9a-fA-F]{6}$/;
const RGBA = /^rgba?\(/;

function loadSkills() {
  return fs.readJsonSync(SKILLS_PATH).skills;
}

describe('accent-families.json', () => {
  it('has the 7 selectable families plus 3 legacy brand tones', () => {
    const { families } = loadFamilies();
    const names = Object.keys(families);
    for (const f of ['emerald', 'cyan', 'azure', 'indigo', 'violet', 'amber', 'rose']) {
      expect(names).toContain(f);
    }
    // legacy: tonos de skills existentes
    for (const f of ['teal', 'blue', 'cipsa']) {
      expect(families[f].legacy).toBe(true);
    }
    expect(listFamilyNames().length).toBe(10);
  });

  it('every family exposes the full symmetric token set with valid formats', () => {
    for (const [name, f] of Object.entries(loadFamilies().families)) {
      for (const key of ['accent', 'accentStrong', 'accentBright', 'onAccent', 'accentLight', 'onAccentLight']) {
        expect(f[key], `${name}.${key}`).toMatch(HEX);
      }
      expect(f.accentSoft, `${name}.accentSoft`).toMatch(RGBA);
      expect(typeof f.hue).toBe('number');
    }
  });

  it('selectable families pass AA contrast in dark and light mode', () => {
    const { families, rules } = loadFamilies();
    for (const [name, f] of Object.entries(families)) {
      if (f.legacy) continue;
      // dark: accent como texto sobre base oscura + onAccent sobre accent
      const { bg, surface, text } = loadFamilies().bases.dark;
      expect(contrastRatio(f.accent, bg)).toBeGreaterThanOrEqual(rules.minContrast);
      expect(contrastRatio(f.accent, surface)).toBeGreaterThanOrEqual(rules.minContrast);
      expect(contrastRatio(f.accentBright, bg)).toBeGreaterThanOrEqual(rules.minContrast);
      expect(contrastRatio(f.onAccent, f.accent)).toBeGreaterThanOrEqual(rules.minContrast);
      // light: accent sobre blanco
      expect(contrastRatio(f.accentLight, '#ffffff')).toBeGreaterThanOrEqual(rules.minContrast);
      expect(text, 'base dark text valido').toMatch(HEX);
    }
  });

  it('selectable non-exempt families keep hue distance from fixed success', () => {
    const { families, semantics, rules } = loadFamilies();
    const exempt = rules.exemptFamilies;
    const dhue = (a, b) => {
      const d = Math.abs(hueOf(a) - hueOf(b));
      return Math.min(d, 360 - d);
    };
    for (const [name, f] of Object.entries(families)) {
      if (f.legacy || exempt[name]) continue;
      expect(dhue(f.accent, semantics.success), `${name} dHue vs success`).toBeGreaterThanOrEqual(rules.minHueDistance);
    }
  });
});

describe('accentTokensFor', () => {
  it('returns symmetric tokens with fixed semantics regardless of family', () => {
    const a = accentTokensFor('emerald');
    const b = accentTokensFor('indigo');
    for (const key of ['success', 'warning', 'error', 'info']) {
      expect(a[key]).toBe(b[key]);
    }
    expect(a.accent).not.toBe(b.accent);
  });

  it('light mode swaps accent/onAccent', () => {
    const dark = accentTokensFor('azure', 'dark');
    const light = accentTokensFor('azure', 'light');
    expect(dark.accent).toBe('#38bdf8');
    expect(light.accent).toBe('#0369a1');
    expect(light.onAccent).toBe('#ffffff');
  });

  it('returns null for unknown family', () => {
    expect(accentTokensFor('nope')).toBe(null);
  });
});

describe('validateColorTokens', () => {
  it('rejects accent === success (the cipsa/polished bug)', () => {
    const r = validateColorTokens({ bg: '#0b1220', surface: '#151e2e', text: '#f0f4f8', muted: '#94a3b8', accent: '#34d399', accentBright: '#6ee7b7', onAccent: '#06281c', success: '#34d399' });
    expect(r.ok).toBe(false);
    expect(r.issues.join(' ')).toContain('colision semantica');
  });

  it('accepts a valid dark set and rejects low contrast', () => {
    const good = { bg: '#0b1220', surface: '#151e2e', text: '#f0f4f8', muted: '#94a3b8', accent: '#38bdf8', accentBright: '#7dd3fc', onAccent: '#0b1220', success: '#22c55e' };
    expect(validateColorTokens(good).ok).toBe(true);
    const bad = { ...good, muted: '#3a4252' };
    expect(validateColorTokens(bad).ok).toBe(false);
  });
});

describe('g360-skills.json invariants (gate de publicacion)', () => {
  const skills = loadSkills();

  it('no skill has accent identical to success', () => {
    const offenders = skills.filter((s) => s.colors.accent && s.colors.success &&
      s.colors.accent.toLowerCase() === s.colors.success.toLowerCase());
    expect(offenders.map((s) => s.name)).toEqual([]);
  });

  it('every skill declares an accentFamily', () => {
    const missing = skills.filter((s) => !s.accentFamily).map((s) => s.name);
    expect(missing).toEqual([]);
    for (const s of skills) {
      expect(listFamilyNames(), `${s.name} familia conocida`).toContain(s.accentFamily);
    }
  });

  it('every skill passes contrast invariants', () => {
    for (const s of skills) {
      const r = validateColorTokens(s.colors, { familyName: s.accentFamily });
      expect(r.issues, `${s.name}: ${r.issues.join('; ')}`).toEqual([]);
    }
  });

  it('variant skills exist with derived family tokens', () => {
    const azure = skills.find((s) => s.name === 'moderno-azure');
    const indigo = skills.find((s) => s.name === 'flet-desktop-indigo');
    expect(azure.accentFamily).toBe('azure');
    expect(azure.colors.accent).toBe('#38bdf8');
    expect(indigo.accentFamily).toBe('indigo');
    expect(indigo.colors.accent).toBe('#818cf8');
  });
});
