/**
 * Analisis de app G360 — extrae features, screens y flujos de la estructura estandarizada.
 * Aprovecha las convenciones FLET-NAMING-CONVENTIONS.md para parseo deterministico.
 */
import fs from 'fs-extra';
import path from 'path';

/**
 * Clases UI conocidas → nombre legible para el usuario.
 */
const UI_CLASS_MAP = {
  'KpiCard': 'Indicadores KPI',
  'Dashboard': 'Dashboard',
  'WarehouseCard': 'Tarjeta de Almacen',
  'SearchOverlay': 'Buscador Flotante',
  'ExportModal': 'Exportar a Excel',
  'SkuDetailModal': 'Detalle de SKU',
  'TrasladosModal': 'Traslados entre Almacenes',
  'SinStockModal': 'Productos Sin Stock',
  'LineaSection': 'Seccion por Linea',
  'AppSidebar': 'Barra Lateral',
  'LoadingOverlay': 'Indicador de Carga',
  'HealthBadge': 'Estado de Salud',
};

/**
 * Patrón para detectar metodos desde src/app.py.
 */
const METHOD_PATTERN = /def\s+(_(?:setup|build|on|fetch|load|save|update|show|hide|toggle|validate|format)[_\w]*)/g;

/**
 * Patrón para detectar imports de clases UI.
 */
const IMPORT_UI_PATTERN = /from\s+src\.ui\.\w+\s+import\s+([\w,]+)/g;

/**
 * Analiza la estructura de una app G360.
 */
export async function analyzeApp(projectDir) {
  const result = {
    name: '',
    version: '',
    description: '',
    brand: 'g360',
    skill: '',
    framework: '',
    features: [],
    screens: [],
    workflows: [],
    modules: [],
    screenshots: [],
    hasSource1: false,
    hasSource2: false,
    hasExport: false,
    hasAutoRefresh: false,
    hasSearch: false,
    hasModals: [],
    templates: [],
  };

  // 1. Leer skill.json
  const skillPath = path.join(projectDir, 'skill.json');
  if (await fs.pathExists(skillPath)) {
    try {
      const skill = await fs.readJson(skillPath);
      result.name = skill.name || result.name;
      result.description = skill.description || result.description;
      result.brand = skill.brand || 'g360';
      result.skill = skill.skill || skill.name || '';
      result.framework = skill.framework || '';
      result.version = skill.version || '';
      result.events = skill.events || [];
    } catch { /* ignorar */ }
  }

  // 2. Leer manifest
  const manifestPath = path.join(projectDir, 'g360-manifest.json');
  if (await fs.pathExists(manifestPath)) {
    try {
      const manifest = await fs.readJson(manifestPath);
      result.name = manifest.name || result.name;
      result.version = manifest.version || result.version;
    } catch { /* ignorar */ }
  }

  // 3. Escanear src/ui/ para clases UI conocidas
  const uiDir = path.join(projectDir, 'src', 'ui');
  if (await fs.pathExists(uiDir)) {
    const uiFiles = await fs.readdir(uiDir);
    for (const file of uiFiles) {
      if (file === '__pycache__' || file.endsWith('.pyc')) continue;
      if (file === '__init__.py') continue;
      const filePath = path.join(uiDir, file);
      const st = await fs.stat(filePath).catch(() => null);
      if (!st || !st.isFile()) continue;
      const content = await fs.readFile(filePath, 'utf-8');
      const className = file.replace('.py', '');
      const displayName = UI_CLASS_MAP[className] || className;
      result.features.push({
        name: className,
        display: displayName,
        file,
        path: filePath,
      });
    }
  }

  // 4. Escanear modals
  const modalsDir = path.join(projectDir, 'src', 'ui', 'modals');
  if (await fs.pathExists(modalsDir)) {
    const modalFiles = await fs.readdir(modalsDir);
    for (const file of modalFiles) {
      if (file === '__pycache__' || file.endsWith('.pyc')) continue;
      if (file === '__init__.py') continue;
      const className = file.replace('.py', '');
      const displayName = UI_CLASS_MAP[className] || className;
      result.hasModals.push(className);
      result.workflows.push({
        name: className,
        display: displayName,
        steps: [`Abrir ${displayName}`, 'Interactuar con datos', 'Confirmar o cancelar'],
      });
    }
  }

  // 5. Detectar features desde src/app.py
  const appPy = path.join(projectDir, 'src', 'app.py');
  if (await fs.pathExists(appPy)) {
    const content = await fs.readFile(appPy, 'utf-8');
    
    // Detectar auto-refresh
    if (content.includes('auto_refresh') || content.includes('_auto_refresh')) {
      result.hasAutoRefresh = true;
    }
    // Detectar busqueda
    if (content.includes('search') || content.includes('SearchOverlay')) {
      result.hasSearch = true;
    }
    // Detectar source1
    if (content.includes('download_source1') || content.includes('source1')) {
      result.hasSource1 = true;
    }
    // Detectar export
    if (content.includes('export') || content.includes('excel') || content.includes('openpyxl')) {
      result.hasExport = true;
    }

    // Extraer metodos _on_* como flujos de usuario
    const methods = content.match(METHOD_PATTERN) || [];
    for (const match of methods) {
      const methodName = match.replace('def ', '').trim();
      if (methodName.startsWith('_on_')) {
        const displayName = methodName
          .replace('_on_', '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        result.templates.push({
          type: 'interaction',
          name: methodName,
          display: displayName,
        });
      }
    }
  }

  // 6. Detección web: framework, módulos y capacidades desde package.json
  await analyzeWebApp(projectDir, result);

  // 7. Detectar Screenshots disponibles
  const screenshotsDir = path.join(projectDir, 'assets', 'screenshots');
  if (await fs.pathExists(screenshotsDir)) {
    try {
      const files = await fs.readdir(screenshotsDir);
      result.screenshots = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f)).map(f => ({
        filename: f,
        path: path.join(screenshotsDir, f),
      }));
    } catch { /* ignorar */ }
  }

  // 8. Construir features list
  result.features = result.features.map(f => ({
    ...f,
    screenshotIndex: result.screenshots.findIndex(s => s.filename.includes(f.name.toLowerCase().slice(0, 4))),
  }));

  return result;
}

/**
 * Descripciones legibles para rutas web conocidas.
 */
const WEB_ROUTE_MAP = {
  dashboard: 'Vista principal: resumen operativo, KPIs y accesos a los módulos',
  hoy: 'Agenda del día: prioridades, alertas y avance',
  radar: 'Oportunidades priorizadas y ruta del día',
  netos: 'Montos netos jerárquicos por periodo',
  clientes: 'Directorio de clientes con filtros y búsqueda',
  ficha: 'Ficha de detalle por cliente con historial y precios',
  login: 'Autenticación y validación de acceso',
  reportes: 'Reportes y exportación de datos',
  stock: 'Consulta de existencias en tiempo real',
  pedidos: 'Gestión de pedidos y vigencias',
  config: 'Configuración y preferencias de la app',
};

const WEB_COMPONENT_MAP = {
  'app-root': 'Contenedor principal de la aplicación',
  'stock-header': 'Encabezado con estado de conexión y acciones',
  'stock-search': 'Búsqueda de productos con coincidencias en vivo',
  'stock-alerts': 'Alertas de quiebres de stock y reposición',
  'estado-panel': 'Panel de estado por almacén/producto',
  'pulso-form': 'Formulario de registro de datos de campo',
  'sin-catalogo-panel': 'Aviso de catálogo no disponible con acción de carga',
  'login': 'Autenticación y validación de acceso',
};

/**
 * Detección para apps web: SvelteKit (routes), React (pages),
 * Lit/Componentes (src/components) y capacidades desde package.json.
 */
async function analyzeWebApp(projectDir, result) {
  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = (await fs.pathExists(pkgPath))
    ? await fs.readJson(pkgPath).catch(() => null)
    : null;
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const hasDep = (n) => Object.keys(deps).some((d) => d === n || d.startsWith(n));

  if (pkg) {
    result.name = result.name || pkg.name || '';
    result.version = result.version || pkg.version || '';
  }

  // Framework
  if (hasDep('@sveltejs/kit')) result.framework = result.framework || 'SvelteKit';
  else if (hasDep('lit')) result.framework = result.framework || 'Lit';
  else if (hasDep('react')) result.framework = result.framework || 'React';
  else if (hasDep('vue')) result.framework = result.framework || 'Vue';
  if (result.framework) result.type = 'web';

  // Capabilidades desde dependencias
  if (hasDep('exceljs') || hasDep('xlsx') || hasDep('sheetjs')) result.hasExport = true;
  if (hasDep('@supabase/supabase-js')) result.hasSupabase = true;
  if (hasDep('vite-plugin-pwa') || hasDep('workbox-window')) result.hasPwa = true;
  if (hasDep('chart.js') || hasDep('recharts') || hasDep('echarts')) result.hasCharts = true;
  if (hasDep('tailwindcss') || hasDep('@tailwindcss/vite')) result.hasTailwind = true;

  // Módulos: SvelteKit routes (src/routes/**/+page.svelte, incluye subrutas dinámicas)
  const routesDir = path.join(projectDir, 'src', 'routes');
  if (await fs.pathExists(routesDir)) {
    const entries = await fs.readdir(routesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const routeDir = path.join(routesDir, entry.name);
      const pageFile = await findPageSvelte(routeDir);
      if (!pageFile) continue;
      result.features.push({
        name: entry.name,
        display: capitalize(entry.name),
        desc: WEB_ROUTE_MAP[entry.name] || `Sección ${entry.name} de la aplicación.`,
        file: path.relative(projectDir, pageFile).split(path.sep).join('/'),
        path: pageFile,
        kind: 'route',
      });
      result.modules.push(entry.name);
    }
  }

  // Módulos: componentes web destacados (src/components/*.js) — solo si no hay routes
  const componentsDir = path.join(projectDir, 'src', 'components');
  if (result.features.length === 0 && await fs.pathExists(componentsDir)) {
    const files = (await fs.readdir(componentsDir))
      .filter((f) => /\.(js|ts)$/.test(f));
    for (const file of files) {
      const base = file.replace(/\.(js|ts)$/, '');
      result.features.push({
        name: base,
        display: componentDisplayName(base),
        desc: WEB_COMPONENT_MAP[base] || `Componente de interfaz ${base}.`,
        file: `src/components/${file}`,
        path: path.join(componentsDir, file),
        kind: 'component',
      });
    }
  }

  // Buscador global: por nombre de componente/ruta o contenido de las páginas
  if (result.features.some((f) => /search|busca/i.test(f.name))) {
    result.hasSearch = true;
  } else {
    for (const f of result.features) {
      if (f.path && /\.(svelte|js|ts)$/.test(f.path)) {
        try {
          const content = await fs.readFile(f.path, 'utf-8');
          if (/search|buscador|lupa/i.test(content)) { result.hasSearch = true; break; }
        } catch { /* ignorar */ }
      }
    }
  }

  // Flujos web: modales/buscador como workflows si hay PWA/Supabase (solo títulos)
  if (result.features.length > 0 && result.hasPwa) {
    result.workflows.push({
      name: 'PWA',
      display: 'Instalación PWA y modo offline',
      steps: [
        'Abrir la URL de la app en el navegador',
        'Instalar desde el menú (Android/iOS)',
        'Usar con cache offline cuando no haya señal',
      ],
    });
  }
  if (result.hasSearch) {
    result.workflows.push({
      name: 'Busqueda',
      display: 'Búsqueda global',
      steps: ['Abrir el buscador', 'Escribir el criterio', 'Abrir el resultado'],
    });
  }
}

function componentDisplayName(base) {
  return base
    .replace(/-([a-z])/g, (_, c) => ' ' + c.toUpperCase())
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Busca recursivamente +page.svelte dentro de un directorio de ruta (subrutas dinámicas incluidas). */
async function findPageSvelte(dir, depth = 0) {
  if (depth > 3) return null;
  const direct = path.join(dir, '+page.svelte');
  if (await fs.pathExists(direct)) return direct;
  try {
    const children = await fs.readdir(dir, { withFileTypes: true });
    for (const child of children) {
      if (!child.isDirectory()) continue;
      const found = await findPageSvelte(path.join(dir, child.name), depth + 1);
      if (found) return found;
    }
  } catch { /* ignorar */ }
  return null;
}

/**
 * Mapeo de clase UI → tipo de slide recomendado.
 */
export function classifyFeature(feature) {
  if (feature.name.includes('Kpi') || feature.name.includes('Card')) return 'kpi';
  if (feature.name.includes('Modal')) return 'workflow';
  if (feature.name.includes('Dashboard')) return 'screenshot';
  if (feature.name.includes('Search')) return 'feature';
  return 'feature';
}
