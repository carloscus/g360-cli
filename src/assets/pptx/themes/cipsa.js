/**
 * Tema CIPSA — verde corporativo con logo CIPSA.
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

export function createCipsaTheme() {
  const colors = {
    accent: '#00d084',
    accentDark: '#00796B',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#0F172A',
    textLight: '#64748B',
    bg: '#FFFFFF',
    surface: '#F0F9F4',
    border: '#CCF0E0',
    darkBg: '#0d1117',
    darkText: '#f0f6fc',
    darkSurface: '#161b22',
  };

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'A4', width: 10, height: 14.28 });
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.layout = 'A4';

  pptx.author = 'g360-cli';
  pptx.title = '';
  pptx.subject = 'Documentacion CIPSA generada por g360-cli';

  const cipsaLogo = path.join(process.cwd(), 'assets', 'images', 'Logo_cipsa_solid.png');
  const fallbackLogo = fs.existsSync(cipsaLogo)
    ? cipsaLogo
    : path.join(__dirname, '..', '..', 'brand', 'cipsa', 'logotypes', 'Logo_cipsa_solid.png');

  return {
    pptx,
    colors,
    layout: 'A4',
    fonts: ['Inter', 'Arial'],
    logo: fs.existsSync(fallbackLogo) ? { path: fallbackLogo, width: 1.5, height: 0.5 } : null,
  };
}
