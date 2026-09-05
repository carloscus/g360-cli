/**
 * Tema G360 — paleta esmeralda, fuente Inter.
 */
import PptxGenJS from 'pptxgenjs';

const colors = {
  accent: '#10B981',
  accentDark: '#047857',
  success: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  violet: '#8B5CF6',
  text: '#0F172A',
  textLight: '#64748B',
  bg: '#FFFFFF',
  surface: '#F3F5F9',
  border: '#E3E8F0',
};

export function createG360Theme() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'A4', width: 10, height: 14.28 });
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.layout = 'A4';
  pptx.author = 'g360-cli';
  pptx.subject = 'Documentacion generada por g360-cli';

  return { pptx, colors, layout: 'A4' };
}

export { colors };
