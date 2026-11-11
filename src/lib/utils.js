/**
 * Utilidades de fechas
 */

/**
 * Calcula la diferencia en días entre dos fechas (YYYY-MM-DD).
 * Retorna 0 si fechaFin < fechaInicio o si alguna fecha es inválida.
 * @param {string} start - Fecha inicio (YYYY-MM-DD)
 * @param {string} end - Fecha fin (YYYY-MM-DD)
 * @returns {number} Diferencia en días (si end >= start), sino 0
 */
export function diffDays(start, end) {
  const startDate = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  if (endDate < startDate) return 0;

  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
