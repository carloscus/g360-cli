import fs from 'fs-extra';
import path from 'path';
import { walkProject } from './file-utils.js';

export const REVIEW_LEVELS = ['tokens', 'hierarchy', 'components', 'all'];

const SEVERITY = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  MINOR: 'minor',
};

const UI_EXTENSIONS = ['.py', '.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue', '.css', '.html'];

const HEX_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_RE = /\brgba?\s*\(/g;
const TOKEN_USE_RE = /var\(--g360|G360Theme|get_colors\(\)|useTheme|from .theme import|from \$lib\/stores\/theme|(?:^|[^a-zA-Z0-9_$])theme\./m;
const HEADING_RE = /<h([1-6])[\s>]/g;
const FLET_SIZE_RE = /size\s*=\s*(\d+)/g;
const CSS_SIZE_RE = /font-size\s*:\s*(\d+)px/g;

const MIN_TYPE_SIZE = 10;
const MAX_TYPE_SIZE = 64;
const MAX_TYPE_STEPS = 6;
const MAX_UI_FILE_LINES = 400;

const ESSENTIALS = [
  { key: 'header', label: 'Header', flet: [/_build_header|DashboardHeader|AppBar/i], web: [/<Header|header|AppBar|g360-header/i], ctk: [/Sidebar|header|Header/i] },
  { key: 'kpi', label: 'KPI Card', flet: [/KpiCard|kpi_card/i], web: [/Kpi|kpi|KpiCard|g360-kpi/i], ctk: [/Kpi|kpi|Card/i] },
  { key: 'table', label: 'Data Table', flet: [/DataTable|ProductTable|TransferTable/i], web: [/DataTable|<Table|table|g360-table/i], ctk: [/Treeview/i] },
  { key: 'dropzone', label: 'Drop Zone', flet: [/FilePicker|file_picker|DropZone|drop_zone/i], web: [/DropZone|drop.?zone|FilePicker|type=["']file["']|g360-drop/i], ctk: [/askopenfilename|filedialog/i] },
  { key: 'loading', label: 'Loading State', flet: [/ProgressRing|ProgressBar|loading|LoadingOverlay/i], web: [/Loading|loading|Spinner|spinner|Suspense|g360-loading/i], ctk: [/ProgressBar|loading/i] },
  { key: 'footer', label: 'Footer / Signature', flet: [/signature|footer|Footer/i], web: [/Footer|footer|signature|Signature/i], ctk: [/signature|footer|Footer/i] },
  { key: 'export', label: 'Export Menu', flet: [/PopupMenuButton|export|Export|openpyxl|xlsx/i], web: [/Export|export|xlsx|excel|download|Download/i], ctk: [/export|Export|openpyxl|asksaveasfilename/i] },
  { key: 'search', label: 'Search', flet: [/search|Search|debounce/i], web: [/Search|search|debounce/i], ctk: [/search|Search|Entry/i] },
];

function normalizeHex(raw) {
  let h = raw.toLowerCase();
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return { full: h, base: h.slice(0, 7) };
}

function isFullLineComment(trimmed, ext) {
  if (trimmed.startsWith('#')) return true;
  if (['.js', '.jsx', '.ts', '.tsx', '.css', '.svelte', '.vue'].includes(ext)) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;
  }
  if (['.html', '.vue', '.svelte'].includes(ext) && trimmed.startsWith('<!--')) return true;
  return false;
}

export function loadPalette(dir) {
  const candidates = [path.join(dir, 'skill.json'), path.join(dir, 'src', 'core', 'skill.json')];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const skill = fs.readJsonSync(p);
      if (skill && skill.colors && typeof skill.colors === 'object') {
        const colors = new Set();
        for (const v of Object.values(skill.colors)) {
          if (typeof v === 'string' && v.startsWith('#')) colors.add(normalizeHex(v).base);
        }
        if (colors.size > 0) return { file: path.relative(dir, p).replace(/\\/g, '/'), colors };
      }
    } catch { /* skill.json invalido: se ignora */ }
  }
  return null;
}

export function collectUiFiles(dir) {
  const files = [];
  walkProject(dir, {
    onFile: (fullPath, relPath, fileName) => {
      const ext = path.extname(fileName).toLowerCase();
      if (UI_EXTENSIONS.includes(ext)) files.push({ fullPath, relPath, ext });
    },
  });
  return files;
}

export function detectFramework(dir, files) {
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = fs.readJsonSync(pkgPath);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.react) return 'react';
      if (deps['solid-js']) return 'solid';
      if (deps.svelte) return 'svelte';
      if (deps.lit) return 'lit';
      if (deps.vue) return 'vue';
    } catch { /* package.json invalido */ }
  }
  let sawFlet = false;
  let sawCtk = false;
  for (const f of files) {
    if (f.ext !== '.py') continue;
    try {
      const content = fs.readFileSync(f.fullPath, 'utf8');
      if (/^\s*(import|from)\s+flet\b/m.test(content)) sawFlet = true;
      if (/customtkinter/.test(content)) sawCtk = true;
    } catch { /* archivo ilegible */ }
  }
  if (sawFlet) return 'flet';
  if (sawCtk) return 'customtkinter';
  return 'unknown';
}

function isPaletteDefinitionFile(f) {
  if (f.ext !== '.py') return false;
  const base = f.relPath.split('/').pop();
  return base === 'theme.py' || base === 'g360_theme.py';
}

function checkTokens(files, palette, dir) {
  const findings = [];
  let tokenBasedFiles = 0;
  let hardcodedFiles = 0;

  for (const f of files) {
    if (isPaletteDefinitionFile(f)) continue;
    let content;
    try {
      content = fs.readFileSync(f.fullPath, 'utf8');
    } catch { continue; }
    const lines = content.split('\n');
    const perColor = new Map();
    let usesToken = TOKEN_USE_RE.test(content);
    let sawHex = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (isFullLineComment(trimmed, f.ext)) return;
      if (line.includes('--g360-')) return;
      if (line.includes('theme-color')) return;
      HEX_RE.lastIndex = 0;
      let m;
      while ((m = HEX_RE.exec(line)) !== null) {
        sawHex = true;
        const { base } = normalizeHex(m[0]);
        if (!perColor.has(base)) perColor.set(base, { count: 0, lines: [] });
        const entry = perColor.get(base);
        entry.count += 1;
        if (entry.lines.length < 5) entry.lines.push(idx + 1);
      }
      RGB_RE.lastIndex = 0;
      if (RGB_RE.test(line)) {
        findings.push({
          severity: SEVERITY.MINOR,
          file: f.relPath,
          type: 'rgb-literal',
          message: `Color rgb()/rgba() literal en linea ${idx + 1}. Usa un token hexadecimal de skill.json`,
          current: line.trim().slice(0, 80),
          recommended: 'Token hexadecimal de la paleta (ej. #00d084)',
        });
      }
    });

    for (const [base, entry] of perColor) {
      const inPalette = palette.colors.has(base);
      findings.push({
        severity: inPalette ? SEVERITY.MINOR : SEVERITY.IMPORTANT,
        file: f.relPath,
        type: inPalette ? 'hardcoded-token' : 'off-palette',
        message: inPalette
          ? `Color ${base} hardcodeado x${entry.count} (lineas ${entry.lines.join(', ')}). Leelo desde skill.json / theme / var(--g360-*)`
          : `Color ${base} fuera de la paleta del skill x${entry.count} (lineas ${entry.lines.join(', ')}). Usa un color de ${palette.file}`,
        current: base,
        recommended: inPalette ? 'Leer desde skill.json (theme / CSS variable)' : `Color definido en ${palette.file}`,
      });
    }

    if (usesToken) tokenBasedFiles += 1;
    if (sawHex) hardcodedFiles += 1;
  }

  return { findings, tokenBasedFiles, hardcodedFiles };
}

function checkTypeScale(sizes, file) {
  const out = [];
  const outOfScale = [...new Set(sizes.filter((n) => n < MIN_TYPE_SIZE || n > MAX_TYPE_SIZE))];
  if (outOfScale.length > 0) {
    out.push({
      severity: SEVERITY.IMPORTANT,
      file,
      type: 'type-out-of-scale',
      message: `Tamanos fuera de escala (${MIN_TYPE_SIZE}-${MAX_TYPE_SIZE}): ${outOfScale.join(', ')}. Define una escala tipografica H1-H4 + body`,
      current: outOfScale.join(', '),
      recommended: `Escala ${MIN_TYPE_SIZE}-${MAX_TYPE_SIZE}`,
    });
  }
  const distinct = [...new Set(sizes)].sort((a, b) => a - b);
  if (distinct.length > MAX_TYPE_STEPS) {
    out.push({
      severity: SEVERITY.MINOR,
      file,
      type: 'type-scale-drift',
      message: `${distinct.length} tamanos distintos en un archivo (${distinct.join(', ')}). Menos es mas: maximo ${MAX_TYPE_STEPS} pasos (H1, H2, H3, body, caption, mono)`,
      current: distinct.join(', '),
      recommended: `Maximo ${MAX_TYPE_STEPS} pasos tipograficos`,
    });
  }
  return out;
}

function checkHierarchy(files) {
  const findings = [];

  for (const f of files) {
    let content;
    try {
      content = fs.readFileSync(f.fullPath, 'utf8');
    } catch { continue; }
    const lines = content.split('\n');

    if (['.html', '.jsx', '.tsx', '.vue', '.svelte', '.js'].includes(f.ext)) {
      const headings = [];
      lines.forEach((line, idx) => {
        if (isFullLineComment(line.trim(), f.ext)) return;
        HEADING_RE.lastIndex = 0;
        let m;
        while ((m = HEADING_RE.exec(line)) !== null) headings.push({ level: Number(m[1]), line: idx + 1 });
      });
      if (headings.length === 0) continue;
      const h1s = headings.filter((h) => h.level === 1);
      if (h1s.length > 1) {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: f.relPath,
          type: 'multiple-h1',
          message: `${h1s.length} etiquetas <h1> (lineas ${h1s.map((h) => h.line).join(', ')}). Una vista = un solo H1`,
          current: `${h1s.length} x <h1>`,
          recommended: 'Un <h1> por vista, el resto H2-H4',
        });
      }
      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level > headings[i - 1].level + 1) {
          findings.push({
            severity: SEVERITY.MINOR,
            file: f.relPath,
            type: 'skipped-level',
            message: `Salto de jerarquia H${headings[i - 1].level} (linea ${headings[i - 1].line}) a H${headings[i].level} (linea ${headings[i].line}). No saltes niveles`,
            current: `H${headings[i - 1].level} -> H${headings[i].level}`,
            recommended: `H${headings[i - 1].level} -> H${headings[i - 1].level + 1}`,
          });
          break;
        }
      }
    }

    if (f.ext === '.py') {
      const sizes = [];
      FLET_SIZE_RE.lastIndex = 0;
      let m;
      while ((m = FLET_SIZE_RE.exec(content)) !== null) sizes.push(Number(m[1]));
      if (sizes.length > 0) findings.push(...checkTypeScale(sizes, f.relPath));
    }

    if (f.ext === '.css') {
      const sizes = [];
      CSS_SIZE_RE.lastIndex = 0;
      let m;
      while ((m = CSS_SIZE_RE.exec(content)) !== null) sizes.push(Number(m[1]));
      if (sizes.length > 0) findings.push(...checkTypeScale(sizes, f.relPath));
    }
  }

  return findings;
}

function markersFor(framework) {
  if (framework === 'flet') return 'flet';
  if (framework === 'customtkinter') return 'ctk';
  return 'web';
}

function checkComponents(files, framework) {
  const findings = [];
  if (framework === 'unknown') {
    findings.push({
      severity: SEVERITY.MINOR,
      file: '.',
      type: 'unknown-framework',
      message: 'No se detecto framework (flet, react, solid, svelte, lit, vue, customtkinter). La revision de componentes se omite',
      current: 'desconocido',
      recommended: 'Estructura el proyecto segun una plantilla g360 (g360 list templates)',
    });
    return { findings, found: {}, missing: [] };
  }

  const group = markersFor(framework);
  const found = {};
  const contents = new Map();
  for (const f of files) {
    try {
      contents.set(f.relPath, fs.readFileSync(f.fullPath, 'utf8'));
    } catch { /* archivo ilegible */ }
  }
  const allText = [...contents.values()].join('\n');

  for (const essential of ESSENTIALS) {
    const hit = essential[group].some((re) => re.test(allText));
    found[essential.key] = hit;
    if (!hit) {
      findings.push({
        severity: SEVERITY.MINOR,
        file: '.',
        type: 'missing-component',
        message: `Esencial ausente: ${essential.label}. Toda app G360 simetrica incluye: header, KPI, tabla, drop-zone, loading, firma, export y busqueda`,
        current: `sin ${essential.key}`,
        recommended: `Agregar ${essential.label} (ver snippets en G360-CLI-SKILL.md)`,
      });
    }
  }

  for (const [relPath, content] of contents) {
    const ext = path.extname(relPath).toLowerCase();
    const lines = content.split('\n');

    if (ext === '.py' && /(^|\/)ui\//.test(relPath.replace(/\\/g, '/'))) {
      if (/^\s*print\s*\(/m.test(content)) {
        findings.push({
          severity: SEVERITY.MINOR,
          file: relPath,
          type: 'print-in-ui',
          message: 'print() en capa UI. Usa logger o SnackBar/toast para feedback al usuario',
          current: 'print(...)',
          recommended: 'logger.info(...) + show_success/show_error',
        });
      }
    }
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext) && /console\.log\s*\(/.test(content)) {
      findings.push({
        severity: SEVERITY.MINOR,
        file: relPath,
        type: 'console-in-ui',
        message: 'console.log() en UI. Usa un toast/estado visible o un logger',
        current: 'console.log(...)',
        recommended: 'Toast / estado de error visible',
      });
    }
    if (ext === '.py' && /threading\.Thread/.test(content) && !/loading|Loading|Progress|progress/.test(content)) {
      findings.push({
        severity: SEVERITY.IMPORTANT,
        file: relPath,
        type: 'blocking-without-loading',
        message: 'threading.Thread sin loading visible. Toda operacion bloqueante DEBE mostrar feedback (AGENTS-UIUX.md 2.4)',
        current: 'threading.Thread sin loading',
        recommended: 'show_loading() / hide_loading() + ProgressRing',
      });
    }
    if (['.js', '.jsx', '.ts', '.tsx', '.svelte', '.vue'].includes(ext) && /fetch\s*\(|axios\./.test(content) && !/loading|Loading|spinner|Spinner|Suspense/.test(content)) {
      findings.push({
        severity: SEVERITY.IMPORTANT,
        file: relPath,
        type: 'blocking-without-loading',
        message: 'fetch/axios sin estado de carga visible. Toda operacion bloqueante DEBE mostrar feedback',
        current: 'fetch sin loading',
        recommended: '<LoadingOverlay /> / spinner + estado error',
      });
    }
    if (ext === '.py') {
      const noGuards = content.replace(/except\s*\(?[^:\n]*\b(ImportError|ModuleNotFoundError)\b[^:\n]*:\s*\n\s*pass\b[^\n]*/g, '');
      if (/except[^:]*:\s*\n\s*pass\b/.test(noGuards)) {
        findings.push({
          severity: SEVERITY.IMPORTANT,
          file: relPath,
          type: 'silent-error',
          message: 'except con solo pass: error silencioso. Muestra el error al usuario (SnackBar rojo)',
          current: 'except: pass',
          recommended: 'show_error(page, str(e)) + logger.error',
        });
      }
    }
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext) && /catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) {
      findings.push({
        severity: SEVERITY.IMPORTANT,
        file: relPath,
        type: 'silent-error',
        message: 'catch vacio: error silencioso. Muestra el error al usuario',
        current: 'catch {} vacio',
        recommended: 'Toast de error + log con contexto',
      });
    }
    if (lines.length > MAX_UI_FILE_LINES && /(^|\/)(ui|components|views|routes|lib)\//.test(relPath.replace(/\\/g, '/'))) {
      findings.push({
        severity: SEVERITY.MINOR,
        file: relPath,
        type: 'file-too-large',
        message: `Archivo UI de ${lines.length} lineas (maximo ${MAX_UI_FILE_LINES}). Menos es mas: divide en componentes (KpiCard, Table, Modal...)`,
        current: `${lines.length} lineas`,
        recommended: 'Un componente por archivo en ui/components/',
      });
    }
  }

  return { findings, found, missing: ESSENTIALS.filter((e) => !found[e.key]).map((e) => e.key) };
}

export function reviewProject(dir, level = 'all') {
  const files = collectUiFiles(dir);
  const framework = detectFramework(dir, files);
  const palette = loadPalette(dir);
  const findings = [];
  let tokenStats = { tokenBasedFiles: 0, hardcodedFiles: 0 };
  let componentStats = { found: {}, missing: [] };

  if (!palette && (level === 'all' || level === 'tokens')) {
    findings.push({
      severity: SEVERITY.MINOR,
      file: 'skill.json',
      type: 'missing-skill',
      message: 'Sin skill.json no se puede validar la paleta. Crea skill.json con colors (g360 set-skill <skill>)',
      current: 'ausente',
      recommended: 'skill.json con name, colors, signature',
    });
  }

  if ((level === 'all' || level === 'tokens') && palette) {
    const r = checkTokens(files, palette, dir);
    findings.push(...r.findings);
    tokenStats = { tokenBasedFiles: r.tokenBasedFiles, hardcodedFiles: r.hardcodedFiles };
  }

  if (level === 'all' || level === 'hierarchy') {
    findings.push(...checkHierarchy(files));
  }

  if (level === 'all' || level === 'components') {
    const r = checkComponents(files, framework);
    findings.push(...r.findings);
    componentStats = { found: r.found, missing: r.missing };
  }

  const critical = findings.filter((f) => f.severity === SEVERITY.CRITICAL).length;
  const important = findings.filter((f) => f.severity === SEVERITY.IMPORTANT).length;
  const minor = findings.filter((f) => f.severity === SEVERITY.MINOR).length;
  const score = Math.max(0, 100 - critical * 10 - important * 3 - minor * 1);

  return {
    framework,
    palette: palette ? { file: palette.file, colors: [...palette.colors] } : null,
    findings,
    score,
    summary: {
      filesScanned: files.length,
      critical,
      important,
      minor,
      tokenBasedFiles: tokenStats.tokenBasedFiles,
      hardcodedFiles: tokenStats.hardcodedFiles,
      componentsFound: componentStats.found,
      componentsMissing: componentStats.missing,
    },
  };
}
