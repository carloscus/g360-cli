/**
 * @file ui-review.test.js
 * @description Tests para el modulo ui-review (g360 review)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { reviewProject, loadPalette, detectFramework, collectUiFiles, REVIEW_LEVELS } from './ui-review.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-review-'));
});

afterEach(() => {
  fs.removeSync(tmpDir);
});

function writeSkill(colors = { bg: '#0b1220', accent: '#00d084' }) {
  fs.writeJsonSync(path.join(tmpDir, 'skill.json'), { name: 'test', colors });
}

describe('REVIEW_LEVELS', () => {
  it('exposes tokens, hierarchy, components, all', () => {
    expect(REVIEW_LEVELS).toEqual(['tokens', 'hierarchy', 'components', 'all']);
  });
});

describe('loadPalette', () => {
  it('returns null when no skill.json exists', () => {
    expect(loadPalette(tmpDir)).toBeNull();
  });

  it('loads and normalizes colors from skill.json', () => {
    writeSkill({ bg: '#0B1220', accent: '#00d084' });
    const palette = loadPalette(tmpDir);
    expect(palette.file).toBe('skill.json');
    expect(palette.colors.has('#0b1220')).toBe(true);
    expect(palette.colors.has('#00d084')).toBe(true);
  });
});

describe('detectFramework', () => {
  it('detects flet from python imports', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.py'), 'import flet as ft\n');
    expect(detectFramework(tmpDir, collectUiFiles(tmpDir))).toBe('flet');
  });

  it('detects react from package.json', () => {
    fs.writeJsonSync(path.join(tmpDir, 'package.json'), { dependencies: { react: '^18.0.0' } });
    expect(detectFramework(tmpDir, collectUiFiles(tmpDir))).toBe('react');
  });

  it('returns unknown when nothing matches', () => {
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'hello');
    expect(detectFramework(tmpDir, collectUiFiles(tmpDir))).toBe('unknown');
  });
});

describe('tokens level', () => {
  it('flags hardcoded palette color as minor', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 'a.py'), "bgcolor='#0b1220'\n");
    const r = reviewProject(tmpDir, 'tokens');
    const f = r.findings.find((x) => x.type === 'hardcoded-token');
    expect(f).toBeDefined();
    expect(f.severity).toBe('minor');
    expect(f.current).toBe('#0b1220');
  });

  it('flags off-palette color as important', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 'b.py'), "color='#ff0000'\n");
    const r = reviewProject(tmpDir, 'tokens');
    const f = r.findings.find((x) => x.type === 'off-palette');
    expect(f).toBeDefined();
    expect(f.severity).toBe('important');
  });

  it('ignores full-line comments with hex codes', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 'c.py'), '# usa #ff0000 solo en comentarios\nx = 1\n');
    const r = reviewProject(tmpDir, 'tokens');
    expect(r.findings.filter((x) => x.type === 'off-palette')).toHaveLength(0);
  });

  it('counts token-based files without findings', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 'd.py'), 'bgcolor = theme.bg\n');
    const r = reviewProject(tmpDir, 'tokens');
    expect(r.findings).toHaveLength(0);
    expect(r.summary.tokenBasedFiles).toBe(1);
    expect(r.score).toBe(100);
  });

  it('flags rgb() literals as minor', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 'e.css'), '.a { color: rgb(255, 0, 0); }\n');
    const r = reviewProject(tmpDir, 'tokens');
    expect(r.findings.some((x) => x.type === 'rgb-literal')).toBe(true);
  });

  it('reports missing-skill when no skill.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.py'), 'x = 1\n');
    const r = reviewProject(tmpDir, 'tokens');
    expect(r.findings.some((x) => x.type === 'missing-skill')).toBe(true);
  });

  it('skips token definitions in :root blocks', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 't.css'), ':root {\n  --g360-bg: #0b1220;\n}\n.a { color: #0b1220; }\n');
    const r = reviewProject(tmpDir, 'tokens');
    const f = r.findings.filter((x) => x.type === 'hardcoded-token');
    expect(f).toHaveLength(1);
    expect(f[0].file).toBe('t.css');
  });

  it('skips palette definition files (theme.py)', () => {
    writeSkill();
    fs.writeFileSync(path.join(tmpDir, 'theme.py'), 'DARK = Paleta(bg="#0b1220")\n');
    const r = reviewProject(tmpDir, 'tokens');
    expect(r.findings).toHaveLength(0);
  });

  it('skips theme-color meta tags (HTML cannot use CSS vars there)', () => {
    writeSkill();
    fs.writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />\n'
    );
    const r = reviewProject(tmpDir, 'tokens');
    expect(r.findings).toHaveLength(0);
  });
});

describe('hierarchy level', () => {
  it('flags multiple h1 as important', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>A</h1>\n<h1>B</h1>\n');
    const r = reviewProject(tmpDir, 'hierarchy');
    const f = r.findings.find((x) => x.type === 'multiple-h1');
    expect(f).toBeDefined();
    expect(f.severity).toBe('important');
  });

  it('flags skipped heading level as minor', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>A</h1>\n<h3>B</h3>\n');
    const r = reviewProject(tmpDir, 'hierarchy');
    expect(r.findings.some((x) => x.type === 'skipped-level')).toBe(true);
  });

  it('accepts clean h1-h2-h3 order', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<h1>A</h1>\n<h2>B</h2>\n<h3>C</h3>\n');
    const r = reviewProject(tmpDir, 'hierarchy');
    expect(r.findings).toHaveLength(0);
  });

  it('flags flet text size out of scale', () => {
    fs.writeFileSync(path.join(tmpDir, 'w.py'), 'ft.Text("x", size=8)\n');
    const r = reviewProject(tmpDir, 'hierarchy');
    expect(r.findings.some((x) => x.type === 'type-out-of-scale')).toBe(true);
  });

  it('flags type scale drift over 6 steps', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'w.py'),
      [12, 14, 16, 18, 20, 24, 32].map((s) => `ft.Text("x", size=${s})`).join('\n') + '\n'
    );
    const r = reviewProject(tmpDir, 'hierarchy');
    expect(r.findings.some((x) => x.type === 'type-scale-drift')).toBe(true);
  });
});

describe('components level', () => {
  function fletProject(extraFiles = {}) {
    fs.writeFileSync(path.join(tmpDir, 'app.py'), 'import flet as ft\n');
    for (const [name, content] of Object.entries(extraFiles)) {
      fs.writeFileSync(path.join(tmpDir, name), content);
    }
  }

  it('reports missing essentials in bare flet app', () => {
    fletProject();
    const r = reviewProject(tmpDir, 'components');
    expect(r.summary.componentsMissing.length).toBeGreaterThan(0);
    expect(r.findings.some((x) => x.type === 'missing-component')).toBe(true);
  });

  it('detects found components', () => {
    fletProject({
      'dash.py': 'import flet as ft\nfrom ft import DataTable\nFilePicker\nProgressRing\nPopupMenuButton\nsearch\n_build_header\nKpiCard\nsignature\n',
    });
    const r = reviewProject(tmpDir, 'components');
    expect(r.summary.componentsMissing).toHaveLength(0);
  });

  it('flags threading without loading state', () => {
    fletProject({ 'ui_work.py': 'import flet as ft\nimport threading\nthreading.Thread(target=run).start()\n' });
    const r = reviewProject(tmpDir, 'components');
    const f = r.findings.find((x) => x.type === 'blocking-without-loading');
    expect(f).toBeDefined();
    expect(f.severity).toBe('important');
  });

  it('flags silent except-pass', () => {
    fletProject({ 'ui_work.py': 'import flet as ft\ntry:\n    run()\nexcept Exception:\n    pass\n' });
    const r = reviewProject(tmpDir, 'components');
    expect(r.findings.some((x) => x.type === 'silent-error')).toBe(true);
  });

  it('ignores ImportError guards (idiomatic optional imports)', () => {
    fletProject({ 'ui_ok.py': 'import flet as ft\ntry:\n    import pip_system_certs\nexcept ImportError:\n    pass  # optional\n' });
    const r = reviewProject(tmpDir, 'components');
    expect(r.findings.some((x) => x.type === 'silent-error')).toBe(false);
  });

  it('flags console.log in jsx', () => {
    fs.writeJsonSync(path.join(tmpDir, 'package.json'), { dependencies: { react: '^18.0.0' } });
    fs.writeFileSync(path.join(tmpDir, 'App.jsx'), 'console.log("debug")\n');
    const r = reviewProject(tmpDir, 'components');
    expect(r.findings.some((x) => x.type === 'console-in-ui')).toBe(true);
  });

  it('flags oversized ui files', () => {
    fletProject();
    fs.mkdirSync(path.join(tmpDir, 'ui'));
    fs.writeFileSync(path.join(tmpDir, 'ui', 'big.py'), Array(401).fill('x = 1').join('\n') + '\n');
    const r = reviewProject(tmpDir, 'components');
    expect(r.findings.some((x) => x.type === 'file-too-large')).toBe(true);
  });

  it('reports unknown-framework skip', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.py'), 'x = 1\n');
    const r = reviewProject(tmpDir, 'components');
    expect(r.findings.some((x) => x.type === 'unknown-framework')).toBe(true);
  });
});

describe('score', () => {
  it('scores 100 on clean flet project', () => {
    writeSkill();
    fs.writeFileSync(
      path.join(tmpDir, 'app.py'),
      'import flet as ft\nbg = theme.bg\n_build_header\nKpiCard\nDataTable\nFilePicker\nProgressRing\nsignature\nPopupMenuButton\nsearch\n'
    );
    const r = reviewProject(tmpDir, 'all');
    expect(r.score).toBe(100);
    expect(r.framework).toBe('flet');
  });
});
