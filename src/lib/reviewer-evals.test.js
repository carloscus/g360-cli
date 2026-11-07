/**
 * @file reviewer-evals.test.js
 * @description Evals estáticos para medir la capacidad de detección
 * del sistema de revisión G360.
 *
 * Basados en lecciones reales:
 * - light-dark() invertido (1.20.2)
 * - Credenciales expuestas (audit security)
 * - Tests deshonestos (regla AGENTS.md)
 *
 * Nota: estos son CHECKERS ESTÁTICOS que replican criterios de
 * HANDOFF.md, no invocan al LLM. Miden qué tan bien el sistema
 * de reglas detecta problemas documentados.
 */

import { describe, it, expect } from 'vitest';
import { EVAL_CASES, runAllEvals } from './reviewer-evals.js';

describe('reviewer-evals', () => {
  describe('runAllEvals', () => {
    let report;

    beforeEach(() => {
      report = runAllEvals();
    });

    it('debe ejecutar todos los casos', () => {
      expect(report.total).toBe(EVAL_CASES.length);
    });

    it('no debe tener falsos positivos (caso clean difuso)', () => {
      expect(report.falsePositives).toBe(0);
    });

    it('debe detectar todos los critical bugs documentados', () => {
      const criticalMissed = report.results.filter(
        (r) => r.severity === 'critical' && !r.detected
      );
      expect(criticalMissed).toHaveLength(0);
    });

    it('debe detectar al menos 80% de los warnings', () => {
      const warnings = report.results.filter((r) => r.severity === 'warning');
      const detectedWarnings = warnings.filter((r) => r.detected).length;
      const rate = detectedWarnings / warnings.length;
      expect(rate).toBeGreaterThanOrEqual(0.8);
    });

    it('reporte por categoría debe tener todas las categorías', () => {
      const expectedCategories = new Set([
        'seguridad',
        'tests-honestos',
        'lógica',
        'autosuficiencia',
        'mantenibilidad',
        'dependencias',
        'fallo-ruidoso',
        'tokens',
        'nomenclatura',
        'composición',
        'control',
      ]);
      const actual = new Set(Object.keys(report.byCategory));
      for (const cat of expectedCategories) {
        expect(actual).toContain(cat);
      }
    });

    it('caso control positivo (clean diff) no debe detectarse', () => {
      const clean = report.results.find((r) => r.id === 'clean-diff');
      expect(clean.detected).toBe(false);
    });

    it('caso multi-bug-diff debe detectar ambos bugs', () => {
      const multi = report.results.find((r) => r.id === 'multi-bug-diff');
      expect(multi.findings.length).toBeGreaterThanOrEqual(2);
    });

    it('debe generar reporte legible con tasas', () => {
      expect(report).toMatchObject({
        total: expect.any(Number),
        detected: expect.any(Number),
        missed: expect.any(Number),
        falsePositives: expect.any(Number),
        byCategory: expect.any(Object),
        bySeverity: expect.any(Object),
      });
    });

    it('debe reportar tasa de detección numérica', () => {
      const rate = report.total > 0 ? report.detected / report.total : 0;
      // Como línea base: los checkers estáticos deben detectar todo
      expect(rate).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('casos individuales', () => {
    it('credential-hardcoded: detecta URL con credencial', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'credential-hardcoded');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('assert-true-test: detecta assert(true).toBe(true)', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'assert-true-test');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('skipped-test: detecta it.skip', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'skipped-test');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('regex-inverted-order: detecta inversión de argumentos', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'regex-inverted-order');
      expect(tc.diff.new).not.toEqual(tc.diff.old);
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('absolute-path-machine: detecta rutas C:\\Users\\', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'absolute-path-machine');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('long-function-no-split: detecta funciones >80 líneas', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'long-function-no-split');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('silent-catch: detecta catch vacío', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'silent-catch');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('sql-injection-risk: detecta interpolación en SQL', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'sql-injection-risk');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('logic-error-price: detecta inversión de división', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'logic-error-price');
      expect(tc.check(tc.diff.new)).toBe(true);
    });

    it('clean-diff: no genera falso positivo', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'clean-diff');
      expect(tc.check(tc.diff.new)).toBe(false);
    });

    it('multi-bug-diff: detecta ambos bugs', () => {
      const tc = EVAL_CASES.find((c) => c.id === 'multi-bug-diff');
      const detections = tc.checks.filter((fn) => fn(tc.diff.new)).length;
      expect(detections).toBeGreaterThanOrEqual(2);
    });
  });
});
