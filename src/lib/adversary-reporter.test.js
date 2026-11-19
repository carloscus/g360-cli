/**
 * @file adversary-reporter.test.js
 * @description Tests para el helper de reportes del agente adversary.
 * No usa mocks: todas las funciones son puras y deterministas.
 */

import { describe, it, expect } from 'vitest';
import { formatFindings, createReport } from './adversary-reporter.js';

const finding = {
  title: 'Suposición no justificada de permisos',
  severity: 'CRÍTICO',
  location: 'src/specs/data-import.md:45',
  problem: 'Se asume que el usuario siempre tiene permisos de admin.',
  consequence: 'Error 403 en producción, datos no procesados de forma silenciosa.',
};

const allSeverities = [
  { ...finding, title: 'Hallazgo crítico', severity: 'CRÍTICO' },
  { ...finding, title: 'Hallazgo mayor', severity: 'MAYOR' },
  { ...finding, title: 'Hallazgo menor', severity: 'MENOR' },
];

describe('adversary-reporter', () => {
  describe('formatFindings', () => {
    it('formatea un hallazgo con ID ADV-001 y todos sus campos', () => {
      const output = formatFindings([finding]);
      expect(output).toContain('### ADV-001 Suposición no justificada de permisos');
      expect(output).toContain('- **Severidad:** CRÍTICO');
      expect(output).toContain('- **Ubicación:** src/specs/data-import.md:45');
      expect(output).toContain('- **Problema:** Se asume que el usuario siempre tiene permisos de admin.');
      expect(output).toContain('- **Consecuencia:** Error 403 en producción, datos no procesados de forma silenciosa.');
    });

    it('numera correlativamente varios hallazgos', () => {
      const output = formatFindings(allSeverities);
      expect(output).toContain('### ADV-001 Hallazgo crítico');
      expect(output).toContain('### ADV-002 Hallazgo mayor');
      expect(output).toContain('### ADV-003 Hallazgo menor');
    });

    it('retorna cadena vacía cuando no hay hallazgos', () => {
      expect(formatFindings([])).toBe('');
    });
  });

  describe('createReport', () => {
    it('genera reporte JSON con timestamp, spec y conteos por severidad', () => {
      const report = createReport('docs/spec/import.md', allSeverities);
      expect(report.spec).toBe('docs/spec/import.md');
      expect(report.total_findings).toBe(3);
      expect(report.critical).toBe(1);
      expect(report.major).toBe(1);
      expect(report.minor).toBe(1);
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(Array.isArray(report.findings)).toBe(true);
      expect(report.findings).toHaveLength(3);
    });

    it('reporte vacío cuando no hay hallazgos', () => {
      const report = createReport('docs/spec/clean.md', []);
      expect(report.total_findings).toBe(0);
      expect(report.critical).toBe(0);
      expect(report.major).toBe(0);
      expect(report.minor).toBe(0);
      expect(report.findings).toEqual([]);
    });
  });
});
