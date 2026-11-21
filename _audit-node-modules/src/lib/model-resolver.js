/**
 * @file model-resolver.js
 * @description Resuelve el modelo candidato para un rol dado siguiendo una
 * cadena de fallback priorizada definida en model-fallbacks.json.
 *
 * Por ahora retorna el primer modelo de la lista (simulado). En futuro se
 * verificará quota / disponibilidad / estado del proveedor antes de devolver.
 *
 * Expone:
 *   resolveModel(role)  -> string | null
 *   getAllFallbacks()   -> object con todos los roles y sus listas
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ruta al archivo de fallbacks de modelos. Resuelta en tiempo de ejecución
 * para que funcione tanto en dev como en instalación global (pkg).
 */
const FALLBACKS_PATH = path.resolve(
  __dirname,
  '..',
  'assets',
  'config',
  'model-fallbacks.json'
);

/**
 * Carga la cadena de fallbacks desde el JSON. Si el archivo no existe
 * (backward compat), retorna un objeto vacío.
 * @returns {Record<string, string[]>}
 */
function loadFallbacks() {
  try {
    return fs.readJsonSync(FALLBACKS_PATH);
  } catch {
    // Archivo ausente: sin fallbacks definidos. El llamador decide el default.
    return {};
  }
}

/**
 * Dado un rol, retorna el primer modelo de su lista de fallback.
 * @param {string} role - Rol del agente (architect, reviewer, etc.)
 * @returns {string|null} El primer modelo candidato o null si no hay lista.
 */
export function resolveModel(role) {
  const fallbacks = loadFallbacks();
  const models = fallbacks[role];
  if (!Array.isArray(models) || models.length === 0) return null;
  return models[0];
}

/**
 * Retorna todas las cadenas de fallback cargadas.
 * @returns {Record<string, string[]>}
 */
export function getAllFallbacks() {
  return loadFallbacks();
}
