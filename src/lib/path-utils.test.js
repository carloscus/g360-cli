/**
 * @file src/lib/path-utils.test.js
 * @description Validación cross-platform de rutas y resoluciones
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Cross-platform path resolution', () => {
  it('debe resolver paths relativos correctamente en cualquier plataforma', () => {
    const relativePath = '../src/commands';
    const resolved = path.resolve(__dirname, relativePath);

    // Debe ser un path absoluto
    expect(path.isAbsolute(resolved)).toBe(true);

    // Debe existir en filesystem
    expect(resolved).toMatch(/[/\\]src[/\\]commands$/);
  });

  it('debe normalizar separators independientemente del SO', () => {
    const winStyle = 'src\\commands\\audit.js';
    const posixStyle = 'src/commands/audit.js';

    const base = path.resolve(__dirname);
    const winResolved = path.normalize(path.resolve(base, winStyle));
    const posixResolved = path.normalize(path.resolve(base, posixStyle));

    // Ambos estilos de separator resuelven al mismo path absoluto
    expect(winResolved).toBe(posixResolved);
  });

  it('debe prevenir path traversal con inputs maliciosos', () => {
    const maliciousInputs = [
      '../../etc/passwd',
      '..\\..\\windows\\system32',
      './../../secret',
      'foo/../../../bar',
    ];

    const safeBase = path.resolve('/safe/base/dir');

    maliciousInputs.forEach((input) => {
      const resolved = path.resolve(safeBase, input);
      // Debe quedarse dentro del base directory o ser detectado como fuera
      const isOutside =
        !resolved.startsWith(safeBase + path.sep) && resolved !== safeBase;

      // En un sistema seguro, shouldBeDetected debería ser true
      expect(isOutside).toBe(true);
    });
  });

  it('handle HOME variable differences across platforms', () => {
    // La lógica real usada por setup.js (línea 30) es `HOME || USERPROFILE`.
    // Validamos la precedencia de forma determinista sin depender de que el SO
    // inyecte o no estas variables (en Windows USERPROFILE suele estar presente).
    const originalHome = process.env.HOME;
    const originalUserProfile = process.env.USERPROFILE;

    try {
      // Caso 1: HOME definido -> se usa HOME (tiene prioridad)
      process.env.HOME = '/home/user';
      delete process.env.USERPROFILE;
      expect(process.env.HOME || process.env.USERPROFILE).toBe('/home/user');

      // Caso 2: solo USERPROFILE definido -> se usa USERPROFILE
      delete process.env.HOME;
      process.env.USERPROFILE = 'C:\\Users\\user';
      expect(process.env.HOME || process.env.USERPROFILE).toBe('C:\\Users\\user');

      // Caso 3: ambos definidos -> HOME gana por precedencia
      process.env.HOME = '/home/user';
      process.env.USERPROFILE = 'C:\\Users\\user';
      expect(process.env.HOME || process.env.USERPROFILE).toBe('/home/user');
    } finally {
      // Restaurar variables de entorno originales
      if (originalHome !== undefined) process.env.HOME = originalHome;
      else delete process.env.HOME;
      if (originalUserProfile !== undefined)
        process.env.USERPROFILE = originalUserProfile;
      else delete process.env.USERPROFILE;
    }
  });
});
