/**
 * @file data-catalog.test.js
 * @description Tests para el catálogo canónico de datos ERP.
 */
import { describe, it, expect } from 'vitest';
import { DATA_CATALOG, generatePythonValidator, buildAliasMap } from './data-catalog.js';

describe('data-catalog', () => {
  describe('DATA_CATALOG', () => {
    it('tiene versión y fecha de revisión', () => {
      expect(DATA_CATALOG.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(DATA_CATALOG.lastReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('define campos requeridos con tipo money', () => {
      const priceFields = Object.entries(DATA_CATALOG.fields).filter(
        ([, f]) => f.type === 'money' && f.required
      );
      expect(priceFields.length).toBeGreaterThan(0);
      const [name, field] = priceFields[0];
      expect(field.format).toBe('PEN');
    });

    it('define campo PRODUCT_CODE con aliases', () => {
      const pc = DATA_CATALOG.fields.PRODUCT_CODE;
      expect(pc.alias).toContain('SKU');
      expect(pc.alias).toContain('CODIGO');
      expect(pc.type).toBe('string');
      expect(pc.required).toBe(true);
    });

    it('incluye tipo fecha con soporte iso8601', () => {
      const fd = DATA_CATALOG.fields.FECHA_EMISION;
      expect(fd.type).toBe('date');
      expect(fd.format).toBe('iso8601');
    });
  });

  describe('generatePythonValidator', () => {
    it('genera función validate_precio_base', () => {
      const code = generatePythonValidator();
      expect(code).toContain('def validate_precio_base(');
      expect(code).toContain('Decimal');
      expect(code).toContain('replace(".", "").replace(",", ".")');
    });

    it('genera función validate_fecha_emision', () => {
      const code = generatePythonValidator();
      expect(code).toContain('def validate_fecha_emision(');
      expect(code).toContain('%d/%m/%Y');
      expect(code).toContain('%Y-%m-%d');
    });

    it('funciones son llamadas consistentes con nombres de campo', () => {
      const code = generatePythonValidator();
      const fieldNames = Object.keys(DATA_CATALOG.fields);
      for (const name of fieldNames) {
        const fnName = `validate_${name.toLowerCase()}`;
        expect(code).toContain(fnName);
      }
    });

    it('marcador de auto-generado está presente', () => {
      const code = generatePythonValidator();
      expect(code).toContain('Auto-generado desde data-catalog.json');
    });
  });

  describe('buildAliasMap', () => {
    it('mapea SKU → PRODUCT_CODE', () => {
      const map = buildAliasMap();
      expect(map['sku']).toBe('PRODUCT_CODE');
      expect(map['codigo']).toBe('PRODUCT_CODE');
    });

    it('normaliza tildes (DESCRIPCIÓN → descripcion)', () => {
      const map = buildAliasMap();
      expect(map['descripcion']).toBe('PRODUCT_NAME');
    });

    it('PRECIO mapea a PRECIO_BASE', () => {
      const map = buildAliasMap();
      expect(map['precio']).toBe('PRECIO_BASE');
      expect(map['pventa']).toBe('PRECIO_BASE');
    });

    it('tiene al menos 20 entradas', () => {
      const map = buildAliasMap();
      expect(Object.keys(map).length).toBeGreaterThanOrEqual(20);
    });
  });
});
