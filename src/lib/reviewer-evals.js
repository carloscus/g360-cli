/**
 * @file reviewer-evals.js
 * @description Evals estáticos para medir la capacidad de detección
 * del sistema de revisión G360. Cada caso tiene un bug sembrado y un
 * patrón que el reviewer debería detectar.
 *
 * Estos son CHECKERS ESTÁTICOS que replican criterios documentados en
 * HANDOFF.md — no invoca al LLM. Sirven como línea base métrica:
 * "si el sistema revisara este diff con los criterios actuales,
 * detectaría X de Y bugs críticos".
 *
 * Casos diseñados tras lecciones reales:
 * - light-dark() invertido (1.20.2)
 * - credenciales hardcodeadas (reportadas en auditoría)
 * - assert true / skip (tests deshonestos)
 */

/**
 * Cada eval es un diff (old → new) con metadatos de qué se busca.
 * Los checks son funciones puras que reciben el contenido nuevo.
 */
export const EVAL_CASES = [
  /** Credencial hardcodeada — CRÍTICO */
  {
    id: 'credential-hardcoded',
    severity: 'critical',
    category: 'seguridad',
    description: 'URL de base de datos con credenciales en código',
    diff: {
      old: 'const DB_URL = process.env.DB_URL;',
      new: 'const DB_URL = "postgresql://admin:p@ssw0rd@db.internal:5432/erp";',
    },
    check: (c) => /"(postgresql|mysql|mongodb|sqlite):\/\/[^"]+@/.test(c),
    expected: 'detect',
  },

  /** Test con assert true — CRÍTICO */
  {
    id: 'assert-true-test',
    severity: 'critical',
    category: 'tests-honestos',
    description: 'Test que consagra falso positivo con assert true',
    diff: {
      old: "it('calcula precio', () => { expect(calc(2,3)).toBe(5); });",
      new: "it('calcula precio', () => { expect(true).toBe(true); });",
    },
    check: (c) => /expect\s*\(\s*true\s*\)\.toBe\s*\(\s*true\s*\)/.test(c),
    expected: 'detect',
  },

  /** Test skipped — CRÍTICO */
  {
    id: 'skipped-test',
    severity: 'critical',
    category: 'tests-honestos',
    description: 'Test deshabilitado con skip',
    diff: {
      old: "it('suma correctamente', () => { ... });",
      new: "it.skip('suma correctamente', () => { ... });",
    },
    check: (c) => /\bit\.skip\s*\(/.test(c),
    expected: 'detect',
  },

  /** Regex invertido — CRÍTICO */
  {
    id: 'regex-inverted-order',
    severity: 'critical',
    category: 'lógica',
    description: 'Función que invierte argumentos de light-dark()',
    diff: {
      old: 'function lightDark(light, dark) { return `light-dark(${light}, ${dark})` }',
      new: 'function lightDark(light, dark) { return `light-dark(${dark}, ${light})` }',
    },
    check: (c) => /light-dark\(\$\{(\w+)\}, \$\{(\w+)\}\)/.test(c),
    expected: 'detect',
  },

  /** Ruta absoluta de máquina — ADVERTENCIA */
  {
    id: 'absolute-path-machine',
    severity: 'warning',
    category: 'autosuficiencia',
    description: 'Ruta absoluta hardcodeada con usuario local',
    diff: {
      old: "const configPath = path.join(__dirname, '../config');",
      // En JS, '\\\\' = dos backslashes en el string → C:\\Users\\ccusi\\...
      new: "const configPath = 'C:\\\\Users\\\\ccusi\\\\Documents\\\\Proyect_Coder\\\\config';",
    },
    check: (c) => c.includes('C:\\\\Users\\\\'),
    expected: 'detect',
  },

  /** Función >80 líneas sin dividir — ADVERTENCIA */
  {
    id: 'long-function-no-split',
    severity: 'warning',
    category: 'mantenibilidad',
    description: 'Función de 120 líneas que debería dividirse',
    diff: {
      old: '',
      new: Array.from({ length: 120 }, (_, i) => `  // line ${i + 1}`).join('\n'),
    },
    check: (c) => c.split('\n').filter((l) => l.trim().length > 0).length > 80,
    expected: 'detect',
  },

  /** Comentario explica qué hace (no por qué) — ADVERTENCIA */
  {
    id: 'comment-explains-what-not-why',
    severity: 'warning',
    category: 'mantenibilidad',
    description: 'Comentario que describe el qué en vez del por qué',
    diff: {
      old: '// procesa los datos del ERP',
      new: '// procesa los datos del ERP (lee columns, normaliza, guarda)',
    },
    check: (c) =>
      /^\/\/.*\b(lee|recorre|convierte|guarda|procesa)\b.*\(.*\)/m.test(c),
    expected: 'detect',
  },

  /** Dependencia nueva sin package.json — ADVERTENCIA */
  {
    id: 'undclared-dependency',
    severity: 'warning',
    category: 'dependencias',
    description: 'import de módulo que no está en package.json',
    diff: {
      old: "import lodash from 'lodash';",
      new: "import lodash from 'lodash';\nimport moment from 'moment';",
    },
    check: (c) => /import\s+\w+\s+from\s+['"]moment['"]/.test(c),
    expected: 'detect',
  },

  /** Error de lógica: precio base mal calculado — CRÍTICO */
  {
    id: 'logic-error-price',
    severity: 'critical',
    category: 'lógica',
    description: 'Precio base calculado como precio / cantidad (invertido)',
    diff: {
      old: 'const basePrice = total / qty;',
      new: 'const basePrice = qty / total;',
    },
    check: (c) => /const basePrice = qty \/ total/.test(c),
    expected: 'detect',
  },

  /** SQL potencialmente inyectable — CRÍTICO */
  {
    id: 'sql-injection-risk',
    severity: 'critical',
    category: 'seguridad',
    description: 'Query SQL construida con string interpolation',
    diff: {
      old: "const sql = 'SELECT * FROM users WHERE id = ?';",
      new: 'const sql = `SELECT * FROM users WHERE id = ${userId}`;',
    },
    check: (c) => /`SELECT.*\$\{/.test(c),
    expected: 'detect',
  },

  /** Catch silencioso — ADVERTENCIA */
  {
    id: 'silent-catch',
    severity: 'warning',
    category: 'fallo-ruidoso',
    description: 'Catch sin log ni re-throw (error silenciado)',
    diff: {
      old: 'try { run(); } catch (e) { logger.error(e); throw e; }',
      new: 'try { run(); } catch (e) { }',
    },
    check: (c) => /catch\s*\([^)]*\)\s*\{\s*\}/.test(c),
    expected: 'detect',
  },

  /** Hardcode de colores vs tokens — ADVERTENCIA */
  {
    id: 'hardcoded-color-vs-tokens',
    severity: 'warning',
    category: 'tokens',
    description: 'Color hardcodeado en vez de usar token G360',
    diff: {
      old: 'color: getToken("accent");',
      new: 'color: "#00d084";',
    },
    check: (c) => /#[0-9a-fA-F]{3,8}\b(?![a-zA-Z])/.test(c),
    expected: 'detect',
  },

  /** Nombre de archivo describe tecnología — ADVERTENCIA */
  {
    id: 'tech-name-in-file',
    severity: 'warning',
    category: 'nomenclatura',
    description: 'Archivo con sufijo de framework en el nombre',
    diff: {
      old: 'app.jsx',
      new: 'app-lit.jsx',
    },
    check: (c) => /-[a-z]+\.jsx$/.test(c),
    expected: 'detect',
  },

  /** Comando de verificación incorrecto — ADVERTENCIA */
  {
    id: 'wrong-verify-command',
    severity: 'warning',
    category: 'autosuficiencia',
    description: 'AGENTS.md con comando de verificación ficticio',
    diff: {
      old: '```bash\nnpm test\n```',
      new: '```bash\nnpm run magical-test-that-doesnt-exist\n```',
    },
    check: (c) =>
      /npm run (magical|nonexistent|test-that-doesnt-exist)/.test(c),
    expected: 'detect',
  },

  /** Diff sin bugs — CONTROL POSITIVO */
  {
    id: 'clean-diff',
    severity: 'none',
    category: 'control',
    description: 'Cambio menor sin bugs (control positivo)',
    diff: {
      old:
        'export async function formatName(name) {\n  return name.trim().toLowerCase();\n}',
      new:
        'export async function formatName(name) {\n  return name.trim().toLowerCase();\n}',
    },
    check: () => false,
    expected: 'clean',
  },

  /** Dos bugs en el mismo diff — CRÍTICO doble */
  {
    id: 'multi-bug-diff',
    severity: 'critical',
    category: 'composición',
    description: 'Diff con dos bugs: ruta absoluta + catch silencioso',
    diff: {
      old: "const p = './config';\ntry { load(p); } catch(e) { throw e; }",
      new: "const p = 'C:\\\\Users\\\\ccusi\\\\config';\ntry { load(p); } catch(e) { }",
    },
    checks: [
      (c) => c.includes('C:\\\\Users\\\\'),
      (c) => /catch\s*\([^)]*\)\s*\{\s*\}/.test(c),
    ],
    expected: 'detect',
    note: 'debe detectar ambos bugs, no solo uno',
  },
];

/**
 * Ejecuta los checks sobre un diff y retorna los hallazgos.
 */
export function runEvals(testCase) {
  const { diff, checks, check, expected } = testCase;
  const findings = [];
  const newContent = diff.new || '';

  if (check) {
    const found = check(newContent);
    if (found) findings.push({ id: testCase.id, type: 'single', found: true });
  }

  if (checks) {
    for (const fn of checks) {
      if (fn(newContent)) {
        findings.push({ id: testCase.id, type: 'multi', found: true });
      }
    }
  }

  return findings;
}

/**
 * Ejecuta todos los evals y genera reporte numérico.
 */
export function runAllEvals() {
  const results = EVAL_CASES.map((tc) => {
    const findings = runEvals(tc);
    const detected = findings.length > 0;
    return {
      id: tc.id,
      category: tc.category,
      severity: tc.severity,
      detected,
      findings,
      expected: tc.expected,
    };
  });

  const detected = results.filter((r) => r.detected).length;
  const missed = results.filter((r) => !r.detected && r.expected === 'detect')
    .length;
  const falsePositives = results.filter(
    (r) => r.detected && r.expected === 'clean'
  ).length;

  const byCategory = {};
  for (const r of results) {
    if (!byCategory[r.category])
      byCategory[r.category] = { total: 0, detected: 0 };
    byCategory[r.category].total++;
    if (r.detected) byCategory[r.category].detected++;
  }

  const bySeverity = {};
  for (const r of results) {
    if (!bySeverity[r.severity])
      bySeverity[r.severity] = { total: 0, detected: 0 };
    bySeverity[r.severity].total++;
    if (r.detected) bySeverity[r.severity].detected++;
  }

  return {
    total: EVAL_CASES.length,
    detected,
    missed,
    falsePositives,
    byCategory,
    bySeverity,
    results,
  };
}
