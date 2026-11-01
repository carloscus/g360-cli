/**
 * @file token-generator.test.js
 * @description Tests del generador de design tokens y guardas de regresión
 * contra paletas hardcodeadas en las plantillas.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  resolveTokens,
  renderCss,
  renderPython,
  renderGo,
  renderRust,
  renderTailwindTheme,
  detectTokenTargets,
  writeTokens,
  readProjectSkill,
  loadDesignConfig,
  validateTokens,
  TOKEN_ROLES,
  TEMPLATES_DIR
} from './token-generator.js';
import { contrastRatio } from './accent-families.js';

const WEB_TEMPLATES = ['web-pwa', 'solid-web', 'svelte-web', 'lit-web'];

describe('token-generator', () => {
  describe('resolveTokens', () => {
    it('should resolve every role for dark and light', () => {
      const tokens = resolveTokens({ skill: 'moderno' });

      for (const role of TOKEN_ROLES) {
        expect(tokens.dark[role], `dark.${role}`).toBeDefined();
        expect(tokens.light[role], `light.${role}`).toBeDefined();
      }
    });

    it('should use the accent family of the skill by default', () => {
      const tokens = resolveTokens({ skill: 'moderno' });

      expect(tokens.accentFamily).toBe('emerald');
      expect(tokens.dark.accent).toBe('#00d084');
    });

    it('should let the accent family override the skill palette', () => {
      const tokens = resolveTokens({ skill: 'moderno', accentFamily: 'cyan' });

      expect(tokens.dark.accent).toBe('#22d3ee');
      expect(tokens.light.accent).toBe('#0e7490');
    });

    it('should throw for an unknown skill', () => {
      expect(() => resolveTokens({ skill: 'no-existe' })).toThrow(/Skill desconocido/);
    });

    it('should throw for an unknown accent family', () => {
      expect(() => resolveTokens({ skill: 'moderno', accentFamily: 'no-existe' })).toThrow(/acento desconocida/);
    });

    it('should use the project palette when the skill is not in the catalog', () => {
      const tokens = resolveTokens({
        skill: 'g360-stock-consolidator',
        colors: { bg: '#ffffff', surface: '#ffffff', accent: '#00796B', text: '#0f172a', muted: '#64748b' }
      });

      expect(tokens.skill).toBe('g360-stock-consolidator');
      expect(tokens.dark.accent).toBe('#00796B');
      // Paleta clara: el proyecto manda en su tema, el alterno usa la base global.
      expect(tokens.theme).toBe('light');
      expect(tokens.light.bg).toBe('#ffffff');
      expect(tokens.dark.bg).toBe('#0b1220');
    });

    it('should infer the accent family from the tone', () => {
      const tokens = resolveTokens({
        skill: 'propio',
        colors: { bg: '#0b1220', surface: '#151e2e', accent: '#00796B', text: '#f0f4f8', muted: '#94a3b8' }
      });

      expect(tokens.accentFamily).toBe('teal');
      expect(tokens.accentFamilyInferred).toBe(true);
    });

    it('should infer a light theme from a light background', () => {
      const tokens = resolveTokens({
        skill: 'propio',
        colors: { bg: '#ffffff', surface: '#f8fafc', accent: '#00796B', text: '#0f172a', muted: '#64748b' }
      });

      expect(tokens.theme).toBe('light');
      expect(tokens.light.bg).toBe('#ffffff');
      expect(tokens.dark.bg).not.toBe('#ffffff');
    });
  });

  describe('temas claro y oscuro', () => {
    it('should use the skill own light palette for light-first skills', () => {
      const tokens = resolveTokens({ skill: 'minimalista' });

      expect(tokens.theme).toBe('light');
      expect(tokens.light.surface).toBe('#f5f5f5');
      expect(tokens.light.text).toBe('#1f2937');
      expect(tokens.light.textMuted).toBe('#6b7280');
    });

    it('should use the global light base for dark-first skills', () => {
      const tokens = resolveTokens({ skill: 'moderno' });

      expect(tokens.theme).toBe('dark');
      expect(tokens.light.surface).toBe('#f8fafc');
      expect(tokens.light.text).toBe('#1e293b');
    });

    it('should use different semantics per theme', () => {
      const tokens = resolveTokens({ skill: 'moderno' });

      expect(tokens.dark.success).toBe('#22c55e');
      expect(tokens.light.success).toBe('#15803d');
      expect(tokens.light.error).toBe('#dc2626');
    });

    it('should keep the light semantics readable on white (WCAG AA)', () => {
      const tokens = resolveTokens({ skill: 'moderno' });

      for (const role of ['success', 'warning', 'error', 'info']) {
        expect(
          contrastRatio(tokens.light[role], tokens.light.bg),
          `${role} sobre fondo claro`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('should report families whose accent fails AA on the dark surface', () => {
      const tokens = resolveTokens({ skill: 'corporativo' });

      expect(tokens.issues.join(' ')).toMatch(/accent\/bg/);
      expect(tokens.issues.join(' ')).toMatch(/accentBright/);
    });

    it('should not report issues for the emerald family', () => {
      const tokens = resolveTokens({ skill: 'moderno' });

      expect(tokens.issues).toEqual([]);
    });
  });

  describe('renderers', () => {
    const tokens = resolveTokens({ skill: 'moderno' });

    it('should emit CSS custom properties and a light mode block', () => {
      const css = renderCss(tokens);

      expect(css).toContain(':root {');
      expect(css).toContain('--g360-accent: #00d084;');
      expect(css).toContain('--g360-border:');
    });

    it('should use light-dark() with a fallback and color-scheme', () => {
      const css = renderCss(tokens);

      // Fallback (valor oscuro) + light-dark: si el navegador no lo soporta,
      // queda el oscuro. Orden del spec CSS: light-dark(<claro>, <oscuro>).
      expect(css).toContain('--g360-bg: #0b1220;');
      expect(css).toContain('--g360-bg: light-dark(#ffffff, #0b1220);');
      expect(css).toContain('color-scheme: dark light;');
      expect(css).toContain('html[data-theme="light"] { color-scheme: light; }');
      expect(css).toContain('html[data-theme="dark"] { color-scheme: dark; }');
    });

    it('should emit light-dark(light, dark) in that argument order for every role', () => {
      // Regresión: el orden de los argumentos es un contrato CSS. El primer
      // argumento aplica en tema claro, el segundo en oscuro (color-scheme).
      const css = renderCss(tokens);
      // Filtrado por línea (no por regex global con [^)]*): los valores
      // rgba(...) contienen ')' y un patrón que no cruza paréntesis los
      // excluiría silenciosamente del control de regresión.
      const lightDarkLines = css
        .split('\n')
        .filter((l) => l.includes(': light-dark('));
      expect(lightDarkLines.length).toBeGreaterThan(0);
      // Garantía explícita: al menos un rol rgba queda bajo control.
      expect(lightDarkLines.some((l) => l.includes('rgba('))).toBe(true);

      // Separa los dos argumentos de light-dark() balanceando paréntesis.
      // Un split por coma simple parte mal en rgba(a, b), rgba(c, d).
      const splitArgs = (inner) => {
        const args = [];
        let depth = 0;
        let current = '';
        for (const ch of inner) {
          if (ch === '(') depth++;
          if (ch === ')') depth--;
          if (ch === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
            continue;
          }
          current += ch;
        }
        args.push(current.trim());
        return args;
      };
      const argOf = (line) => splitArgs(line.match(/light-dark\((.*)\);/)[1]);

      const kebab = (role) => role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      const lower = (s) => String(s).toLowerCase();
      const nonChart = lightDarkLines.filter((l) => !l.trim().startsWith('--g360-chart-'));
      expect(nonChart.length).toBeGreaterThan(0);
      for (const line of nonChart) {
        const [, role] = line.trim().match(/--g360-([a-z0-9-]+):/);
        const [lightValue, darkValue] = argOf(line);
        const camelRole = TOKEN_ROLES.find((r) => kebab(r) === role);
        expect(camelRole).toBeDefined();
        // El primer argumento debe ser el valor del rol en tema claro...
        expect(lower(lightValue)).toBe(lower(tokens.light[camelRole]));
        // ...y el segundo, el valor del rol en tema oscuro (el fallback).
        expect(lower(darkValue)).toBe(lower(tokens.dark[camelRole]));
      }
      // Paleta categórica: chart-N mapea a tokens.chart.light/dark por índice.
      const chartLines = lightDarkLines.filter((l) => l.trim().startsWith('--g360-chart-'));
      const chartCount = (tokens.chart?.dark ?? []).length;
      if (chartCount > 0) {
        expect(chartLines.length).toBe(chartCount);
        for (let i = 0; i < chartCount; i++) {
          const [lightValue, darkValue] = argOf(chartLines[i]);
          expect(lower(lightValue)).toBe(lower(tokens.chart.light[i]));
          expect(lower(darkValue)).toBe(lower(tokens.chart.dark[i]));
        }
      }
    });

    it('should emit a Tailwind v4 theme block', () => {
      const css = renderTailwindTheme(tokens);

      expect(css).toContain('@theme {');
      expect(css).toContain('--color-g360-accent: var(--g360-accent);');
      expect(css).toContain('--color-g360-chart-1: var(--g360-chart-1);');
      expect(css).toContain('--font-g360: var(--g360-font);');
    });

    it('should emit an explicit theme toggle', () => {
      const css = renderCss(tokens);

      expect(css).toContain('html[data-theme="light"]');
      expect(css).toContain('html[data-theme="dark"]');
    });

    it('should keep the legacy CSS aliases used by existing projects', () => {
      const css = renderCss(tokens);

      expect(css).toContain('--g360-muted:');
      expect(css).toContain('--g360-rounded:');
    });

    it('should emit the same roles in every stack', () => {
      const css = renderCss(tokens);
      const python = renderPython(tokens);
      const go = renderGo(tokens);
      const rust = renderRust(tokens);

      for (const role of TOKEN_ROLES) {
        const kebab = role.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);
        expect(css, `css ${role}`).toContain(`--g360-${kebab}:`);
        expect(python, `python ${role}`).toContain(`"${role}"`);
        expect(go, `go ${role}`).toMatch(new RegExp(`\\b${role.charAt(0).toUpperCase()}${role.slice(1)}\\b`));
        expect(rust, `rust ${role}`).toMatch(new RegExp(`\\b${role.replace(/[A-Z]/g, (l) => `_${l.toUpperCase()}`)}\\b`));
      }
    });
  });

  describe('proyectos', () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-tokens-'));
    });

    afterEach(() => {
      fs.removeSync(tmpDir);
    });

    it('should detect the stack of a project', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
      fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module demo\n');
      fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]\nname="demo"\n');

      const stacks = detectTokenTargets(tmpDir).map((target) => target.stack);

      expect(stacks).toContain('web');
      expect(stacks).toContain('go');
      expect(stacks).toContain('rust');
    });

    it('should write the token file for each stack', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
      fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module demo\n');

      const { written } = writeTokens(tmpDir, { skill: 'moderno' });

      expect(written.length).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(tmpDir, 'src/styles/g360-tokens.css'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'internal/theme/tokens.go'))).toBe(true);
    });

    it('should not write anything on dry-run', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');

      writeTokens(tmpDir, { skill: 'moderno', dryRun: true });

      expect(fs.existsSync(path.join(tmpDir, 'src/styles/g360-tokens.css'))).toBe(false);
    });

    it('should read the skill of a project', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'skill.json'),
        JSON.stringify({ skill: 'react-web', accentFamily: 'cyan' })
      );

      const project = readProjectSkill(tmpDir);

      expect(project.skill).toBe('react-web');
      expect(project.accentFamily).toBe('cyan');
    });

    it('should regenerate tokens for a changed accent family', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
      fs.writeFileSync(
        path.join(tmpDir, 'skill.json'),
        JSON.stringify({ skill: 'react-web', accentFamily: 'violet' })
      );

      const project = readProjectSkill(tmpDir);
      writeTokens(tmpDir, { skill: project.skill, accentFamily: project.accentFamily });

      const css = fs.readFileSync(path.join(tmpDir, 'src/styles/g360-tokens.css'), 'utf8');

      expect(css).toContain('--g360-accent: #a78bfa;');
    });
  });

  describe('guardas de regresión sobre las plantillas', () => {
    it('should ship the same tokens in every web template', () => {
      const files = WEB_TEMPLATES.map((name) =>
        fs.readFileSync(path.join(TEMPLATES_DIR, name, 'src/styles/g360-tokens.css'), 'utf8')
      );

      const normalize = (content) => content.replace(/Skill: .*\| acento: .*/, 'X').replace(/\r\n/g, '\n');
      const reference = normalize(files[0]);

      for (const content of files) {
        expect(normalize(content)).toBe(reference);
      }
    });

    it('should keep every template CSS in sync with the generator output', () => {
      // El bug de light-dark() invertido ocurrió porque el generador y los
      // CSS commiteados divergieron: este guard impide que vuelva a pasar.
      for (const name of WEB_TEMPLATES) {
        const dir = path.join(TEMPLATES_DIR, name);
        const project = readProjectSkill(dir);
        const expected = renderCss(resolveTokens({
          skill: project.skill,
          accentFamily: project.accentFamily,
          colors: project.colors ?? undefined
        }));
        const actual = fs.readFileSync(
          path.join(dir, 'src/styles/g360-tokens.css'),
          'utf8'
        );
        expect(actual, `template ${name} desincronizado del generador`).toBe(expected);
      }
    });

    it('should not hardcode palettes in the web stylesheets', () => {
      for (const name of WEB_TEMPLATES) {
        const dir = path.join(TEMPLATES_DIR, name);
        const stylesheets = [];

        const walk = (current) => {
          for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.css') && entry.name !== 'g360-tokens.css') stylesheets.push(full);
          }
        };
        walk(dir);

        for (const file of stylesheets) {
          const content = fs.readFileSync(file, 'utf8');
          expect(
            /:root\s*{[^}]*#[0-9a-fA-F]{3,8}/m.test(content),
            `${path.relative(TEMPLATES_DIR, file)} define una paleta propia en :root`
          ).toBe(false);
        }
      }
    });

    it('should keep the template skill.json in sync with the canonical skills', () => {
      const { skills } = loadDesignConfig();

      for (const name of WEB_TEMPLATES) {
        const templateSkill = fs.readJsonSync(path.join(TEMPLATES_DIR, name, 'src/core/skill.json'));
        const canonical = skills.find((item) => item.name === templateSkill.name);

        expect(canonical, `${name}: skill "${templateSkill.name}" no existe en g360-skills.json`).toBeDefined();
        expect(templateSkill.colors.accent).toBe(canonical.colors.accent);
        expect(templateSkill.effects.rounded).toBe(canonical.effects.rounded);
      }
    });
  });
});
