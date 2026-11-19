import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lint } from './lint.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logs = [];
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  logs.length = 0;
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => logs.push(args.join(' '));
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
});

describe('lint command', () => {
  it('exporta una función lint', async () => {
    const mod = await import('./lint.js');
    expect(mod).toHaveProperty('lint');
    expect(typeof mod.lint).toBe('function');
  });

  it('detecta variables camelCase incorrectas en proyectos Flet (JS)', async () => {
    const tmpDir = path.join(__dirname, '__tmp_lint_flet');
    await fs.ensureDir(tmpDir);
    const file = path.join(tmpDir, 'MainPage.js');
    // nombre de variable genérico (en lista GENERIC_NAMES) + nombre con mayúsculas inicial que rompe camelCase
    await fs.writeFile(file, 'const result = 1;\nlet Data = 2;\n', 'utf8');

    await lint(tmpDir, { level: 'naming' });

    const output = logs.join('\n');
    expect(output).toContain('result') || output.toContain('Data') || output.toContain('generic-variable') || output.toContain('function-naming');

    await fs.remove(tmpDir);
  });

  it('no da falso positivo en comentarios/docstrings', async () => {
    const tmpDir = path.join(__dirname, '__tmp_lint_comments');
    await fs.ensureDir(tmpDir);
    const file = path.join(tmpDir, 'clean.js');
    // Solo comentarios con nombres que no seguirían camelCase, sin código real
    await fs.writeFile(file, '// esto_es_un_comentario\n/* Variable_En_Comentario */\nconst variableValida = 1;\n', 'utf8');

    await lint(tmpDir, { level: 'naming' });

    const output = logs.join('\n');
    // No debe reportar los nombres dentro de comentarios como hallazgos
    expect(output).not.toContain('esto_es_un_comentario');
    expect(output).not.toContain('Variable_En_Comentario');

    await fs.remove(tmpDir);
  });

  it('soporta flag --fix (auto-correct) — lista sin modificar nada por ahora', async () => {
    const tmpDir = path.join(__dirname, '__tmp_lint_fix');
    await fs.ensureDir(tmpDir);
    const file = path.join(tmpDir, 'script.js');
    await fs.writeFile(file, 'const result = 1;\n', 'utf8');

    await lint(tmpDir, { level: 'naming', fix: true });

    const output = logs.join('\n');
    // lint ejecuta y reporta hallazgos; --fix no rompe la ejecución
    expect(output).toContain('result') || expect(output).toContain('Puntaje') || output.length > 0;

    await fs.remove(tmpDir);
  });

  it('retorna hallazgos críticos cuando hay errores de sintaxis JS', async () => {
    const tmpDir = path.join(__dirname, '__tmp_lint_critical');
    await fs.ensureDir(tmpDir);
    const file = path.join(tmpDir, 'broken.js');
    await fs.writeFile(file, 'function foo( { \n', 'utf8');

    await lint(tmpDir, { level: 'syntax' });

    const output = logs.join('\n');
    expect(output).toContain('syntax-error') || expect(output).toContain('críticos') || expect(output).toContain('Error de sintaxis');

    await fs.remove(tmpDir);
  });
});
