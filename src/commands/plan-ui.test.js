/**
 * @file plan-ui.test.js
 * @description Tests para el catalogo de layouts y plan-ui (g360 plan-ui)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLayouts, getLayoutBody, buildPlan } from './plan-ui.js';
import { detectFletEntry } from '../lib/flet-capture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('layouts catalog', () => {
  it('has at least the 5 standard layouts', () => {
    const layouts = getLayouts();
    const names = layouts.map((l) => l.name);
    expect(layouts.length).toBeGreaterThanOrEqual(5);
    for (const expected of ['dashboard-kpi', 'master-detail', 'wizard', 'sidebar-panels', 'lista-filtros-export']) {
      expect(names).toContain(expected);
    }
  });

  it('every layout entry has metadata and its markdown file exists', () => {
    for (const layout of getLayouts()) {
      expect(layout.description).toBeTruthy();
      expect(layout.useWhen).toBeTruthy();
      const body = getLayoutBody(layout.name);
      expect(body).toBeTruthy();
      expect(body).toContain('# Layout:');
    }
  });

  it('layout files include wireframe and snippets sections', () => {
    for (const layout of getLayouts()) {
      const body = getLayoutBody(layout.name);
      expect(body).toContain('## Wireframe');
      expect(body).toContain('## Snippets asociados');
      expect(body).toContain('## Errores comunes');
    }
  });

  it('layouts.json is valid JSON shipped in assets', () => {
    const idx = path.join(__dirname, '../assets/layouts/layouts.json');
    expect(fs.existsSync(idx)).toBe(true);
    expect(() => fs.readJsonSync(idx)).not.toThrow();
  });
});

describe('buildPlan', () => {
  it('generates a plan with header, blocks and verification loop', () => {
    const plan = buildPlan('dashboard-kpi', { appName: 'Ventas App' });
    expect(plan).toContain('# UI Plan — Ventas App');
    expect(plan).toContain('dashboard-kpi');
    expect(plan).toContain('## Checklist de composición');
    expect(plan).toContain('g360 capture');
  });

  it('renders user-provided sections as ordered blocks', () => {
    const plan = buildPlan('wizard', { sections: ['Carga de archivo', 'Mapeo de columnas'] });
    expect(plan).toContain('1. Carga de archivo');
    expect(plan).toContain('2. Mapeo de columnas');
  });
});

describe('detectFletEntry', () => {
  it('detects root main.py', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-cap-'));
    fs.writeFileSync(path.join(tmp, 'main.py'), 'def main(page): pass\n');
    expect(detectFletEntry(tmp)).toBe(path.join(tmp, 'main.py'));
    fs.removeSync(tmp);
  });

  it('detects src/main.py fallback', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-cap-'));
    fs.mkdirpSync(path.join(tmp, 'src'));
    fs.writeFileSync(path.join(tmp, 'src', 'main.py'), 'def main(page): pass\n');
    expect(detectFletEntry(tmp)).toBe(path.join(tmp, 'src', 'main.py'));
    fs.removeSync(tmp);
  });

  it('returns null when no entrypoint exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-cap-'));
    expect(detectFletEntry(tmp)).toBe(null);
    fs.removeSync(tmp);
  });
});
