/**
 * Template Manual de App G360 — 12 slides A4.
 * 
 * Estructura:
 * 1.  Portada
 * 2.  ¿Qué es esta app?
 * 3.  Requisitos / Instalacion
 * 4.  Inicio — primera pantalla
 * 5-N. Funcionalidades (una por feature detectada)
 * N+1. Flujos de trabajo (modals)
 * N+2. Arquitectura
 * N+3. Buenas prácticas
 * N+4. Resumen
 */
import PptxGenJS from 'pptxgenjs';
import { createG360Theme, createCipsaTheme } from '../themes/index.js';
import {
  coverSlide,
  screenshotSlide,
  featureSlide,
  workflowSlide,
  architectureSlide,
  checklistSlide,
  kpiSlide,
  addFooter,
  addSectionHeader,
} from '../layouts/base.js';

/**
 * Genera un manual PPTX completo para una app G360.
 * 
 * @param {object} appData — resultado de analyzeApp()
 * @param {object} options — { mode, theme, outDir }
 * @returns {Promise<string>} — ruta del archivo .pptx generado
 */
export async function generateManualPptx(appData, options = {}) {
  const { mode = 'manual', theme: themeName = null } = options;
  
  // Seleccionar theme
  const theme = themeName === 'cipsa' || (!themeName && appData.brand === 'cipsa')
    ? createCipsaTheme()
    : createG360Theme();
  
  const { pptx, colors } = theme;
  
  // Configurar tamaño segun modo
  if (mode === 'demo') {
    pptx.layout = 'LAYOUT_16x9';
  } else {
    pptx.layout = 'A4';
  }

  // ===== SLIDE 1: Portada =====
  let slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  coverSlide(slide, {
    appName: appData.name || 'Mi Aplicacion G360',
    description: appData.description || 'Documentacion de uso y funcionalidades',
    version: appData.version,
    brand: appData.brand,
  }, theme);
  addFooter(slide, theme, 1, 12);

  // ===== SLIDE 2: ¿Qué es? =====
  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addSectionHeader(slide, 'INTRODUCCION', theme);
  featureSlide(slide, {
    title: '¿Qué es ' + (appData.name || 'esta app') + '?',
    description: appData.description || 'Aplicacion de escritorio construida con Flet y los estandares G360.',
    bullets: [
      'Monitoriza datos en tiempo real desde el ERP',
      'Genera reportes y analisis automaticos',
      'Soporta dual theme (claro/oscuro)',
      'Funciona offline con cache local',
    ],
  }, theme);
  addFooter(slide, theme, 2, 12);

  // ===== SLIDE 3: Instalacion =====
  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addSectionHeader(slide, 'INSTALACION', theme);
  const installSteps = [
    { title: 'Ejecutar run.bat', desc: 'El launcher instala uv, Python 3.11, dependencias y crea acceso directo.' },
    { title: 'O usar comando directo', desc: 'uv sync && uv run python main.py' },
    { title: 'Version portable', desc: 'Descomprimir zip y ejecutar launch.vbs (sin dependencias).' },
  ];
  workflowSlide(slide, {
    title: 'Como iniciar la aplicacion',
    steps: installSteps,
  }, theme);
  addFooter(slide, theme, 3, 12);

  // ===== SLIDES 4+: Features / Screenshots =====
  let slideNum = 4;
  const totalFeatures = Math.min(appData.features.length, 6); // max 6 features en manual
  const totalSlides = 3 + totalFeatures + 3; // intro + features + workflows + arch + summary
  
  // Slide 4: Dashboard / inicio
  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addSectionHeader(slide, 'PRIMERA VISTA', theme);
  const dashScreen = appData.screenshots?.find(s => s.filename.toLowerCase().includes('dash'));
  screenshotSlide(slide, {
    title: 'Dashboard Principal',
    description: appData.hasAutoRefresh
      ? 'Vista principal con KPIs en tiempo real y auto-refresh cada 15 minutos.'
      : 'Vista principal de la aplicacion con los indicadores clave del negocio.',
    screenshotPath: dashScreen?.path,
  }, theme);
  addFooter(slide, theme, slideNum, totalSlides);
  slideNum++;

  // Features individual slides
  for (const feature of appData.features.slice(0, totalFeatures)) {
    slide = pptx.addSlide();
    slide.background = { color: colors.bg };
    addSectionHeader(slide, 'FUNCIONALIDAD', theme);
    
    const shot = appData.screenshots?.find(s =>
      feature.name.toLowerCase().includes(s.filename.toLowerCase().slice(0, 6))
    );
    
    const classification = classifyFeatureForSlide(feature);
    
    if (classification === 'kpi' && feature.name.includes('Kpi')) {
      kpiSlide(slide, {
        title: feature.display || feature.name,
        kpis: generateKpiPlaceholders(feature),
      }, theme);
    } else if (classification === 'workflow') {
      workflowSlide(slide, {
        title: feature.display || feature.name,
        steps: [`Acceder desde el menu principal`, 'Seleccionar opciones disponibles', 'Confirmar y generar resultado'],
      }, theme);
    } else {
      featureSlide(slide, {
        title: feature.display || feature.name,
        description: `Module ubicado en src/ui/${feature.file}`,
        bullets: [
          'Clase exportada desde src/ui/',
          'Integracion con Dashboard principal',
          'Soporta dual theme automaticamente',
        ],
      }, theme);
    }
    
    if (!shot) {
      // Agregar placeholder si no hay screenshot
      slide.addShape('rect', [1, 3.5, 8, 6], {
        fill: { color: colors.surface },
        line: { color: colors.border, width: 1, dashType: 'dash' },
      });
      slide.addText('📷 Screenshot: ' + (feature.display || feature.name), [1, 6, 8, 0.5], {
        fontSize: 12, color: colors.textLight, fontFace: 'Inter', align: 'center',
      });
    } else {
      screenshotSlide(slide, {
        title: feature.display || feature.name,
        description: `Módulo: src/ui/${feature.file}`,
        screenshotPath: shot.path,
      }, theme);
      slide.clearShapes?.(); // remove placeholder
    }
    
    addFooter(slide, theme, slideNum, totalSlides);
    slideNum++;
  }

  // ===== Workflows (modals) =====
  if (appData.hasModals.length > 0) {
    slide = pptx.addSlide();
    slide.background = { color: colors.bg };
    addSectionHeader(slide, 'FLUJOS DE TRABAJO', theme);
    
    const steps = appData.hasModals.slice(0, 4).map((modal, i) => ({
      title: `Modal: ${modal}`,
      desc: 'Paso 1 → Paso 2 → Paso 3',
    }));
    
    workflowSlide(slide, {
      title: 'Modales y flujos de usuario',
      steps,
    }, theme);
    addFooter(slide, theme, slideNum, totalSlides);
    slideNum++;
  }

  // ===== Architecture =====
  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addSectionHeader(slide, 'ARQUITECTURA', theme);
  architectureSlide(slide, {
    title: 'Estructura de capas',
    layers: [
      { name: 'UI', desc: 'Dashboard, Cards, Modals, Overlays', color: colors.accent },
      { name: 'Core', desc: 'Processor, Downloader, Models', color: colors.info },
      { name: 'Config', desc: 'Theme, Constants, Skill', color: colors.violet },
      { name: 'Data', desc: 'API S1, Catalogo JSON, Cache', color: colors.success },
    ],
  }, theme);
  addFooter(slide, theme, slideNum, totalSlides);
  slideNum++;

  // ===== Checklist / Buenas prácticas =====
  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addSectionHeader(slide, 'BUENAS PRÁCTICAS', theme);
  checklistSlide(slide, {
    title: 'Recomendaciones de uso',
    items: [
      { text: 'Mantener nombres de clases siguiendo PascalCase (KpiCard, Dashboard)', checked: true },
      { text: 'Usar theme.py para colores, nunca hardcodear #HEX', checked: true },
      { text: 'Registrar eventos con publish_g360_event() para comunicacion entre apps', checked: true },
      { text: 'Implementar shutdown() para limpieza de threads al cerrar', checked: true },
      { text: 'Documentar funciones con docstrings en español', checked: true },
      { text: 'Usar G360 Signature widget en el footer de la app', checked: true },
    ],
  }, theme);
  addFooter(slide, theme, slideNum, totalSlides);
  slideNum++;

  // ===== Summary =====
  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addSectionHeader(slide, 'RESUMEN', theme);
  
  const summaryItems = [
    `Nombre: ${appData.name || 'N/A'}`,
    `Version: ${appData.version || '1.0.0'}`,
    `Framework: ${appData.framework || 'Flet'}`,
    `Skills: ${appData.skill || 'N/A'}`,
    `Caracteristicas: ${appData.features.length} modulos UI`,
    appData.hasAutoRefresh ? 'Auto-refresh activado' : '',
    appData.hasSearch ? 'Buscador flotante implementado' : '',
    appData.hasExport ? 'Exportacion a Excel disponible' : '',
    appData.hasModals.length > 0 ? `${appData.hasModals.length} modales de trabajo` : '',
  ].filter(Boolean);
  
  checklistSlide(slide, {
    title: 'Resumen de la aplicacion',
    items: summaryItems.map(t => ({ text: t, checked: true })),
  }, theme);
  addFooter(slide, theme, slideNum, totalSlides);

  // Save
  const outPath = options.outPath || path.join(process.cwd(), `${(appData.name || 'app').toLowerCase().replace(/\s+/g, '-')}-manual.pptx`);
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

/**
 * Classifica feature para decidir que slide usar.
 */
function classifyFeatureForSlide(feature) {
  if (feature.name.includes('Kpi')) return 'kpi';
  if (feature.name.includes('Modal') || feature.name.includes('Dialog')) return 'workflow';
  if (feature.name.includes('Dashboard')) return 'screenshot';
  return 'feature';
}

/**
 * Genera placeholders de KPIs basado en features detectadas.
 */
function generateKpiPlaceholders(feature) {
  return [
    { label: 'Total', value: '—', color: '#64748B' },
    { label: 'Con Stock', value: '—', color: '#34D399' },
    { label: 'Sin Stock', value: '—', color: '#EF4444' },
    { label: 'Alertas', value: '—', color: '#F59E0B' },
  ];
}

import path from 'path';
