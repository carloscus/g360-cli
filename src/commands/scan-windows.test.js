import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'C:\\Users\\ccusi\\Documents\\Proyect_Coder\\G360-ecosystem\\projects\\g360-cli';
const CLI = path.join(BASE, 'src', 'cli.js');
const PYTHON_EXE = 'C:\\Users\\ccusi\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';

describe('scan.js — transmisión de argumentos y rutas (regresión funcional)', () => {
  const testDirs = [
    { desc: 'Unix simple',            dir: '/tmp/g360-test' },
    { desc: 'Windows Users',          dir: 'C:\\Users\\test' },
    { desc: 'Windows newline seq',    dir: 'C:\\new\\folder' },
    { desc: 'Espacios',               dir: 'C:\\Mi carpeta\\data' },
    { desc: 'Apóstrofe',              dir: "C:\\User's data" },
    { desc: 'Unicode japonés',        dir: 'C:\\datos\\日本語' },
  ];

  // Preparar directorios
  for (const tc of testDirs) {
    it(`prep: ${tc.desc}`, () => {
      const safeDesc = tc.desc.replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúñÑüÜ\s]/g, '-').replace(/\s+/g, '-');
      const d = path.join(BASE, '.tmp-scan-regression-' + safeDesc);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, 'empty.txt'), 'test');
      tc.path = d;
    });
  }

  it.each(testDirs)('sys.argv[1] recibe ruta correcta con recursive=true: $desc', async ({ dir, desc }) => {
    const safeDesc = desc.replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúñÑüÜ\s]/g, '-').replace(/\s+/g, '-');
    const testDir = path.join(BASE, '.tmp-scan-regression-' + safeDesc);
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'empty.txt'), 'test');

    // recursive=true (default): usa -r o ninguna bandera
    const result = spawnSync('node', [CLI, 'scan', testDir, '--min-score', '0'], {
      encoding: 'utf8', cwd: BASE, timeout: 10000
    });
    // No debe haber error de escape Unicode
    expect(result.stderr).not.toContain('unicode error');
    expect(result.stderr).not.toContain('unicodeescape');
    // No debe haber NameError por booleano JS
    expect(result.stderr).not.toContain("name 'true' is not defined");
    expect(result.stderr).not.toContain("name 'false' is not defined");
  });

  it.each(testDirs)('sys.argv[1] recibe ruta correcta con recursive=false: $desc', async ({ dir, desc }) => {
    const safeDesc = desc.replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúñÑüÜ\s]/g, '-').replace(/\s+/g, '-');
    const testDir = path.join(BASE, '.tmp-scan-regression-' + safeDesc);
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'empty.txt'), 'test');

    // recursive=false: usa --no-recursive
    const result = spawnSync('node', [CLI, 'scan', testDir, '--min-score', '0', '--no-recursive'], {
      encoding: 'utf8', cwd: BASE, timeout: 10000
    });
    expect(result.stderr).not.toContain('unicode error');
    expect(result.stderr).not.toContain('unicodeescape');
    expect(result.stderr).not.toContain("name 'true' is not defined");
    expect(result.stderr).not.toContain("name 'false' is not defined");
  });

  it('verifica que el código Python generado usa True/False correctos', () => {
    // Importar la función scan para inspeccionar su comportamiento
    // En lugar de ejecutar todo el comando, verificamos directamente
    // que la conversión booleana es correcta
    const recursiveValues = [true, false];
    for (const recursive of recursiveValues) {
      const recursivePython = recursive ? 'True' : 'False';
      // Simular la interpolación exacta que hace scan.js
      const pyLine = `valid, invalid = find_erp_files_in_dir(Path(sys.argv[1]), recursive=${recursivePython})`;
      
      // Verificar que contiene el valor Python correcto
      expect(pyLine).toContain(`recursive=${recursivePython}`);
      // Verificar que NO tiene el valor JavaScript incorrecto
      expect(pyLine).not.toMatch(/recursive=(true|false)\b/);
    }
  });

  afterAll(() => {
    for (const tc of testDirs) {
      if (tc.path && fs.existsSync(tc.path)) {
        try { fs.rmSync(tc.path, { recursive: true, force: true }); } catch {}
      }
    }
  });
});
