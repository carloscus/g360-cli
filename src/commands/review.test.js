/**
 * @file review.test.js
 * @description Tests para el comando review
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { review } from '../commands/review.js';

describe('review command', () => {
  let testDir;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-review-test-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.removeSync(testDir);
  });

  it('exporta la función review', () => {
    expect(typeof review).toBe('function');
  });

  it('aplica regla less-is-more (max 6 niveles tipográficos)', async () => {
    const cssFile = path.join(testDir, 'styles.css');
    fs.writeFileSync(cssFile, `
      .h1 { font-size: 40px; }
      .h2 { font-size: 32px; }
      .h3 { font-size: 24px; }
      .h4 { font-size: 20px; }
      .h5 { font-size: 18px; }
      .h6 { font-size: 16px; }
      .h7 { font-size: 14px; }
    `);

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await review('hierarchy', { project: testDir });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toMatch(/type-scale|tamaños|nivel|6|max/i);
  });

  it('detecta hardcoded colors fuera de skill.json', async () => {
    fs.writeFileSync(
      path.join(testDir, 'skill.json'),
      JSON.stringify({ name: 'test', colors: { accent: '#00796B' } })
    );
    const cssFile = path.join(testDir, 'styles.css');
    fs.writeFileSync(cssFile, '.btn { color: #ff0000; }');

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await review('tokens', { project: testDir });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toMatch(/off-palette|fuera de la paleta|#ff0000/i);
  });

  it('retorna score >= 90 si pasa todas las reglas', async () => {
    fs.writeFileSync(
      path.join(testDir, 'skill.json'),
      JSON.stringify({
        name: 'test',
        colors: { accent: '#00796B', bg: '#0b1220', text: '#f0f4f8' }
      })
    );
    const cssFile = path.join(testDir, 'styles.css');
    fs.writeFileSync(cssFile, '.btn { color: #00796B; }');

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await review('all', { project: testDir, json: true });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    const result = JSON.parse(output);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });
});
