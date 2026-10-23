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
      expect(css).toContain('@media (prefers-color-scheme: light)');
      expect(css).toContain('--g360-border:');
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
