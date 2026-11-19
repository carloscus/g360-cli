/**
 * @file audit-json.test.js
 * @description Tests para el flag --json del comando audit
 */

import { describe, it, expect } from 'vitest';

describe('audit command --json', () => {
  it('produce salida JSON válida con propiedades esperadas', async () => {
    const { audit } = await import('../commands/audit.js');

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await audit('.', { json: true, autonomy: false });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join(' ');
    const parsed = JSON.parse(output);

    expect(parsed).toHaveProperty('passed');
    expect(parsed).toHaveProperty('failed');
    expect(parsed).toHaveProperty('warnings');
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('issues');
    expect(Array.isArray(parsed.issues)).toBe(true);
    expect(typeof parsed.passed).toBe('number');
    expect(typeof parsed.failed).toBe('number');
    expect(typeof parsed.warnings).toBe('number');
    expect(typeof parsed.total).toBe('number');
  });

  it('sin --json el comportamiento sigue siendo texto plano', async () => {
    const { audit } = await import('../commands/audit.js');

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await audit('.', { autonomy: false });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toContain('G360 Project Audit');
    expect(output).toContain('Audit Results');
    expect(output).not.toContain('"passed"');
  });
});
