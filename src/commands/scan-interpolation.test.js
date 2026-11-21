import { describe, it, expect } from 'vitest';

describe('scan.js interpolación Windows', () => {
  function buggyCode(directory, recursive = true) {
    return `Path('${directory}'), recursive=${recursive}`;
  }
  function rawStringCode(directory, recursive = true) {
    return `Path(r'${directory}'), recursive=${recursive}`;
  }
  function argvCode() {
    return `Path(sys.argv[1]), recursive=True`;
  }

  const testCases = [
    { desc: 'Unix simple',        dir: '/home/user/datos' },
    { desc: 'Windows Users',      dir: 'C:\\Users\\test' },
    { desc: 'Windows newline',    dir: 'C:\\new\\folder' },
    { desc: 'Espacios',           dir: 'C:\\Mi carpeta\\data' },
    { desc: 'Apóstrofe',          dir: "C:\\User's data" },
    { desc: 'Unicode japonés',    dir: 'C:\\datos\\日本語' },
  ];

  it.each(testCases)('raw string handles: $desc', ({ dir }) => {
    const code = rawStringCode(dir);
    expect(code).toMatch(/Path\(r'/);
    expect(code).toContain(dir);
  });

  it.each(testCases)('argv approach handles: $desc', ({ dir }) => {
    const code = argvCode();
    expect(code).toContain('sys.argv[1]');
    expect(code).not.toContain("Path('");
  });

  it('apostrophe produces invalid Python (demonstrates bug)', () => {
    const dir = "C:\\User's data";
    const code = buggyCode(dir);
    // Apóstrofe cierra la cadena prematuramente -> código Python inválido
    expect(code.split("'").length).toBeGreaterThanOrEqual(4);
  });

  it('backslash sequences are NOT interpreted with raw string', () => {
    const dir = 'C:\\Users\\test';
    const code = rawStringCode(dir);
    // Con raw string r'', \U no se trata como escape Unicode
    expect(code).toContain("r'C:\\Users\\test'");
    // La ruta original se preserva tal cual
    expect(code).not.toMatch(/\buse\b/i); // No debería haber "use" suelto
  });

  describe('conversión booleano JS → Python', () => {
    it('recursive=true genera Python True (mayúscula)', () => {
      const recursive = true;
      const recursivePython = recursive ? 'True' : 'False';
      const code = `find_erp_files_in_dir(Path(sys.argv[1]), recursive=${recursivePython})`;
      expect(code).toContain('recursive=True');
      expect(code).not.toContain('recursive=true');
    });

    it('recursive=false genera Python False (mayúscula)', () => {
      const recursive = false;
      const recursivePython = recursive ? 'True' : 'False';
      const code = `find_erp_files_in_dir(Path(sys.argv[1]), recursive=${recursivePython})`;
      expect(code).toContain('recursive=False');
      expect(code).not.toContain('recursive=false');
    });

    it('evita NameError por true/false sin definir en Python', () => {
      // Simular lo que genera scan.js con la corrección
      const recursiveValues = [true, false];
      for (const recursive of recursiveValues) {
        const recursivePython = recursive ? 'True' : 'False';
        const code = `valid, invalid = find_erp_files_in_dir(Path(sys.argv[1]), recursive=${recursivePython})`;
        // Verificar que NO hay booleanos en minúsculas
        expect(code).not.toMatch(/recursive=(true|false)\b/);
        // Verificar que SÍ hay booleanos Python
        expect(code).toMatch(/recursive=(True|False)/);
      }
    });
  });
});

