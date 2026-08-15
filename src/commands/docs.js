import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_PATH = path.join(__dirname, '..', 'assets', 'brand', 'brand.json');

const LEVELS = ['readme', 'architecture', 'business-rules', 'api', 'dependencies', 'classes', 'code-graph', 'all'];

export async function docs(level, options) {
  const { project = '.', dryRun = false } = options;
  const targetDir = path.join(process.cwd(), project);

  if (!LEVELS.includes(level)) {
    console.error(chalk.red(`❌ Nivel invalido: "${level}"`));
    console.log(chalk.gray('Niveles disponibles:'));
    console.log(chalk.gray('  readme            - README.md con diagrama y logo'));
    console.log(chalk.gray('  architecture      - ARCHITECTURE.md con diagramas'));
    console.log(chalk.gray('  business-rules    - BUSINESS_RULES.md (solo Python con commercial_engine)'));
    console.log(chalk.gray('  api               - API.md (solo proyectos con endpoints)'));
    console.log(chalk.gray('  dependencies      - docs/generated/dependencies.mmd'));
    console.log(chalk.gray('  classes           - docs/generated/classes.mmd'));
    console.log(chalk.gray('  code-graph        - docs/generated/code_graph.mmd (proyectos grandes)'));
    console.log(chalk.gray('  all               - Todos los niveles aplicables'));
    console.log(chalk.gray('\nEjemplo:'));
    console.log(chalk.gray('  g360 docs'));
    console.log(chalk.gray('  g360 docs --level all'));
    console.log(chalk.gray('  g360 docs --level readme --project ./mi-proyecto'));
    return;
  }

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`❌ Directorio no encontrado: ${targetDir}`));
    return;
  }

  const projectInfo = detectProject(targetDir);
  const brand = loadBrand();
  const manifest = loadManifest(targetDir);
  const skill = loadSkill(targetDir);

  if (dryRun) {
    console.log(chalk.yellow('\n📋 DRY RUN — Archivos que se generarian:\n'));
  } else {
    console.log(chalk.bold.cyan('\n📝 G360 Documentation Generator\n'));
    console.log(chalk.gray(`Path: ${targetDir}\n`));
  }

  const levelsToRun = level === 'all'
    ? getApplicableLevels(projectInfo)
    : [level];

  for (const lvl of levelsToRun) {
    const result = await generateLevel(lvl, targetDir, projectInfo, brand, manifest, skill, dryRun);
    if (result) {
      console.log(chalk.green(`  ✅ ${result}`));
    }
  }

  if (!dryRun) {
    console.log(chalk.gray('\n💡 Usa --dry-run para previsualizar sin escribir archivos.\n'));
  }
}

function detectProject(dir) {
  const pyproject = path.join(dir, 'pyproject.toml');
  const mainPy = path.join(dir, 'src', 'main.py');
  const indexHtml = path.join(dir, 'index.html');
  const pkgJson = path.join(dir, 'package.json');
  const skillJson = path.join(dir, 'skill.json');

  let type = 'unknown';
  let framework = null;

  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf8');
    if (content.includes('flet')) {
      type = 'python-flet';
      framework = 'flet';
    } else if (content.includes('customtkinter')) {
      type = 'python-customtkinter';
      framework = 'customtkinter';
    } else if (fs.existsSync(mainPy)) {
      const mainContent = fs.readFileSync(mainPy, 'utf8');
      if (mainContent.includes('flet')) {
        type = 'python-flet';
        framework = 'flet';
      } else {
        type = 'python-cli';
        framework = 'cli';
      }
    } else {
      type = 'python-cli';
      framework = 'cli';
    }
  }

  if (type === 'unknown') {
    if (fs.existsSync(indexHtml)) {
      type = 'web';
      if (fs.existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
          const deps = Object.keys(pkg.dependencies || {});
          if (deps.some(d => d.includes('react'))) framework = 'react';
          else if (deps.some(d => d.includes('lit'))) framework = 'lit';
          else if (deps.some(d => d.includes('solid'))) framework = 'solid';
          else if (deps.some(d => d.includes('svelte'))) framework = 'svelte';
        } catch { /* keep framework as detected */ }
      }
    } else if (fs.existsSync(pkgJson)) {
      type = 'web';
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
        const deps = Object.keys(pkg.dependencies || {});
        if (deps.some(d => d.includes('react'))) framework = 'react';
        else if (deps.some(d => d.includes('lit'))) framework = 'lit';
        else if (deps.some(d => d.includes('solid'))) framework = 'solid';
        else if (deps.some(d => d.includes('svelte'))) framework = 'svelte';
      } catch { /* keep framework as detected */ }
    }
  }

  return { type, framework, dir };
}

function loadBrand() {
  if (fs.existsSync(BRAND_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(BRAND_PATH, 'utf8'));
    } catch { /* fallback */ }
  }
  return null;
}

function loadManifest(dir) {
  const manifestPath = path.join(dir, 'g360-manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch { /* fallback */ }
  }
  return null;
}

function loadSkill(dir) {
  const candidates = [
    path.join(dir, 'skill.json'),
    path.join(dir, 'src', 'core', 'skill.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch { /* fallback */ }
    }
  }
  return null;
}

function getApplicableLevels(projectInfo) {
  const levels = ['readme', 'architecture'];
  if (projectInfo.type === 'python-flet' || projectInfo.type === 'python-cli') {
    levels.push('business-rules');
  }
  levels.push('dependencies', 'classes');
  return levels;
}

async function generateLevel(lvl, dir, projectInfo, brand, manifest, skill, dryRun) {
  switch (lvl) {
    case 'readme': return await generateReadme(dir, projectInfo, brand, manifest, skill, dryRun);
    case 'architecture': return await generateArchitecture(dir, projectInfo, brand, manifest, skill, dryRun);
    case 'business-rules': return await generateBusinessRules(dir, projectInfo, dryRun);
    case 'dependencies': return await generateDependencies(dir, projectInfo, dryRun);
    case 'classes': return await generateClasses(dir, projectInfo, dryRun);
    case 'code-graph': return await generateCodeGraph(dir, projectInfo, dryRun);
    case 'api': return await generateApi(dir, projectInfo, dryRun);
    default: return null;
  }
}

async function generateReadme(dir, projectInfo, brand, manifest, skill, dryRun) {
  const name = manifest?.name || skill?.name || path.basename(dir);
  const description = manifest?.description || skill?.description || `Proyecto ${name}`;
  const version = manifest?.version || '1.0.0';
  const template = manifest?.template || projectInfo.type;
  const signature = skill?.signature || { mode: 'powered', text: 'powered by G360' };
  const brandName = brand?.brands?.[skill?.brand || 'g360'];
  const logoPath = brandName?.default_logo || 'logotypes/logo-g360-dark.svg';
  const logoDir = path.dirname(logoPath);
  const logoFile = path.basename(logoPath);

  const diagram = buildReadmeDiagram(dir, projectInfo);

  const content = `# ${name}

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${logoDir}/${logoFile.replace('-dark', '-light')}">
  <img alt="${name}" height="64" src="${logoDir}/${logoFile}">
</picture>

> ${description}

[![Version](https://img.shields.io/badge/version-${version}-blue)](https://github.com)

## ¿Cómo está organizado el proyecto?

\`\`\`mermaid
${diagram}
\`\`\`

## Quick Start

\`\`\`bash
# 1. Entrar al proyecto
cd ${name}

# 2. Ver estructura
g360 present

# 3. Auditar compliance
g360 audit

# 4. Traer assets de marca
g360 bring brand
\`\`\`

## Identidad de Marca

| Elemento | Valor |
|---|---|
| Marca | ${brandName?.name || 'G360'} |
| Color primario | ${brandName?.primary_color || '#00d084'} |
| Signature mode | ${signature.mode} |
| Signature text | "${signature.text}" |
| Logo | ${logoPath} |

## Footer

\`\`\`html
<g360-signature mode="${signature.mode}"></g360-signature>
\`\`\`

---

**Marca**: ${brandName?.name || 'G360'} · **Isotipo**: 3 puntos + chevron \`>\`
**Signature**: ${signature.text} · **Powered by**: [g360-signature](https://github.com/carloscus/g360-signature)

*Generado por \`g360 docs\` · Fuente: \`brand.json\` + \`skill.json\` + \`g360-manifest.json\`*
`;

  const outputPath = path.join(dir, 'README.md');
  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] README.md`));
    return null;
  }
  await fs.writeFile(outputPath, content, 'utf8');
  return 'README.md';
}

async function generateArchitecture(dir, projectInfo, brand, manifest, skill, dryRun) {
  const name = manifest?.name || skill?.name || path.basename(dir);
  const diagram = buildArchitectureDiagram(dir, projectInfo);

  const content = `# ARCHITECTURE.md — ${name}

> Arquitectura general del proyecto. Generado automáticamente por \`g360 docs --level architecture\`.

## Arquitectura General

\`\`\`mermaid
${diagram}
\`\`\`

## Componentes

| Componente | Responsabilidad |
|---|---|
| Entry point | Punto de inicio de la aplicación |
| Core | Lógica de negocio y configuración |
| UI | Presentación y interacción con el usuario |
| Assets | Recursos estáticos (imágenes, iconos, marca) |
| Config | Archivos de configuración (skill.json, manifest) |

## Flujo de Datos

\`\`\`mermaid
flowchart LR
    INPUT["Entrada del usuario"] --> PROCESS["Procesamiento"]
    PROCESS --> VALIDATE["Validación"]
    VALIDATE --> OUTPUT["Resultado"]
    OUTPUT --> PERSIST["Persistencia"]
\`\`\`

---

*Generado por \`g360 docs --level architecture\`*
`;

  const outputPath = path.join(dir, 'ARCHITECTURE.md');
  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] ARCHITECTURE.md`));
    return null;
  }
  await fs.writeFile(outputPath, content, 'utf8');
  return 'ARCHITECTURE.md';
}

async function generateBusinessRules(dir, projectInfo, dryRun) {
  const commercialEngine = path.join(dir, 'py', 'src', 'g360_core', 'commercial_engine.py');
  if (!fs.existsSync(commercialEngine)) {
    console.log(chalk.yellow('  ⚠ No se encontró commercial_engine.py. Se omite BUSINESS_RULES.md.\n'));
    return null;
  }

  const content = `# BUSINESS_RULES.md — Motor de clasificación comercial

> Única fuente de verdad para reglas de negocio. Todas las reglas viven en
> \`commercial_engine.py\`, no en \`processor.py\` ni \`pipeline.py\`.

**Módulo**: \`g360_core.commercial_engine\`

## Flujo de reglas

\`\`\`mermaid
flowchart TD
    IN["Entrada<br/>DataFrame ERP (.xls/.xlsx/.csv)"]
    P1["parse_referencia<br/>REF_TIPO / REF_SERIE / REF_NUMERO"]
    P2["classify_base<br/>CATEGORIA_OP"]
    P3["resolve_document_relationships<br/>SUBTIPO_AJUSTE"]
    P4["calculate_prices<br/>PRECIO_BASE / RECARGO / EFECTIVO"]
    OUT["Salida<br/>DataFrame enriquecido"]
    CSV["Persistencia<br/>maestro_ventas_crm.csv"]

    IN --> P1 --> P2 --> P3 --> P4 --> OUT --> CSV
\`\`\`

## Paso 1 — Parseo de REFERENCIA

Extrae \`REF_TIPO\`, \`REF_SERIE\` y \`REF_NUMERO\` del campo \`REFERENCIA\`.
Formato esperado: \`F01/204-56287\`. Regex: \`^([A-Z0-9]+)/(\\d+)-(\\d+)$\`.
Sin match → \`"S/R"\` en los 3 campos.

## Paso 2 — Clasificación primaria

Solo mira la fila actual. No cruza con otros documentos.

| TPO_DOC | CANTIDAD | → CATEGORIA_OP |
|---|---|---|
| F01, BDI, F03, B01, B03, F07, F08, B07, B08 | cualquiera | **VENTA** |
| NC\* (prefijos en \`NC_PREFIXES\`) | ≠ 0 | **DEVOLUCION** |
| NC\* | = 0 | **AJUSTE** |
| ND\* (prefijos en \`ND_PREFIXES\`) | cualquiera | **AJUSTE** |

\`SUBTIPO_AJUSTE\` se inicializa vacío aquí; se asigna en el paso 3.

## Paso 3 — Resolución de relaciones

Cruza \`REFERENCIA\` contra el índice de facturas de \`build_invoice_index\`.
Clave: \`(TPO_DOC, SERIE_DOC, NRO_DOC, ID_ARTICULO)\`. Solo se indexan registros VENTA.

| Condición | CANTIDAD_FAE | → SUBTIPO_AJUSTE |
|---|---|---|
| Clave con SKU coincide | = 0 | **CARGO_FIJO** |
| Clave con SKU coincide | ≈ CANTIDAD factura | **PRECIO_LINEA** |
| Clave con SKU coincide | < CANTIDAD factura | **PRECIO_PARCIAL** |
| Clave con SKU coincide | > CANTIDAD factura | **SIN_BASE** |
| Clave no coincide | = 1 | **CARGO_FIJO** |
| Clave no coincide | ≠ 1 | **SIN_BASE** |

## Paso 4 — Cálculo de precios

| Columna | Fórmula | Cuándo |
|---|---|---|
| \`PRECIO_BASE\` | \`\|SOLES\| / \|CANTIDAD\|\` | CANTIDAD ≠ 0 |
| \`RECARGO_UNITARIO\` | \`SOLES / \|CANTIDAD_FAE\|\` | AJUSTE con SUBTIPO_LINEA/PARCIAL y FAE ≠ 0 |
| \`PRECIO_EFECTIVO\` | \`PRECIO_BASE + RECARGO\` | PRECIO_BASE no es NaN |

---

*Generado por \`g360 docs --level business-rules\`*
`;

  const outputPath = path.join(dir, 'BUSINESS_RULES.md');
  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] BUSINESS_RULES.md`));
    return null;
  }
  await fs.writeFile(outputPath, content, 'utf8');
  return 'BUSINESS_RULES.md';
}

async function generateDependencies(dir, projectInfo, dryRun) {
  const scan = scanProject(dir);
  const deps = [];

  for (const file of scan.pyFiles) {
    if (file.endsWith('__init__.py')) continue;
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = extractImports(content);
    for (const imp of imports) {
      if (imp.startsWith('.')) {
        const target = imp.replace(/^\.\.?\//, '').replace(/\.py$/, '');
        deps.push({ from: file.replace(/\.py$/, ''), to: target });
      }
    }
  }

  for (const file of scan.jsFiles) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = extractJsImports(content);
    for (const imp of imports) {
      deps.push({ from: file.replace(/\.(js|jsx|ts|tsx)$/, ''), to: imp });
    }
  }

  let diagram;
  if (deps.length > 0) {
    const nodes = new Set();
    deps.forEach(d => { nodes.add(d.from); nodes.add(d.to); });
    const nodeList = [...nodes].map(n => `    ${n}`).join('\n');
    const edges = deps.map(d => `    ${d.from} --> ${d.to}`).join('\n');
    diagram = `flowchart TD\n${nodeList}\n\n${edges}`;
  } else {
    diagram = `flowchart TD\n    main --> core\n    core --> utils\n    main --> config`;
  }

  const outputDir = path.join(dir, 'docs', 'generated');
  const outputPath = path.join(outputDir, 'dependencies.mmd');

  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] docs/generated/dependencies.mmd`));
    return null;
  }
  await fs.ensureDir(outputDir);
  await fs.writeFile(outputPath, diagram, 'utf8');
  return 'docs/generated/dependencies.mmd';
}

async function generateClasses(dir, projectInfo, dryRun) {
  const scan = scanProject(dir);
  const classes = [];

  for (const file of scan.pyFiles) {
    if (file.endsWith('__init__.py')) continue;
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const classMatches = content.match(/^class\s+(\w+)/gm);
    if (classMatches) {
      for (const m of classMatches) {
        const name = m.replace(/^class\s+/, '').replace(/\(.*/, '');
        classes.push({ file: file.replace(/\.py$/, ''), name });
      }
    }
  }

  for (const file of scan.jsFiles) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const classMatches = content.match(/^export\s+class\s+(\w+)/gm);
    if (classMatches) {
      for (const m of classMatches) {
        const name = m.replace(/^export\s+class\s+/, '');
        classes.push({ file: file.replace(/\.(js|jsx|ts|tsx)$/, ''), name });
      }
    }
  }

  let diagram;
  if (classes.length > 0) {
    const nodes = classes.map(c => `    ${c.name}`).join('\n');
    const edges = classes.map(c => `    ${c.file} --> ${c.name}`).join('\n');
    diagram = `flowchart TD\n${nodes}\n\n${edges}`;
  } else {
    diagram = `flowchart TD\n    main --> core\n    core --> utils`;
  }

  const outputDir = path.join(dir, 'docs', 'generated');
  const outputPath = path.join(outputDir, 'classes.mmd');

  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] docs/generated/classes.mmd`));
    return null;
  }
  await fs.ensureDir(outputDir);
  await fs.writeFile(outputPath, diagram, 'utf8');
  return 'docs/generated/classes.mmd';
}

async function generateCodeGraph(dir, projectInfo, dryRun) {
  const scan = scanProject(dir);
  const totalFiles = scan.files.length;
  if (totalFiles < 5) {
    console.log(chalk.gray('  ⚠ Proyecto demasiado pequeño para code_graph. Se omite.\n'));
    return null;
  }

  const pyFiles = scan.pyFiles.filter(f => !f.endsWith('__init__.py'));
  const jsFiles = scan.jsFiles;

  let diagram;
  if (pyFiles.length > 0 || jsFiles.length > 0) {
    diagram = 'flowchart TD\n';
    diagram += '    subgraph Entrada["Entrada"]\n';
    if (scan.hasMainPy) diagram += '      Main["main.py"]\n';
    if (scan.hasIndexHtml) diagram += '      Index["index.html"]\n';
    diagram += '    end\n';
    diagram += '    subgraph Core["Core"]\n';
    for (const f of pyFiles.slice(0, 10)) {
      diagram += `      ${f.replace(/\.py$/, '')}\n`;
    }
    for (const f of jsFiles.slice(0, 10)) {
      diagram += `      ${f.replace(/\.(js|jsx|ts|tsx)$/, '')}\n`;
    }
    diagram += '    end\n';
    diagram += '    subgraph Salida["Salida"]\n';
    diagram += '      Output["Resultado"]\n';
    diagram += '    end\n';
    diagram += '    Entrada --> Core\n';
    diagram += '    Core --> Salida';
  } else {
    diagram = `flowchart TD\n    App["Aplicacion"]\n    Config["Config"]\n    App --> Config`;
  }

  const outputDir = path.join(dir, 'docs', 'generated');
  const outputPath = path.join(outputDir, 'code_graph.mmd');

  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] docs/generated/code_graph.mmd`));
    return null;
  }
  await fs.ensureDir(outputDir);
  await fs.writeFile(outputPath, diagram, 'utf8');
  return 'docs/generated/code_graph.mmd';
}

async function generateApi(dir, projectInfo, dryRun) {
  const scan = scanProject(dir);
  const pyFiles = scan.pyFiles.filter(f => !f.endsWith('__init__.py'));
  const jsFiles = scan.jsFiles.filter(f => !f.endsWith('.test.js') && !f.endsWith('.spec.js'));

  const exportedFunctions = [];
  const exportedClasses = [];

  // Python: detectar def y class exportados
  for (const file of pyFiles) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const funcMatches = content.match(/^(?:def|async\s+def)\s+(\w+)\s*\(/gm);
      if (funcMatches) {
        for (const m of funcMatches) {
          const name = m.replace(/^(?:async\s+)?def\s+/, '').replace(/\s*\(.*/, '');
          if (!name.startsWith('_')) {
            exportedFunctions.push({ file, name, type: 'python' });
          }
        }
      }
      const classMatches = content.match(/^(?:class)\s+(\w+)/gm);
      if (classMatches) {
        for (const m of classMatches) {
          const name = m.replace(/class\s+/, '').replace(/\s*[:(\{].*/, '');
          if (!name.startsWith('_')) {
            exportedClasses.push({ file, name, type: 'python' });
          }
        }
      }
    } catch { /* skip unreadable */ }
  }

  // JS/TS: detectar export function y export class
  for (const file of jsFiles) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const funcMatches = content.match(/^export\s+(?:async\s+)?function\s+(\w+)/gm);
      if (funcMatches) {
        for (const m of funcMatches) {
          const name = m.replace(/^export\s+(?:async\s+)?function\s+/, '');
          exportedFunctions.push({ file, name, type: 'javascript' });
        }
      }
      const classMatches = content.match(/^export\s+class\s+(\w+)/gm);
      if (classMatches) {
        for (const m of classMatches) {
          const name = m.replace(/^export\s+class\s+/, '');
          exportedClasses.push({ file, name, type: 'javascript' });
        }
      }
    } catch { /* skip unreadable */ }
  }

  if (exportedFunctions.length === 0 && exportedClasses.length === 0) {
    console.log(chalk.gray('  ⚠ No se encontraron exports publicos. Generando API basica.'));
  }

  // Generar markdown
  let md = `# API Reference\n\n`;
  md += `> Generado automaticamente por \`g360 docs api\`\n\n`;

  if (exportedClasses.length > 0) {
    md += `## Clases\n\n`;
    md += `| Clase | Archivo | Tipo |\n`;
    md += `|-------|---------|------|\n`;
    for (const c of exportedClasses) {
      md += `| \`${c.name}\` | \`${c.file}\` | ${c.type} |\n`;
    }
    md += `\n`;
  }

  if (exportedFunctions.length > 0) {
    md += `## Funciones\n\n`;
    md += `| Funcion | Archivo | Tipo |\n`;
    md += `|---------|---------|------|\n`;
    for (const f of exportedFunctions) {
      md += `| \`${f.name}\` | \`${f.file}\` | ${f.type} |\n`;
    }
    md += `\n`;
  }

  if (exportedFunctions.length === 0 && exportedClasses.length === 0) {
    md += `_No se encontraron exports publicos en el proyecto._\n`;
  }

  const outputDir = path.join(dir, 'docs', 'generated');
  const outputPath = path.join(outputDir, 'api.md');

  if (dryRun) {
    console.log(chalk.gray(`  [dry-run] docs/generated/api.md`));
    console.log(chalk.gray(`  Funciones: ${exportedFunctions.length} | Clases: ${exportedClasses.length}`));
    return null;
  }

  await fs.ensureDir(outputDir);
  await fs.writeFile(outputPath, md, 'utf8');
  console.log(chalk.green(`  ✅ docs/generated/api.md (${exportedFunctions.length} funciones, ${exportedClasses.length} clases)`));
  return 'docs/generated/api.md';
}

function scanProject(dir) {
  const results = {
    files: [],
    dirs: [],
    pyFiles: [],
    jsFiles: [],
    htmlFiles: [],
    configFiles: [],
    uiDirs: [],
    coreDirs: [],
    hasCommercialEngine: false,
    hasMainPy: false,
    hasIndexHtml: false,
    hasPackageJson: false,
    hasPyproject: false,
  };

  const extensions = {
    py: '.py',
    js: '.js',
    jsx: '.jsx',
    ts: '.ts',
    tsx: '.tsx',
    html: '.html',
    svelte: '.svelte',
    vue: '.vue',
    json: '.json',
    toml: '.toml',
    svg: '.svg',
    ico: '.ico',
    png: '.png',
    jpg: '.jpg',
    jpeg: '.jpeg',
    gif: '.gif',
    css: '.css',
    scss: '.scss',
    bat: '.bat',
    sh: '.sh',
  };

  function walk(d, depth) {
    if (depth > 5) return;
    const items = fs.readdirSync(d, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('.')) continue;
      if (item.name === 'node_modules') continue;
      if (item.name === '__pycache__') continue;
      if (item.name === '.pytest_cache') continue;
      if (item.name === 'g360') continue;

      const fullPath = path.join(d, item.name);
      const relPath = path.relative(dir, fullPath);

      if (item.isDirectory()) {
        results.dirs.push(relPath);
        if (relPath.includes('ui') || relPath.includes('views') || relPath.includes('pages') || relPath.includes('components')) {
          results.uiDirs.push(relPath);
        }
        if (relPath.includes('core') || relPath.includes('business') || relPath.includes('engine')) {
          results.coreDirs.push(relPath);
        }
        walk(fullPath, depth + 1);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        results.files.push({ path: relPath, ext, name: item.name });

        if (ext === '.py') results.pyFiles.push(relPath);
        if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') results.jsFiles.push(relPath);
        if (ext === '.html') results.htmlFiles.push(relPath);
        if (ext === '.json' || ext === '.toml') results.configFiles.push(relPath);
        if (item.name === 'main.py') results.hasMainPy = true;
        if (item.name === 'index.html') results.hasIndexHtml = true;
        if (item.name === 'package.json') results.hasPackageJson = true;
        if (item.name === 'pyproject.toml') results.hasPyproject = true;
        if (item.name === 'commercial_engine.py') results.hasCommercialEngine = true;
      }
    }
  }

  walk(dir, 0);
  return results;
}

function buildReadmeDiagram(dir, projectInfo) {
  const scan = scanProject(dir);
  const type = projectInfo.type;

  if (type === 'web') {
    const components = scan.jsFiles.filter(f => f.includes('component') || f.includes('Component'));
    const pages = scan.jsFiles.filter(f => f.includes('page') || f.includes('Page') || f.includes('route') || f.includes('Route'));
    const assets = scan.files.filter(f => ['.svg', '.png', '.jpg', '.ico'].includes(f.ext));

    let diagram = 'flowchart TD\n';
    diagram += '    Frontend["Frontend<br/>' + (projectInfo.framework || 'web') + '"]\n';
    diagram += '    Assets["Assets<br/>' + assets.length + ' files"]\n';
    diagram += '    Config["Config<br/>skill.json"]\n';

    if (components.length > 0) {
      diagram += '    Frontend --> Components["Components<br/>' + components.length + '"]\n';
    }
    if (pages.length > 0) {
      diagram += '    Frontend --> Pages["Pages<br/>' + pages.length + '"]\n';
    }
    diagram += '    Frontend --> Assets\n';
    diagram += '    Frontend --> Config';
    return diagram;
  }

  if (type === 'python-flet') {
    const coreFiles = scan.pyFiles.filter(f => f.includes('core') && !f.includes('__init__'));
    const uiFiles = scan.pyFiles.filter(f => f.includes('ui') && !f.includes('__init__'));
    const exportFiles = scan.pyFiles.filter(f => f.includes('export') && !f.includes('__init__'));

    let diagram = 'flowchart TD\n';
    diagram += '    UI["UI<br/>Flet widgets<br/>' + uiFiles.length + ' files"]\n';
    diagram += '    Core["Core<br/>business logic<br/>' + coreFiles.length + ' files"]\n';
    diagram += '    Theme["Theme<br/>G360Theme"]\n';

    if (exportFiles.length > 0) {
      diagram += '    Core --> Export["Export<br/>' + exportFiles.length + '"]\n';
    }
    diagram += '    UI --> Core\n';
    diagram += '    UI --> Theme\n';
    if (scan.hasCommercialEngine) {
      diagram += '    Core --> Engine["commercial_engine"]\n';
    }
    return diagram;
  }

  if (type === 'python-cli') {
    const coreFiles = scan.pyFiles.filter(f => !f.includes('__init__'));
    let diagram = 'flowchart TD\n';
    diagram += '    CLI["CLI<br/>argparse<br/>main.py"]\n';
    diagram += '    Core["Core<br/>' + coreFiles.length + ' modules"]\n';
    diagram += '    Config["Config<br/>skill.json"]\n';
    diagram += '    CLI --> Core\n';
    diagram += '    CLI --> Config';
    return diagram;
  }

  if (type === 'python-customtkinter') {
    const coreFiles = scan.pyFiles.filter(f => !f.includes('__init__'));
    let diagram = 'flowchart TD\n';
    diagram += '    UI["UI<br/>CustomTkinter<br/>main.py"]\n';
    diagram += '    Core["Core<br/>' + coreFiles.length + ' modules"]\n';
    diagram += '    Theme["Theme<br/>G360Theme"]\n';
    diagram += '    UI --> Core\n';
    diagram += '    UI --> Theme';
    return diagram;
  }

  let diagram = 'flowchart TD\n';
  diagram += '    App["Aplicacion"]\n';
  diagram += '    Config["Configuracion"]\n';
  diagram += '    Assets["Assets"]\n';
  diagram += '    App --> Config\n';
  diagram += '    App --> Assets';
  return diagram;
}

function buildArchitectureDiagram(dir, projectInfo) {
  const scan = scanProject(dir);
  const type = projectInfo.type;

  if (type === 'web') {
    const components = scan.jsFiles.filter(f => f.includes('component') || f.includes('Component'));
    const pages = scan.jsFiles.filter(f => f.includes('page') || f.includes('Page') || f.includes('route') || f.includes('Route'));
    const styles = scan.files.filter(f => f.ext === '.css' || f.ext === '.scss');

    let diagram = 'flowchart TD\n';
    diagram += '    subgraph Frontend["Frontend"]\n';
    diagram += '      Index["index.html"]\n';
    if (pages.length > 0) diagram += '      Pages["Pages (' + pages.length + ')"]\n';
    if (components.length > 0) diagram += '      Components["Components (' + components.length + ')"]\n';
    if (styles.length > 0) diagram += '      Styles["Styles (' + styles.length + ')"]\n';
    diagram += '    end\n';
    diagram += '    subgraph Assets["Assets"]\n';
    diagram += '      Brand["Brand / logo"]\n';
    diagram += '      Signature["Signature"]\n';
    diagram += '      Favicon["Favicon"]\n';
    diagram += '    end\n';
    diagram += '    subgraph Config["Config"]\n';
    diagram += '      Skill["skill.json"]\n';
    diagram += '      Manifest["manifest"]\n';
    diagram += '    end\n';
    diagram += '    Frontend --> Assets\n';
    diagram += '    Frontend --> Config';
    return diagram;
  }

  if (type === 'python-flet') {
    const coreFiles = scan.pyFiles.filter(f => f.includes('core') && !f.includes('__init__'));
    const uiFiles = scan.pyFiles.filter(f => f.includes('ui') && !f.includes('__init__'));
    const exportFiles = scan.pyFiles.filter(f => f.includes('export') && !f.includes('__init__'));

    let diagram = 'flowchart TD\n';
    diagram += '    subgraph UI["UI Layer"]\n';
    diagram += '      Main["main.py"]\n';
    if (uiFiles.length > 0) diagram += '      Widgets["Widgets (' + uiFiles.length + ')"]\n';
    diagram += '    end\n';
    diagram += '    subgraph Core["Core Layer"]\n';
    if (coreFiles.length > 0) diagram += '      Logic["Logic (' + coreFiles.length + ')"]\n';
    diagram += '      Theme["G360Theme"]\n';
    diagram += '      Signature["g360_signature"]\n';
    diagram += '    end\n';
    diagram += '    subgraph Data["Data"]\n';
    if (scan.hasPyproject) diagram += '      ERP["ERP files (.xls/.xlsx/.csv)"]\n';
    if (exportFiles.length > 0) diagram += '      Export["Excel export (' + exportFiles.length + ')"]\n';
    diagram += '    end\n';
    diagram += '    UI --> Core\n';
    diagram += '    Core --> Data';
    return diagram;
  }

  if (type === 'python-cli') {
    let diagram = 'flowchart TD\n';
    diagram += '    subgraph CLI["CLI"]\n';
    diagram += '      Entry["main.py"]\n';
    diagram += '      Commands["Commands"]\n';
    diagram += '    end\n';
    diagram += '    subgraph Core["Core"]\n';
    diagram += '      Logic["Business logic"]\n';
    diagram += '      Config["Config"]\n';
    diagram += '    end\n';
    diagram += '    CLI --> Core';
    return diagram;
  }

  let diagram = 'flowchart TD\n';
  diagram += '    subgraph App["Aplicacion"]\n';
  diagram += '      UI["UI"]\n';
  diagram += '      Core["Core"]\n';
  diagram += '      Data["Data"]\n';
  diagram += '    end\n';
  diagram += '    UI --> Core\n';
  diagram += '    Core --> Data';
  return diagram;
}

function extractImports(content) {
  const imports = [];
  const fromRegex = /^\s*from\s+(\.[\w.]+)\s+import/gm;
  const match = content.match(fromRegex);
  if (match) {
    for (const m of match) {
      const parts = m.match(/from\s+(\.[\w.]+)/);
      if (parts) imports.push(parts[1]);
    }
  }
  return imports;
}

function extractJsImports(content) {
  const imports = [];
  const fromRegex = /^\s*import\s+.*\s+from\s+['"](\.[^'"]+)['"]/gm;
  const requireRegex = /require\(['"](\.[^'"]+)['"]\)/g;

  const fromMatches = content.match(fromRegex);
  if (fromMatches) {
    for (const m of fromMatches) {
      const parts = m.match(/from\s+['"](\.[^'"]+)['"]/);
      if (parts) imports.push(parts[1]);
    }
  }

  const requireMatches = content.match(requireRegex);
  if (requireMatches) {
    for (const m of requireMatches) {
      const parts = m.match(/require\(['"](\.[^'"]+)['"]\)/);
      if (parts) imports.push(parts[1]);
    }
  }

  return imports;
}

