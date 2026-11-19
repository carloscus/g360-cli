/**
 * @file model-resolver.test.js
 * @description Tests para la cadena de fallback de modelos por rol.
 */

import { describe, it, expect } from 'vitest';
import { resolveModel, getAllFallbacks } from './model-resolver.js';

describe('model-resolver', () => {
  describe('resolveModel', () => {
    it('retorna el primer modelo de la lista para architect', () => {
      const model = resolveModel('architect');
      expect(typeof model).toBe('string');
      expect(model).toBe('nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none');
    });

    it('retorna null para un rol desconocido', () => {
      expect(resolveModel('rol-inexistente')).toBe(null);
    });

    it('retorna el primer modelo para reviewer', () => {
      expect(resolveModel('reviewer')).toBe('opencode/glm-5.3-flash#max');
    });

    it('retorna el primer modelo para qa_specialist', () => {
      expect(resolveModel('qa_specialist')).toBe(
        'nvidia/minimaxai/minimax-m3.1-flash#none'
      );
    });
  });

  describe('getAllFallbacks', () => {
    it('retorna un objeto con todos los roles definidos', () => {
      const all = getAllFallbacks();
      expect(all).toHaveProperty('orchestrator');
      expect(all).toHaveProperty('architect');
      expect(all).toHaveProperty('reviewer');
      expect(all).toHaveProperty('security_auditor');
      expect(all).toHaveProperty('data_specialist');
      expect(all).toHaveProperty('qa_specialist');
    });

    it('cada rol tiene al menos un modelo', () => {
      const all = getAllFallbacks();
      for (const [role, models] of Object.entries(all)) {
        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBeGreaterThan(0);
      }
    });
  });
});
