/**
 * @file agents-generator.test.js
 * @description Tests para el generador de AGENTS.md por repo
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { agentsGenerator } from './agents-generator.js';

describe('agentsGenerator', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-agents-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  /**
   * Escribe un archivo dentro del repo temporal.
   * @param {string} relativePath - Ruta relativa
   * @param {string} [content=''] - Contenido
   */
  function write(relativePath, content = '') {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  describe('detección de stack', () => {
    it('should detect node + vitest and use npm ci / npm test', () => {
      write('package.json', JSON.stringify({
        name: 'demo',
        scripts: { test: 'vitest', build: 'vite build' },
        devDependencies: { vitest: '2.0.0' }
      }));
      write('package-lock.json', '{}');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.stack).toBe('node');
      expect(analysis.packageManager).toBe('npm');
      expect(analysis.install).toBe('npm ci');
      expect(analysis.verify).toBe('npm test');
      expect(analysis.runner).toBe('Vitest');
    });

    it('should detect pnpm when there is a pnpm lockfile', () => {
      write('package.json', JSON.stringify({ name: 'demo', scripts: { test: 'vitest' } }));
      write('pnpm-lock.yaml', 'lockfileVersion: 9\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.packageManager).toBe('pnpm');
      expect(analysis.install).toBe('pnpm ci');
      expect(analysis.verify).toBe('pnpm test');
    });

    it('should fall back to build + lint when there is no test script', () => {
      write('package.json', JSON.stringify({
        name: 'demo',
        scripts: { build: 'vite build', lint: 'eslint .' }
      }));

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.verify).toBe('npm run build && npm run lint');
      expect(analysis.runner).toBe('sin script de test');
    });

    it('should ignore placeholder test scripts', () => {
      write('package.json', JSON.stringify({
        name: 'demo',
        scripts: { test: 'echo "Open test.html"', build: 'vite build' }
      }));

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.verify).toBe('npm run build');
    });

    it('should detect python with uv and pytest', () => {
      write('pyproject.toml', '[project]\nname = "demo"\n');
      write('uv.lock', '');
      write('tests/test_demo.py', 'def test_ok():\n    assert True\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.stack).toBe('python');
      expect(analysis.install).toBe('uv sync');
      expect(analysis.verify).toBe('uv run pytest');
      expect(analysis.hasTests).toBe(true);
    });

    it('should use compileall for python without tests', () => {
      write('requirements.txt', 'flet\n');
      write('src/main.py', 'print("hola")\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.install).toBe('pip install -r requirements.txt');
      expect(analysis.verify).toBe('python -m compileall src');
      expect(analysis.hasTests).toBe(false);
    });

    it('should run compileall inside the uv environment when there are no tests', () => {
      write('pyproject.toml', '[project]\nname = "demo"\n');
      write('uv.lock', 'version = 1\n');
      write('src/main.py', 'print("hola")\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.verify).toBe('uv run python -m compileall src');
      expect(analysis.hasTests).toBe(false);
    });

    it('should use unittest when a project has unittest.TestCase tests', () => {
      write('pyproject.toml', '[project]\nname = "demo"\n');
      write('uv.lock', 'version = 1\n');
      write('src/test_app.py', 'import unittest\n\nclass TestApp(unittest.TestCase):\n    def test_ok(self):\n        self.assertEqual(1, 1)\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.runner).toBe('unittest');
      expect(analysis.verify).toBe('uv run python -m unittest discover -s src -p "test*.py"');
    });

    it('should not mistake unittest.mock usage for the unittest runner', () => {
      write('pyproject.toml', '[project]\nname = "demo"\n');
      write('uv.lock', 'version = 1\n');
      write('tests/test_app.py', 'from unittest.mock import Mock\nimport pytest\n\ndef test_uses_mock():\n    assert Mock() is not None\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.runner).toBe('pytest');
      expect(analysis.verify).toBe('uv run pytest');
    });

    it('should prefer Python syntax verification over a placeholder Node test script', () => {
      write('pyproject.toml', '[project]\nname = "demo"\n');
      write('uv.lock', 'version = 1\n');
      write('package.json', JSON.stringify({
        name: 'demo',
        scripts: { test: 'echo "Open test.html"' }
      }));
      write('src/main.py', 'print("hola")\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.stack).toBe('python');
      expect(analysis.verify).toBe('uv run python -m compileall src');
    });

    it('should not count vendored template tests as project tests', () => {
      write('pyproject.toml', '[project]\nname = "demo"\n');
      write('g360/templates/python-flet/src/test_app.py', 'def test_template_fixture():\n    assert True\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.stack).toBe('python');
      expect(analysis.hasTests).toBe(false);
      expect(analysis.verify).toBe('python -m compileall .');
    });

    it('should detect go projects', () => {
      write('go.mod', 'module demo\n');
      write('main.go', 'package main\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.stack).toBe('go');
      expect(analysis.verify).toBe('go build ./... && go test ./...');
      expect(analysis.install).toBeNull();
    });

    it('should detect rust projects', () => {
      write('Cargo.toml', '[package]\nname = "demo"\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.stack).toBe('rust');
      expect(analysis.verify).toBe('cargo build && cargo test');
    });
  });

  describe('variables de entorno', () => {
    it('should detect env vars used in the code', () => {
      write('src/config.js', 'export const url = process.env.API_URL;\nexport const key = import.meta.env.VITE_KEY;\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.envVars).toContain('API_URL');
      expect(analysis.envVars).toContain('VITE_KEY');
    });

    it('should ignore OS environment variables', () => {
      write('src/config.js', 'export const p = process.env.PATH;\n');

      const analysis = agentsGenerator.analyze(tmpDir);

      expect(analysis.envVars).not.toContain('PATH');
    });
  });

  describe('generación del archivo', () => {
    beforeEach(() => {
      write('package.json', JSON.stringify({ name: 'demo', scripts: { test: 'vitest' } }));
      write('package-lock.json', '{}');
      write('README.md', '# Demo\n\n> Microherramienta de prueba\n');
    });

    it('should create AGENTS.md when it does not exist', () => {
      const result = agentsGenerator.apply(tmpDir);

      expect(result.status).toBe('created');
      expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(true);

      const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
      expect(content).toContain('# AGENTS.md —');
      expect(content).toContain('npm test');
      expect(content).toContain('Microherramienta de prueba');
    });

    it('should be idempotent', () => {
      agentsGenerator.apply(tmpDir);
      const first = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');

      const second = agentsGenerator.apply(tmpDir);
      const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');

      expect(second.status).toBe('unchanged');
      expect(content).toBe(first);
    });

    it('should preserve manual content outside the generated block', () => {
      write('AGENTS.md', '# Mi repo\n\nRegla manual: no tocar el schema.\n');

      agentsGenerator.apply(tmpDir);
      const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');

      expect(content).toContain('Regla manual: no tocar el schema.');
      expect(content).toContain('npm test');
    });

    it('should regenerate the block without touching manual content', () => {
      write('AGENTS.md', '# Mi repo\n\nRegla manual.\n');
      agentsGenerator.apply(tmpDir);

      // Se edita a mano dentro del bloque generado.
      const edited = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8')
        .replace('npm test', 'npm test -- --watch');
      fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), edited, 'utf8');

      agentsGenerator.apply(tmpDir);
      const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');

      expect(content).toContain('Regla manual.');
      expect(content).toContain('npm test');
      expect(content).not.toContain('-- --watch');
    });

    it('should not write anything on dry-run', () => {
      const result = agentsGenerator.apply(tmpDir, { dryRun: true });

      expect(result.status).toBe('created');
      expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(false);
    });

    it('should overwrite everything with force', () => {
      write('AGENTS.md', '# Mi repo\n\nRegla manual.\n');

      const result = agentsGenerator.apply(tmpDir, { force: true });
      const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');

      expect(result.status).toBe('updated');
      expect(content).not.toContain('Regla manual.');
      expect(content).toContain('npm test');
    });

    it('should create .env.example with the detected variables', () => {
      write('src/config.js', 'export const url = process.env.API_URL;\n');

      const result = agentsGenerator.apply(tmpDir, { envExample: true });

      expect(result.envExample).not.toBeNull();
      const env = fs.readFileSync(path.join(tmpDir, '.env.example'), 'utf8');
      expect(env).toContain('API_URL=');
    });

    it('should never overwrite an existing .env.example', () => {
      write('src/config.js', 'export const url = process.env.API_URL;\n');
      write('.env.example', 'API_URL=http://localhost:8000\n');

      const result = agentsGenerator.apply(tmpDir, { envExample: true });

      expect(result.envExample).toBeNull();
      expect(fs.readFileSync(path.join(tmpDir, '.env.example'), 'utf8')).toContain('http://localhost:8000');
    });

    it('should not create .env.example when there are no env vars', () => {
      const result = agentsGenerator.apply(tmpDir, { envExample: true });

      expect(result.envExample).toBeNull();
      expect(fs.existsSync(path.join(tmpDir, '.env.example'))).toBe(false);
    });
  });
});
