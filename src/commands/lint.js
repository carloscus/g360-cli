import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { walkProject } from '../lib/file-utils.js';

const SEVERITY = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  MINOR: 'minor',
};

const JS_NAMING_RULES = {
  function: { pattern: /^[a-z][a-zA-Z0-9]*$/, name: 'camelCase' },
  class: { pattern: /^[A-Z][a-zA-Z0-9]*$/, name: 'PascalCase' },
  variable: { pattern: /^[a-z][a-zA-Z0-9]*$/, name: 'camelCase' },
  constant: { pattern: /^[A-Z][A-Z0-9_]*$/, name: 'UPPER_SNAKE_CASE' },
  file: { pattern: /^[a-z][a-zA-Z0-9]*\.js$/, name: 'camelCase.js' },
};

const PYTHON_NAMING_RULES = {
  function: { pattern: /^[a-z][a-z0-9_]*$/, name: 'snake_case' },
  class: { pattern: /^[A-Z][a-zA-Z0-9]*$/, name: 'PascalCase' },
  variable: { pattern: /^[a-z][a-z0-9_]*$/, name: 'snake_case' },
  constant: { pattern: /^[A-Z][A-Z0-9_]*$/, name: 'UPPER_SNAKE_CASE' },
  file: { pattern: /^[a-z][a-z0-9_]*\.py$/, name: 'snake_case.py' },
};

const GENERIC_NAMES = ['result', 'data', 'info', 'val', 'obj', 'tmp', 'aux', 'value', 'x', 'y', 'z', 'item', 'elem', 'entry', 'output', 'input', 'res', 'dt'];

export async function lint(targetPath, options) {
  const { level = 'all', project } = options;
  const targetDir = project ? path.join(process.cwd(), project) : path.resolve(targetPath || '.');

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Directorio no encontrado: ${targetDir}`));
    return;
  }

  console.log(chalk.bold.cyan('\n🔍 G360 Lint — Naming & Consistency Review\n'));
  console.log(chalk.gray(`Path: ${targetDir}\n`));

  const findings = [];

  if (level === 'all' || level === 'naming') {
    findings.push(...checkNamingConventions(targetDir));
  }

  if (level === 'all' || level === 'duplicates') {
    findings.push(...checkDuplicateFunctions(targetDir));
  }

  if (level === 'all' || level === 'syntax') {
    findings.push(...checkSyntaxErrors(targetDir));
  }

  if (level === 'all' || level === 'structure') {
    findings.push(...checkProjectStructure(targetDir));
  }

  if (findings.length === 0) {
    console.log(chalk.green('✅ No se encontraron problemas.\n'));
    return;
  }

  const critical = findings.filter(f => f.severity === SEVERITY.CRITICAL);
  const important = findings.filter(f => f.severity === SEVERITY.IMPORTANT);
  const minor = findings.filter(f => f.severity === SEVERITY.MINOR);

  if (critical.length > 0) {
    console.log(chalk.red(`\n🔴 Hallazgos críticos (${critical.length}):\n`));
    critical.forEach(f => printFinding(f));
  }

  if (important.length > 0) {
    console.log(chalk.yellow(`\n🟡 Hallazgos importantes (${important.length}):\n`));
    important.forEach(f => printFinding(f));
  }

  if (minor.length > 0) {
    console.log(chalk.blue(`\n🔵 Hallazgos menores (${minor.length}):\n`));
    minor.forEach(f => printFinding(f));
  }

  const score = Math.max(0, 100 - (critical.length * 10) - (important.length * 3) - (minor.length * 1));
  console.log(chalk.bold(`\n📊 Puntaje: ${score}/100`));
  console.log(chalk.gray(`   Críticos: ${critical.length} | Importantes: ${important.length} | Menores: ${minor.length}\n`));
}

function checkNamingConventions(dir) {
  const findings = [];
  const jsFiles = [];
  const pyFiles = [];

  walkProject(dir, {
    onJs: (fullPath) => jsFiles.push(fullPath),
    onPy: (fullPath) => pyFiles.push(fullPath),
  });

  for (const file of jsFiles) {
    findings.push(...checkJsFileNaming(file, dir));
  }

  for (const file of pyFiles) {
    findings.push(...checkPyFileNaming(file, dir));
  }

  return findings;
}

function checkJsFileNaming(filePath, projectDir) {
  const findings = [];
  const relPath = path.relative(projectDir, filePath);
  const fileName = path.basename(filePath, '.js');

  if (fileName.includes('-') && fileName !== 'g360-theme') {
    findings.push({
      severity: SEVERITY.MINOR,
      file: relPath,
      type: 'file-naming',
      message: `El archivo JS "${fileName}.js" usa kebab-case. Se recomienda camelCase: "${toCamelCase(fileName)}.js"`,
      current: `${fileName}.js`,
      recommended: `${toCamelCase(fileName)}.js`,
    });
  }

  const content = fs.readFileSync(filePath, 'utf8');

  const functionMatches = content.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  if (functionMatches) {
    for (const match of functionMatches) {
      const name = match.replace(/^function\s+/, '');
      if (!JS_NAMING_RULES.function.pattern.test(name)) {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: relPath,
          type: 'function-naming',
          message: `La función "${name}" no usa camelCase. Se recomienda: "${toCamelCase(name)}"`,
          current: name,
          recommended: toCamelCase(name),
        });
      }
    }
  }

  const classMatches = content.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  if (classMatches) {
    for (const match of classMatches) {
      const name = match.replace(/^class\s+/, '');
      if (!JS_NAMING_RULES.class.pattern.test(name)) {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: relPath,
          type: 'class-naming',
          message: `La clase "${name}" no usa PascalCase. Se recomienda: "${toPascalCase(name)}"`,
          current: name,
          recommended: toPascalCase(name),
        });
      }
    }
  }

  const varMatches = content.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  if (varMatches) {
    for (const match of varMatches) {
      const name = match.replace(/^(?:const|let|var)\s+/, '');
      if (GENERIC_NAMES.includes(name)) {
        findings.push({
          severity: SEVERITY.MINOR,
          file: relPath,
          type: 'generic-variable',
          message: `La variable "${name}" es genérica. Se recomienda un nombre descriptivo`,
          current: name,
          recommended: null,
        });
      }
    }
  }

  return findings;
}

function checkPyFileNaming(filePath, projectDir) {
  const findings = [];
  const relPath = path.relative(projectDir, filePath);
  const fileName = path.basename(filePath, '.py');

  if (fileName.includes('-') || fileName.includes(' ')) {
    findings.push({
      severity: SEVERITY.IMPORTANT,
      file: relPath,
      type: 'file-naming',
      message: `El archivo Python "${fileName}.py" no usa snake_case. Se recomienda: "${toSnakeCase(fileName)}.py"`,
      current: `${fileName}.py`,
      recommended: `${toSnakeCase(fileName)}.py`,
    });
  }

  if (fileName !== '__init__' && /[A-Z]/.test(fileName)) {
    findings.push({
      severity: SEVERITY.IMPORTANT,
      file: relPath,
      type: 'file-naming',
      message: `El archivo Python "${fileName}.py" contiene mayúsculas. Python usa snake_case: "${toSnakeCase(fileName)}.py"`,
      current: `${fileName}.py`,
      recommended: `${toSnakeCase(fileName)}.py`,
    });
  }

  const content = fs.readFileSync(filePath, 'utf8');

  const functionMatches = content.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm);
  if (functionMatches) {
    for (const match of functionMatches) {
      const name = match.replace(/^def\s+/, '');
      if (!PYTHON_NAMING_RULES.function.pattern.test(name)) {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: relPath,
          type: 'function-naming',
          message: `La función "${name}" no usa snake_case. Se recomienda: "${toSnakeCase(name)}"`,
          current: name,
          recommended: toSnakeCase(name),
        });
      }
    }
  }

  const classMatches = content.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm);
  if (classMatches) {
    for (const match of classMatches) {
      const name = match.replace(/^class\s+/, '');
      if (!PYTHON_NAMING_RULES.class.pattern.test(name)) {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: relPath,
          type: 'class-naming',
          message: `La clase "${name}" no usa PascalCase. Se recomienda: "${toPascalCase(name)}"`,
          current: name,
          recommended: toPascalCase(name),
        });
      }
    }
  }

  return findings;
}

function checkDuplicateFunctions(dir) {
  const findings = [];
  const functionMap = new Map();

  walkProject(dir, {
    onJs: (fullPath) => extractFunctions(fullPath, 'js', functionMap),
    onPy: (fullPath) => extractFunctions(fullPath, 'py', functionMap),
  });

  for (const [name, locations] of functionMap) {
    if (locations.length > 1) {
      const uniqueBodies = new Set(locations.map(l => l.bodyHash));
      if (uniqueBodies.size > 1) {
        findings.push({
          severity: SEVERITY.CRITICAL,
          file: locations.map(l => l.file).join(', '),
          type: 'duplicate-function',
          message: `La función "${name}" está definida en ${locations.length} archivos con implementaciones diferentes`,
          current: locations.map(l => `${l.file}:${l.line}`).join('\n'),
          recommended: `Unificar en un solo archivo o renombrar para clarificar`,
        });
      } else {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: locations.map(l => l.file).join(', '),
          type: 'duplicate-function',
          message: `La función "${name}" está definida en ${locations.length} archivos con la misma implementación (código duplicado)`,
          current: locations.map(l => `${l.file}:${l.line}`).join(', '),
          recommended: `Extraer a un módulo compartido en src/lib/`,
        });
      }
    }
  }

  return findings;
}

function extractFunctions(filePath, lang, functionMap) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(process.cwd(), filePath);

  if (lang === 'js') {
    const funcMatches = content.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm);
    if (funcMatches) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (match) {
          const name = match[1];
          const bodyStart = i;
          let bodyEnd = i;
          let braceCount = 0;
          let foundOpen = false;
          for (let j = i; j < lines.length; j++) {
            for (const ch of lines[j]) {
              if (ch === '{') { braceCount++; foundOpen = true; }
              if (ch === '}') { braceCount--; }
            }
            if (foundOpen && braceCount === 0) {
              bodyEnd = j;
              break;
            }
          }
          const body = lines.slice(bodyStart, bodyEnd + 1).join('\n');
          const bodyHash = hashString(body);

          if (!functionMap.has(name)) {
            functionMap.set(name, []);
          }
          functionMap.get(name).push({
            file: relPath,
            line: i + 1,
            bodyHash,
            body: body.substring(0, 100),
          });
        }
      }
    }
  }

  if (lang === 'py') {
    const funcMatches = content.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm);
    if (funcMatches) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (match) {
          const name = match[1];
          const bodyStart = i;
          let bodyEnd = i;
          let indent = null;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() === '') continue;
            const currentIndent = lines[j].match(/^(\s*)/)[1].length;
            if (indent === null) {
              indent = currentIndent;
            }
            if (currentIndent <= indent && lines[j].trim() !== '') {
              bodyEnd = j - 1;
              break;
            }
            bodyEnd = j;
          }
          const body = lines.slice(bodyStart, bodyEnd + 1).join('\n');
          const bodyHash = hashString(body);

          if (!functionMap.has(name)) {
            functionMap.set(name, []);
          }
          functionMap.get(name).push({
            file: relPath,
            line: i + 1,
            bodyHash,
            body: body.substring(0, 100),
          });
        }
      }
    }
  }
}

function checkSyntaxErrors(dir) {
  const findings = [];

  walkProject(dir, {
    onJs: (fullPath) => checkJsSyntax(fullPath, dir, findings),
    onPy: (fullPath) => checkPySyntax(fullPath, dir, findings),
  });

  return findings;
}

function checkJsSyntax(filePath, projectDir, findings) {
  const relPath = path.relative(projectDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip ES modules (import/export) — new Function() no puede parsearlos
  if (/^(?:import|export)\s/m.test(content)) return;

  try {
    new Function(content);
  } catch (error) {
    findings.push({
      severity: SEVERITY.CRITICAL,
      file: relPath,
      type: 'syntax-error',
      message: `Error de sintaxis en JavaScript: ${error.message}`,
      current: error.message,
      recommended: 'Corregir el error de sintaxis',
    });
  }
}

function checkPySyntax(filePath, projectDir, findings) {
  const relPath = path.relative(projectDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  const lines = content.split('\n');
  let indentStack = [0];
  let inTripleQuote = false;
  let tripleQuoteChar = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      const quoteChar = trimmed.substring(0, 3);
      if (!inTripleQuote) {
        inTripleQuote = true;
        tripleQuoteChar = quoteChar;
      } else if (trimmed.endsWith(tripleQuoteChar) && trimmed.length > 3) {
        inTripleQuote = false;
      } else if (trimmed === tripleQuoteChar) {
        inTripleQuote = false;
      }
      continue;
    }

    if (inTripleQuote) continue;

    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.match(/^(\s*)/)[1].length;

    if (indent > indentStack[indentStack.length - 1]) {
      indentStack.push(indent);
    } else if (indent < indentStack[indentStack.length - 1]) {
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
        indentStack.pop();
      }
      // Verificar que la indentacion actual este en el stack
      if (indentStack.length > 0 && indent !== indentStack[indentStack.length - 1]) {
        const indentUnit = indentStack.length > 1 ? indentStack[1] - indentStack[0] : 4;
        if (indent % indentUnit !== 0) {
          findings.push({
            severity: SEVERITY.WARNING,
            file: relPath,
            type: 'indentation-error',
            message: `Indentacion inconsistente en linea ${i + 1}: ${indent} espacios (esperado multiplo de ${indentUnit})`,
            current: `${indent} espacios`,
            recommended: `Multiplo de ${indentUnit} espacios`,
          });
        }
      }
    }
  }
}

function checkProjectStructure(dir) {
  const findings = [];

  const manifestPath = path.join(dir, 'g360-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    findings.push({
      severity: SEVERITY.MINOR,
      file: 'g360-manifest.json',
      type: 'missing-file',
      message: 'No se encontró g360-manifest.json. Se recomienda crear uno para proyectos G360',
      current: 'ausente',
      recommended: 'Crear g360-manifest.json con name, template, version',
    });
  }

  const skillPath = path.join(dir, 'skill.json');
  if (!fs.existsSync(skillPath)) {
    const srcCoreSkill = path.join(dir, 'src', 'core', 'skill.json');
    if (!fs.existsSync(srcCoreSkill)) {
      findings.push({
        severity: SEVERITY.MINOR,
        file: 'skill.json',
        type: 'missing-file',
        message: 'No se encontró skill.json en la raíz ni en src/core/',
        current: 'ausente',
        recommended: 'Crear skill.json con name, description, framework, colors, signature',
      });
    }
  }

  const readmePath = path.join(dir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    findings.push({
      severity: SEVERITY.IMPORTANT,
      file: 'README.md',
      type: 'missing-file',
      message: 'No se encontró README.md',
      current: 'ausente',
      recommended: 'Crear README.md con descripción, quick start y estructura del proyecto',
    });
  }

  return findings;
}

function printFinding(finding) {
  console.log(chalk.bold(`[${finding.type}]`));
  console.log(chalk.red(`  ${finding.message}`));
  console.log(chalk.gray(`  Archivo: ${finding.file}`));
  if (finding.current) {
    console.log(chalk.gray(`  Actual: ${finding.current}`));
  }
  if (finding.recommended) {
    console.log(chalk.green(`  Recomendado: ${finding.recommended}`));
  }
  console.log();
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString();
}