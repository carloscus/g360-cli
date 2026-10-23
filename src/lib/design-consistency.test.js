/**
 * @file design-consistency.test.js
 * @description Guardas de coherencia del sistema de diseño: una sola fuente de
 * verdad para el acento (familias), y coherencia entre marcas, skills y decks.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { pathToFileURL } from 'url';
import { loadDesignConfig, resolveTokens, renderCss, renderPython } from './token-generator.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const ASSETS = path.join(__dirname, '..', 'assets');

describe('coherencia del sistema de diseño', () => {
  const { skills, families } = loadDesignConfig();
  const brand = fs.readJsonSync(path.join(ASSETS, 'brand', 'brand.json'));

  it('should not keep a hardcoded primary color per brand', () => {
    for (const [name, entry] of Object.entries(brand.brands)) {
      expect(entry.primary_color, `${name} no debe tener primary_color`).toBeUndefined();
      expect(entry.accentFamily, `${name} debe declarar accentFamily`).toBeTruthy();
    }
  });

  it('should resolve every brand accent family', () => {
    for (const [name, entry] of Object.entries(brand.brands)) {
      expect(families[entry.accentFamily], `${name}: familia "${entry.accentFamily}" inexistente`).toBeDefined();
    }
  });

  it('should map the brand accent to its family', () => {
    expect(brand.brands.g360.accentFamily).toBe('emerald');
    expect(brand.brands.cipsa.accentFamily).toBe('cipsa');
  });

  it('should resolve every skill accent family', () => {
    for (const skill of skills) {
      if (!skill.accentFamily) continue;
      expect(families[skill.accentFamily], `${skill.name}: familia "${skill.accentFamily}" inexistente`).toBeDefined();
    }
  });

  it('should declare a theme for every skill', () => {
    for (const skill of skills) {
      expect(['dark', 'light'], `${skill.name}: theme invalido`).toContain(skill.theme);
    }
  });

  it('should use the same accent in the decks as in the apps', async () => {
    const { PALETTES } = await import(
      pathToFileURL(path.join(ASSETS, 'pptx', 'design-tokens.js')).href
    );

    expect(PALETTES.g360.accent).toBe(families.emerald.accent.replace('#', '').toUpperCase());
    expect(PALETTES.cipsa.accent).toBe(families.cipsa.accent.replace('#', '').toUpperCase());
    expect(PALETTES.corporate.accent).toBe(families.navy.accent.replace('#', '').toUpperCase());
  });

  it('should not keep hex literals in the deck palettes', async () => {
    const { PALETTES } = await import(
      pathToFileURL(path.join(ASSETS, 'pptx', 'design-tokens.js')).href
    );

    for (const [name, palette] of Object.entries(PALETTES)) {
      for (const [role, value] of Object.entries(palette)) {
        expect(value, `${name}.${role}`).toMatch(/^[0-9A-F]{6}$/);
      }
    }
  });

  it('should not keep a hardcoded palette in the polished python theme', () => {
    const theme = fs.readFileSync(
      path.join(ASSETS, 'templates', 'python-flet-polished', 'src', 'config', 'theme.py'),
      'utf8'
    );

    // Solo se admiten hex en los fallbacks de los helpers de mezcla.
    const hexes = theme.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
    expect(hexes, `theme.py no debe tener paleta propia (${hexes.join(' ')})`).toEqual([]);
  });

  it('should emit the chart palette in every stack', () => {
    const tokens = resolveTokens({ skill: 'moderno' });

    expect(tokens.chart.dark).toHaveLength(8);
    expect(tokens.chart.light).toHaveLength(8);

    const css = renderCss(tokens);
    expect(css).toContain('--g360-chart-1:');
    expect(css).toContain('--g360-chart-8:');

    const python = renderPython(tokens);
    expect(python).toContain('"chart"');
    expect(python).toContain('"#06b6d4"');
  });
});
