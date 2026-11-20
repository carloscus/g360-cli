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
      expect(resolveModel('reviewer')).toBe('opencode-go/beam-free#max');
    });

    it('retorna el primer modelo para qa-specialist', () => {
      expect(resolveModel('qa-specialist')).toBe(
        'nvidia/minimaxai/minimax-m3.1-flash#none'
      );
    });

    it('retorna el primer modelo para adversary', () => {
      expect(resolveModel('adversary')).toBe(
        'nvidia/minimaxai/minimax-m3.1-flash#none'
      );
    });

    it('retorna el primer modelo para proposer', () => {
      expect(resolveModel('proposer')).toBe(
        'nvidia/stepfun-ai/step-5-preview#medium'
      );
    });

    it('retorna el primer modelo para evaluator', () => {
      expect(resolveModel('evaluator')).toBe('opencode/qwen3.8-flash#xhigh');
    });
  });

  describe('getAllFallbacks', () => {
    it('retorna un objeto con todos los roles definidos', () => {
      const all = getAllFallbacks();
      expect(all).toHaveProperty('orchestrator');
      expect(all).toHaveProperty('architect');
      expect(all).toHaveProperty('reviewer');
      expect(all).toHaveProperty('security-auditor');
      expect(all).toHaveProperty('data-specialist');
      expect(all).toHaveProperty('qa-specialist');
      expect(all).toHaveProperty('adversary');
      expect(all).toHaveProperty('proposer');
      expect(all).toHaveProperty('evaluator');
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
