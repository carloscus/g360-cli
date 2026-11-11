/**
 * @file utils.test.js
 * @description Tests para utilidades de fechas
 */

import { describe, it, expect } from 'vitest';
import { diffDays } from './utils.js';

describe('diffDays', () => {
  it('should return positive days for valid date range', () => {
    expect(diffDays('2026-11-01', '2026-11-10')).toBe(9);
  });

  it('should return 0 when end date is before start date', () => {
    expect(diffDays('2026-11-10', '2026-11-01')).toBe(0);
  });

  it('should return 0 for same dates', () => {
    expect(diffDays('2026-11-01', '2026-11-01')).toBe(0);
  });

  it('should return 0 for invalid dates', () => {
    expect(diffDays('invalid', '2026-11-10')).toBe(0);
    expect(diffDays('2026-11-01', 'also-invalid')).toBe(0);
  });

  it('should handle year boundaries', () => {
    expect(diffDays('2025-12-31', '2026-01-01')).toBe(1);
  });
});
