/**
 * @file auditor.test.js
 * @description Tests para el módulo auditor (detección de stack y versiones)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { auditor } from './auditor.js';

describe('auditor stack/version detection', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-auditor-stack-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  function write(relativePath, content = '') {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  describe('proyecto conforme (sin hallazgos)', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('pyproject.toml', 'flet = "1.0.5"\n');
      write('src/main.py', 'import flet as ft\nft.app(main)\n');
    });

    it('no emite hallazgos para stack desktop-flet con flet 1.0.5 y sin customtkinter', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('pass');
    });
  });

  describe('desktop-flet con customtkinter/ctkinter importado', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('pyproject.toml', 'flet = "1.0.5"\n');
      write('src/main.py', 'import customtkinter as ctk\nctk.CTk()\n');
    });

    it('emite hallazgo de advertencia citando stacks.json', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      expect(result.findings).toHaveLength(1);
      const finding = result.findings[0];
      expect(finding.message).toContain('stacks.json');
      expect(finding.message).toContain('desktop-flet');
      expect(finding.message).toContain('customtkinter');
      expect(finding.severity).toBeUndefined(); // warning status maps to warning severity in audit()
    });
  });

  describe('desktop-flet con ctkinter importado', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('pyproject.toml', 'flet = "1.0.5"\n');
      write('src/main.py', 'from ctkinter import CTk\nCTk()\n');
    });

    it('emite hallazgo de advertencia por ctkinter', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('ctkinter'));
      expect(finding).toBeDefined();
      expect(finding.message).toContain('stacks.json');
    });

    it('no da falso positivo por ctkinter dentro de comentario inline', async () => {
      write('src/main.py', 'import flet as ft\nft.app(main)  # antes usaba ctkinter\n');
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('pass');
    });

    it('no da falso positivo por ctkinter dentro de docstring multilínea', async () => {
      write('src/main.py', "import flet as ft\n'''\nUso de customtkinter como alternativa.\n'''\n");
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('pass');
    });
  });

  describe('desktop-flet con versión de Flet distinta a 1.0.5', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('pyproject.toml', 'flet = "0.21.0"\n');
      write('src/main.py', 'import flet as ft\n');
    });

    it('emite hallazgo de advertencia citando el target de stacks.json', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('Flet versión'));
      expect(finding).toBeDefined();
      expect(finding.message).toContain('0.21.0');
      expect(finding.message).toContain('1.0.5');
      expect(finding.message).toContain('stacks.json');
    });
  });

  describe('desktop-flet con múltiples problemas', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('pyproject.toml', 'flet = "0.21.0"\n');
      write('src/main.py', 'import customtkinter as ctk\n');
    });

    it('emite dos hallazgos (customtkinter + versión)', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
      const sources = result.findings.map((f) => f.message).join(' | ');
      expect(sources).toContain('customtkinter');
      expect(sources).toContain('0.21.0');
      expect(sources).toContain('1.0.5');
    });
  });

  describe('plantilla legacy python-flet', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({ name: 'mi-app' }));
      write('g360-manifest.json', JSON.stringify({
        name: 'mi-app',
        template: 'python-flet'
      }));
    });

    it('emite hallazgo de advertencia citando project-types.json', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('project-types.json'));
      expect(finding).toBeDefined();
      expect(finding.message).toContain('python-flet');
      expect(finding.message).toContain('deprecada');
    });
  });

  describe('sin stack declarado', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({ name: 'mi-app' }));
    });

    it('no emite hallazgos (pass)', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('pass');
    });
  });

  describe('plantilla legacy python-flet SIN package.json (caso real del template)', () => {
    beforeEach(() => {
      // El template real src/assets/templates/python-flet/ no tiene package.json,
      // solo g360-manifest.json con template: "python-flet".
      write('g360-manifest.json', JSON.stringify({
        name: 'mi-app-legacy',
        template: 'python-flet'
      }));
      write('src/main.py', 'import flet as ft\nft.app(main)\n');
    });

    it('emite hallazgo de advertencia citando project-types.json aunque no haya package.json', async () => {
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('project-types.json'));
      expect(finding).toBeDefined();
      expect(finding.message).toContain('python-flet');
      expect(finding.message).toContain('deprecada');
    });
  });

  describe('versiones de Flet con prefijos de rango', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('src/main.py', 'import flet as ft\n');
    });

    it('no emite hallazgo cuando flet es ^1.0.5 (rango compatible con target)', async () => {
      write('pyproject.toml', 'flet = "^1.0.5"\n');
      const result = await auditor.checkStack(tmpDir);
      const fletFindings = result.findings?.filter((f) => f.message.includes('Flet')) ?? [];
      expect(fletFindings).toHaveLength(0);
    });

    it('emite hallazgo cuando flet es >=0.28.3 (piso por debajo del target 1.0.5)', async () => {
      write('pyproject.toml', 'flet = ">=0.28.3"\n');
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('Flet'));
      expect(finding).toBeDefined();
      expect(finding.message).toContain('0.28.3');
      expect(finding.message).toContain('1.0.5');
    });

    it('emite hallazgo cuando flet es pin exacto viejo 0.21.0', async () => {
      write('pyproject.toml', 'flet = "0.21.0"\n');
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('Flet'));
      expect(finding).toBeDefined();
      expect(finding.message).toContain('0.21.0');
      expect(finding.message).toContain('1.0.5');
    });
  });

  describe('customtkinter/ctkinter en comentarios o strings', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({
        name: 'mi-app',
        g360: { stack: 'desktop-flet' }
      }));
      write('pyproject.toml', 'flet = "1.0.5"\n');
    });

    it('no emite hallazgo cuando customtkinter solo aparece en un comentario', async () => {
      write('src/main.py', [
        'import flet as ft',
        '# migrado desde ctkinter, ahora usamos flet',
        'ft.app(main)'
      ].join('\n'));
      const result = await auditor.checkStack(tmpDir);
      const ctFindings = result.findings?.filter((f) => f.message.includes('customtkinter/ctkinter')) ?? [];
      expect(ctFindings).toHaveLength(0);
      expect(result.status).toBe('pass');
    });

    it('no emite hallazgo cuando ctkinter aparece solo dentro de un string de documentación', async () => {
      write('src/main.py', [
        'import flet as ft',
        '"""Nota: antes usaba ctkinter, ahora es flet."""',
        'ft.app(main)'
      ].join('\n'));
      const result = await auditor.checkStack(tmpDir);
      const ctFindings = result.findings?.filter((f) => f.message.includes('customtkinter/ctkinter')) ?? [];
      expect(ctFindings).toHaveLength(0);
      expect(result.status).toBe('pass');
    });

    it('sí emite hallazgo cuando customtkinter se importa de verdad', async () => {
      write('src/main.py', 'import customtkinter as ctk\nctk.CTk()\n');
      const result = await auditor.checkStack(tmpDir);
      expect(result.status).toBe('warn');
      const finding = result.findings.find((f) => f.message.includes('customtkinter/ctkinter'));
      expect(finding).toBeDefined();
    });
  });
});
