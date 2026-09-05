/**
 * Tema G360 — paleta esmeralda, fuente Inter, fondo oscuro/claro.
 * Usa los colores definidos en skill.json del proyecto (fallback a valores G360).
 */
import PptxGenJS from 'pptxgenjs';

export function createG360Theme() {
  const colors = {
    accent: '#10B981',
    accentDark: '#047857',
    success: '#34D399',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#0F172A',
    textLight: '#64748B',
    bg: '#FFFFFF',
    surface: '#F3F5F9',
    border: '#E3E8F0',
    darkBg: '#0A0F1E',
    darkText: '#F1F5FB',
    darkSurface: '#141D33',
  };

  // Definir layout A4 vertical para manual (portrait)
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'A4', width: 10, height: 14.28 }); // A4 portrait en pulgadas
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.defineLayout({ name: 'LAYOUT_4x3', width: 10, height: 7.5 });

  // Usar A4 como default (manual mode)
  pptx.layout = 'A4';

  // Theme global
  pptx.author = 'g360-cli';
  pptx.title = '';
  pptx.subject = 'Documentacion generada por g360-cli';

  return {
    pptx,
    colors,
    layout: 'A4',
    fonts: ['Inter', 'Arial'],
    /**
     * Agregar logo de marca a la presentacion
     */
    setLogo(pptxObj, brand, width = 1.2, height = 0.6) {
      const logoPath = brand === 'cipsa'
        ? path.join(__dirname, '..', 'brand', 'cipsa', 'logotypes', 'Logo_cipsa_solid.svg')
        : path.join(__dirname, '..', 'brand', 'g360', 'logotypes', 'logo-g360-light.svg');
      // Nota: SVG no soportado nativamente por PptxGenJS; fallback a PNG
      const pngPath = brand === 'cipsa'
        ? path.join(__dirname, '..', 'brand', 'cipsa', 'logotypes', 'Logo_cipsa_solid.png')
        : path.join(__dirname, '..', 'brand', 'g360', 'logotypes', 'logo-g360-dark.png');
      if (require('fs').existsSync(pngPath)) {
        return { path: pngPath, width, height };
      }
      return null;
    },
  };
}

import path from 'path';
import fs from 'fs';
