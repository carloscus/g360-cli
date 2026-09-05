/**
 * Layouts reutilizables para slides G360.
 * Cada layout recibe (slide, theme) y retorna el slide modificado.
 */

/**
 * Cover slide — portada de la app
 */
export function coverSlide(slide, data, theme) {
  const { pptx, colors } = theme;
  slide.addText(data.appName || 'Mi App G360', [0.5, 1.5, 9, 1.2], {
    fontSize: 44, bold: true, color: colors.text, fontFace: 'Inter',
    align: 'center', margin: 0,
  });
  slide.addText(data.description || 'Aplicacion de gestion y monitoreo', [0.5, 3.0, 9, 0.8], {
    fontSize: 20, color: colors.textLight, fontFace: 'Inter',
    align: 'center', margin: 0,
  });
  if (data.version) {
    slide.addText(`v${data.version}`, [0.5, 4.0, 9, 0.5], {
      fontSize: 14, color: colors.accent, fontFace: 'Inter',
      align: 'center', margin: 0,
    });
  }
  if (data.brand && data.brand === 'cipsa') {
    slide.addText('CIPSA', [0.5, 10.5, 9, 0.5], {
      fontSize: 12, color: colors.textLight, fontFace: 'Inter',
      align: 'center', margin: 0,
    });
  }
  // Linea decorativa inferior
  slide.addShape(pptx.ShapeType.rect, [0, 13.5, 10, 0.05], {
    fill: { color: colors.accent }, line: { color: colors.accent },
  });
  return slide;
}

/**
 * Screenshot slide — con placeholder flexible para imagen
 * data: { title, description, screenshotPath?, screenshotIndex? }
 */
export function screenshotSlide(slide, data, theme) {
  const { colors } = theme;
  slide.addText(data.title || 'Captura de Pantalla', [0.5, 0.3, 9, 0.5], {
    fontSize: 18, bold: true, color: colors.text, fontFace: 'Inter',
  });
  if (data.description) {
    slide.addText(data.description, [0.5, 0.85, 9, 0.4], {
      fontSize: 12, color: colors.textLight, fontFace: 'Inter',
    });
  }
  // Area de imagen (80% ancho, centro)
  const imgX = 0.5, imgY = 1.4, imgW = 9, imgH = 9.5;
  if (data.screenshotPath) {
    slide.addImage({ path: data.screenshotPath, x: imgX, y: imgY, w: imgW, h: imgH });
  } else {
    // Placeholder con borde punteado
    slide.addShape('rect', [imgX, imgY, imgW, imgH], {
      fill: { color: colors.surface },
      line: { color: colors.border, width: 2, dashType: 'dash' },
    });
    slide.addText('📷 Insertar screenshot aquí', [imgX, imgY + 4, imgW, 1], {
      fontSize: 16, color: colors.textLight, fontFace: 'Inter',
      align: 'center', valign: 'middle',
    });
  }
  return slide;
}

/**
 * Feature slide — icono + titulo + descripcion
 */
export function featureSlide(slide, data, theme) {
  const { colors } = theme;
  slide.addText(data.title || 'Funcionalidad', [0.5, 0.3, 9, 0.6], {
    fontSize: 22, bold: true, color: colors.text, fontFace: 'Inter',
  });
  // description como string unico (PptxGenJS no acepta array de strings plano)
  const desc = data.description || '';
  slide.addText(desc, [0.5, 1.0, 9, 1.5], { fontSize: 14, color: colors.text, fontFace: 'Inter' });
  // bullets
  if (data.bullets && Array.isArray(data.bullets) && data.bullets.length > 0) {
    const bulletTexts = data.bullets.map(b => ({ text: b, options: { bullet: true } }));
    slide.addText(bulletTexts, [0.5, 2.6, 9, data.bullets.length * 0.4], {
      fontSize: 13, color: colors.text, fontFace: 'Inter',
    });
  }
  return slide;
}

/**
 * Workflow slide — pasos numerados con flechas
 */
export function workflowSlide(slide, data, theme) {
  const { colors } = theme;
  slide.addText(data.title || 'Flujo de trabajo', [0.5, 0.3, 9, 0.5], {
    fontSize: 18, bold: true, color: colors.text, fontFace: 'Inter',
  });
  const steps = data.steps || [];
  const stepHeight = 1.8;
  const startY = 1.0;
  steps.forEach((step, i) => {
    const y = startY + i * stepHeight;
    slide.addText(String(i + 1), [0.5, y, 0.5, 0.4], {
      fontSize: 16, bold: true, color: colors.accent, fontFace: 'Inter',
    });
    slide.addText(step.title || '', [1.2, y, 3.5, 0.4], {
      fontSize: 14, bold: true, color: colors.text, fontFace: 'Inter',
    });
    slide.addText(step.desc || '', [1.2, y + 0.4, 8, 0.6], {
      fontSize: 12, color: colors.textLight, fontFace: 'Inter',
    });
    if (i < steps.length - 1) {
      slide.addText('↓', [0.6, y + 0.85, 0.4, 0.4], {
        fontSize: 18, color: colors.accent, fontFace: 'Inter',
      });
    }
  });
  return slide;
}

/**
 * Architecture slide — diagrama por capas (core/ui/data)
 */
export function architectureSlide(slide, data, theme) {
  const { colors } = theme;
  slide.addText(data.title || 'Arquitectura', [0.5, 0.3, 9, 0.5], {
    fontSize: 18, bold: true, color: colors.text, fontFace: 'Inter',
  });
  const layers = data.layers || [
    { name: 'UI', desc: 'Dashboard, KPIs, Modals', color: colors.accent },
    { name: 'Core', desc: 'Processor, Downloader, Models', color: colors.info },
    { name: 'Data', desc: 'API S1, Catalogo, Cache', color: colors.violet },
  ];
  const layerH = 2.2;
  const startY = 1.0;
  layers.forEach((layer, i) => {
    const y = startY + i * (layerH + 0.2);
    slide.addShape('rect', [0.5, y, 9, layerH], {
      fill: { color: layer.color + '20' },
      line: { color: layer.color, width: 1.5 },
    });
    slide.addText(layer.name, [0.7, y + 0.3, 2.5, 0.5], {
      fontSize: 16, bold: true, color: layer.color, fontFace: 'Inter',
    });
    slide.addText(layer.desc, [3.3, y + 0.35, 6, 0.4], {
      fontSize: 13, color: colors.text, fontFace: 'Inter',
    });
    if (i < layers.length - 1) {
      slide.addText('▼', [4.5, y + layerH + 0.05, 0.5, 0.2], {
        fontSize: 10, color: colors.textLight, fontFace: 'Inter',
      });
    }
  });
  return slide;
}

/**
 * Checklist slide — buenas practicas / resumen
 */
export function checklistSlide(slide, data, theme) {
  const { colors } = theme;
  slide.addText(data.title || 'Resumen', [0.5, 0.3, 9, 0.5], {
    fontSize: 18, bold: true, color: colors.text, fontFace: 'Inter',
  });
  const items = data.items || [];
  items.forEach((item, i) => {
    const y = 0.9 + i * 0.55;
    const checked = item.checked !== false;
    slide.addText(checked ? '✓' : '○', [0.5, y, 0.4, 0.4], {
      fontSize: 14, color: checked ? colors.success : colors.textLight, fontFace: 'Arial',
    });
    slide.addText(item.text || '', [1.0, y, 8.5, 0.4], {
      fontSize: 13, color: colors.text, fontFace: 'Inter',
    });
  });
  return slide;
}

/**
 * KPI / metrics slide — para dashboards
 */
export function kpiSlide(slide, data, theme) {
  const { colors } = theme;
  slide.addText(data.title || 'Indicadores clave', [0.5, 0.3, 9, 0.5], {
    fontSize: 18, bold: true, color: colors.text, fontFace: 'Inter',
  });
  const kpis = data.kpis || [];
  const cols = Math.min(kpis.length, 4);
  const colW = 9 / cols;
  kpis.forEach((kpi, i) => {
    const x = 0.5 + i * colW + colW * 0.1;
    const w = colW * 0.8;
    slide.addShape('rect', [x, 1.0, w, 2.5], {
      fill: { color: (kpi.color || colors.accent) + '15' },
      line: { color: kpi.color || colors.accent, width: 1 },
    });
    slide.addText(kpi.value || '—', [x, 1.1, w, 0.9], {
      fontSize: 28, bold: true, color: kpi.color || colors.accent, fontFace: 'JetBrains Mono',
      align: 'center',
    });
    slide.addText(kpi.label || '', [x, 2.0, w, 0.3], {
      fontSize: 11, color: colors.textLight, fontFace: 'Inter', align: 'center',
    });
    if (kpi.sub) {
      slide.addText(kpi.sub, [x, 2.35, w, 0.3], {
        fontSize: 10, color: colors.textLight, fontFace: 'Inter', align: 'center',
      });
    }
  });
  return slide;
}

/**
 * Footer con branding G360
 */
export function addFooter(slide, theme, slideNum, totalSlides) {
  const { colors } = theme;
  slide.addText('powered by G360', [7.5, 13.7, 2.2, 0.3], {
    fontSize: 10, color: colors.textLight, fontFace: 'Inter', align: 'right',
  });
  slide.addText(`${slideNum} / ${totalSlides}`, [8.5, 13.9, 1, 0.25], {
    fontSize: 9, color: colors.textLight, fontFace: 'Inter', align: 'right',
  });
}

/**
 * Helper: agregar seccion header comun
 */
export function addSectionHeader(slide, section, theme) {
  const { colors } = theme;
  slide.addText(section, [0.5, 0.15, 9, 0.35], {
    fontSize: 10, bold: true, color: colors.accent, fontFace: 'Inter',
    charSpacing: 2,
  });
  slide.addShape('rect', [0.5, 0.52, 9, 0.02], {
    fill: { color: colors.accent }, line: { color: colors.accent },
  });
}
