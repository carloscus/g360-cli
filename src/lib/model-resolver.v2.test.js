import { describe, it, expect } from 'vitest';
import { normalizeFallbacks, loadFallbacks } from './model-resolver.js';

describe('Adaptador JSON v1/v2 (P2.4)', () => {
  describe('Formato v1 (arreglos en raíz)', () => {
    it('normaliza configuración v1 válida con 9 roles', () => {
      const v1 = {
        reviewer: ['opencode-go/beam-free#max', 'opencode/minimax-m3.1-flash-free#max'],
        architect: ['nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none']
      };
      const result = normalizeFallbacks(v1);
      expect(result).toEqual({
        reviewer: ['opencode-go/beam-free#max', 'opencode/minimax-m3.1-flash-free#max'],
        architect: ['nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none']
      });
    });
  });

  describe('Formato v2 (roles con primary/fallbacks)', () => {
    it('normaliza configuración v2 válida', () => {
      const v2 = {
        version: 2,
        roles: {
          reviewer: {
            primary: 'opencode-go/beam-free#max',
            fallbacks: ['opencode/minimax-m3.1-flash-free#max', 'agnes/agnes-3.0-flash#max']
          },
          architect: {
            primary: 'nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none',
            fallbacks: ['nvidia/minimaxai/minimax-m3.1-flash#none']
          }
        }
      };
      const result = normalizeFallbacks(v2);
      expect(result).toEqual({
        reviewer: ['opencode-go/beam-free#max', 'opencode/minimax-m3.1-flash-free#max', 'agnes/agnes-3.0-flash#max'],
        architect: ['nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none', 'nvidia/minimaxai/minimax-m3.1-flash#none']
      });
    });

    it('rechaza v2 con rol que no es objeto', () => {
      const v2 = { version: 2, roles: { reviewer: 'no-es-objeto' } };
      expect(() => normalizeFallbacks(v2)).toThrow(/Rol 'reviewer' en v2 debe ser un objeto/);
    });

    it('rechaza v2 con primary vacío', () => {
      const v2 = { version: 2, roles: { reviewer: { primary: '', fallbacks: ['m2'] } } };
      expect(() => normalizeFallbacks(v2)).toThrow(/primary debe ser string no vacío/);
    });

    it('rechaza v2 con fallbacks que no es arreglo', () => {
      const v2 = { version: 2, roles: { reviewer: { primary: 'm1', fallbacks: 'no-arreglo' } } };
      expect(() => normalizeFallbacks(v2)).toThrow(/fallbacks debe ser un arreglo/);
    });

    it('rechaza v2 con primary duplicado en fallbacks', () => {
      const v2 = { version: 2, roles: { reviewer: { primary: 'm1', fallbacks: ['m1', 'm2'] } } };
      expect(() => normalizeFallbacks(v2)).toThrow(/primary no debe repetirse en fallbacks/);
    });

    it('rechaza v2 con fallback vacío', () => {
      const v2 = { version: 2, roles: { reviewer: { primary: 'm1', fallbacks: ['', 'm2'] } } };
      expect(() => normalizeFallbacks(v2)).toThrow(/fallback inválido/);
    });
  });

  describe('Detección de versión y estructura', () => {
    it('rechaza versión declarada que contradice estructura (versión 2 sin roles)', () => {
      const ambiguous = { version: 2, reviewer: ['m1'] };
      expect(() => normalizeFallbacks(ambiguous)).toThrow(/Estructura de configuración de modelos no reconocida/);
    });

    it('rechaza versión desconocida', () => {
      const unknown = { version: 3, reviewer: ['m1'] };
      expect(() => normalizeFallbacks(unknown)).toThrow(/Versión de configuración no soportada/);
    });

    it('rechaza null', () => {
      expect(() => normalizeFallbacks(null)).toThrow(/no reconocida/);
    });

    it('rechaza arreglo en raíz', () => {
      expect(() => normalizeFallbacks(['a', 'b'])).toThrow(/no reconocida/);
    });

    it('rechaza string en raíz', () => {
      expect(() => normalizeFallbacks('no-es-objeto')).toThrow(/no reconocida/);
    });

    it('rechaza objeto vacío', () => {
      expect(() => normalizeFallbacks({})).toThrow(/no reconocida/);
    });
  });

  describe('Compatibilidad v1 ↔ v2 (equivalencia)', () => {
    it('configuración v1 y v2 equivalentes producen salida idéntica', () => {
      const v1 = {
        reviewer: ['opencode-go/beam-free#max', 'opencode/minimax-m3.1-flash-free#max'],
        architect: ['nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none', 'opencode/glm-5.3-flash#none']
      };

      const v2 = {
        version: 2,
        roles: {
          reviewer: {
            primary: 'opencode-go/beam-free#max',
            fallbacks: ['opencode/minimax-m3.1-flash-free#max']
          },
          architect: {
            primary: 'nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#none',
            fallbacks: ['opencode/glm-5.3-flash#none']
          }
        }
      };

      expect(normalizeFallbacks(v1)).toEqual(normalizeFallbacks(v2));
    });

    it('orden de modelos se preserva en v2 (primary primero, luego fallbacks)', () => {
      const v2 = {
        version: 2,
        roles: {
          reviewer: {
            primary: 'modelo-principal',
            fallbacks: ['modelo-alt-1', 'modelo-alt-2', 'modelo-alt-3']
          }
        }
      };
      const result = normalizeFallbacks(v2);
      expect(result.reviewer).toEqual(['modelo-principal', 'modelo-alt-1', 'modelo-alt-2', 'modelo-alt-3']);
    });
  });

  describe('loadFallbacks con archivo real', () => {
    it('carga el archivo model-fallbacks.json actual (formato v1)', () => {
      const result = loadFallbacks();
      expect(result).toHaveProperty('reviewer');
      expect(result).toHaveProperty('architect');
      expect(Array.isArray(result.reviewer)).toBe(true);
      expect(result.reviewer.length).toBeGreaterThan(0);
      expect(result.reviewer[0]).toBe('opencode-go/beam-free#max');
    });
  });
});