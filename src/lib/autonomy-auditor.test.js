/**
 * @file autonomy-auditor.test.js
 * @description Tests para los checks de autosuficiencia
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { autonomyAuditor } from './autonomy-auditor.js';

describe('autonomyAuditor', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g360-autonomy-'));
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

  /**
   * Busca un finding por su id.
   * @param {Object[]} findings - Findings del check
   * @param {string} id - Id del check
   * @returns {Object|undefined}
   */
  function byId(findings, id) {
    return findings.find((finding) => finding.id === id);
  }

  describe('repo autosuficiente', () => {
    beforeEach(() => {
      write('AGENTS.md', '# Repo\n\nVerificacion: `npm test`\n');
      write('README.md', '# Repo\n\n## Desarrollo\n\n```bash\nnpm test\n```\n');
      write('package.json', JSON.stringify({ name: 'demo', dependencies: { chalk: '5.0.0' } }));
      write('package-lock.json', '{}');
      write('.env.example', 'API_URL=http://localhost\n');
      write('src/app.js', 'export const run = () => 1;\n');
      write('tests/app.test.js', "import { it, expect } from 'vitest';\nit('works', () => { expect(1).toBe(1); });\n");
    });

    it('should pass every check', () => {
      const { status, findings } = autonomyAuditor.check(tmpDir);

      expect(status).toBe('pass');
      expect(findings.every((finding) => finding.status === 'pass')).toBe(true);
      expect(findings).toHaveLength(6);
    });

    it('should report the verification command as declared', () => {
      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'verification').status).toBe('pass');
      expect(byId(findings, 'instructions').status).toBe('pass');
    });
  });

  describe('repo incompleto', () => {
    it('should fail when AGENTS.md, README and verification command are missing', () => {
      const { status, findings } = autonomyAuditor.check(tmpDir);

      expect(status).toBe('fail');
      expect(byId(findings, 'instructions').status).toBe('fail');
      expect(byId(findings, 'verification').status).toBe('fail');
      expect(byId(findings, 'readme').status).toBe('fail');
    });

    it('should accept CLAUDE.md as instructions file', () => {
      write('CLAUDE.md', '# Repo\n\nVerificacion: `pytest`\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'instructions').status).toBe('pass');
      expect(byId(findings, 'verification').status).toBe('pass');
    });

    it('should warn when verification command only lives in the README', () => {
      write('README.md', '# Repo\n\n## Tests\n\n```bash\nnpm test\n```\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'verification').status).toBe('warn');
    });
  });

  describe('dependencias', () => {
    it('should warn when dependencies are declared without a lockfile', () => {
      write('package.json', JSON.stringify({ name: 'demo', dependencies: { chalk: '5.0.0' } }));

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'lockfile').status).toBe('warn');
    });

    it('should pass when a lockfile exists', () => {
      write('package.json', JSON.stringify({ name: 'demo', dependencies: { chalk: '5.0.0' } }));
      write('pnpm-lock.yaml', 'lockfileVersion: 9\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'lockfile').status).toBe('pass');
    });

    it('should mark lockfile check as not applicable for projects without dependencies', () => {
      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'lockfile').status).toBe('n/a');
    });
  });

  describe('variables de entorno', () => {
    it('should warn when the code reads env vars and there is no .env.example', () => {
      write('src/config.js', 'export const url = process.env.API_URL;\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'env-example').status).toBe('warn');
    });

    it('should pass when .env.example documents the variables', () => {
      write('src/config.js', 'export const url = process.env.API_URL;\n');
      write('.env.example', 'API_URL=http://localhost\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'env-example').status).toBe('pass');
    });

    it('should detect python env access', () => {
      write('src/config.py', 'import os\nURL = os.environ["API_URL"]\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'env-example').status).toBe('warn');
    });
  });

  describe('tests honestos', () => {
    it('should warn about skipped vitest tests', () => {
      write('tests/app.test.js', "import { it } from 'vitest';\nit.skip('pendiente', () => {});\n");

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'skipped-tests').status).toBe('warn');
      expect(byId(findings, 'skipped-tests').message).toContain('app.test.js');
    });

    it('should warn about pytest xfail markers', () => {
      write('tests/test_app.py', 'import pytest\n\n@pytest.mark.xfail\ndef test_pendiente():\n    pass\n');

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'skipped-tests').status).toBe('warn');
    });

    it('should not warn about conditional skips (missing fixtures)', () => {
      write('tests/test_app.py', [
        'import pytest',
        '',
        '@pytest.mark.skipif(not RUTA.exists(), reason="sin datos")',
        'def test_con_datos():',
        '    assert True',
        ''
      ].join('\n'));

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'skipped-tests').status).toBe('pass');
      expect(byId(findings, 'skipped-tests').message).toContain('skip condicional');
    });

    it('should ignore tests inside vendored templates', () => {
      write('g360/templates/python-flet/src/test_app.py', [
        'import pytest',
        '',
        '@pytest.mark.xfail',
        'def test_template_placeholder():',
        '    assert False',
        ''
      ].join('\n'));

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'skipped-tests').status).toBe('pass');
      expect(byId(findings, 'skipped-tests').message).toBe('Sin tests deshabilitados detectados');
    });

    it('should not flag normal test files', () => {
      write('tests/app.test.js', "import { it, expect } from 'vitest';\nit('works', () => { expect(true).toBe(true); });\n");

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'skipped-tests').status).toBe('pass');
    });

    it('should not flag skip patterns mentioned inside strings or comments', () => {
      write('tests/fixtures.test.js', [
        "import { it, expect } from 'vitest';",
        "const sample = \"it.skip('pendiente', () => {});\";",
        '// it.skip(\'comentado\', () => {});',
        "it('works', () => { expect(sample).toBeTypeOf('string'); });"
      ].join('\n'));

      const { findings } = autonomyAuditor.check(tmpDir);

      expect(byId(findings, 'skipped-tests').status).toBe('pass');
    });
  });
});
