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
      const filePath = path.join(uiDir, file);
      if (await fs.pathExists(filePath)) {
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
  }

  // 4. Escanear modals
  const modalsDir = path.join(projectDir, 'src', 'ui', 'modals');
  if (await fs.pathExists(modalsDir)) {
    const modalFiles = await fs.readdir(modalsDir);
    for (const file of modalFiles) {
      if (file === '__pycache__' || file.endsWith('.pyc')) continue;
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

  // 6. Detectar Screenshots disponibles
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

  // 7. Construir features list
  result.features = result.features.map(f => ({
    ...f,
    screenshotIndex: result.screenshots.findIndex(s => s.filename.includes(f.name.toLowerCase().slice(0, 4))),
  }));

  return result;
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
