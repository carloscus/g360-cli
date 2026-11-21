import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FALLBACKS_PATH = path.resolve(
  __dirname,
  '..',
  'assets',
  'config',
  'model-fallbacks.json'
);

const modelHistory = new Map();

function loadFallbacks() {
  const raw = fs.readJsonSync(FALLBACKS_PATH);
  return normalizeFallbacks(raw);
}

/**
 * Normaliza la configuración de modelos a formato v1 interno (arreglos bajo nombre de rol).
 * Soporta v1 (arreglos en raíz) y v2 (roles con primary/fallbacks).
 * Lanza error si la estructura es inválida o ambigua.
 */
function normalizeFallbacks(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Estructura de configuración de modelos no reconocida');
  }

  // v2: objeto raíz con version: 2 y propiedad roles
  if (data.version === 2) {
    if (!data.roles || typeof data.roles !== 'object' || Array.isArray(data.roles)) {
      throw new Error('Estructura de configuración de modelos no reconocida');
    }
    return normalizeV2(data.roles);
  }

  // Versión declarada que no es 2
  if (data.version && data.version !== 2) {
    throw new Error(`Versión de configuración no soportada: ${data.version}`);
  }

  // v1: objeto raíz con roles cuyos valores son arreglos
  const entries = Object.entries(data);
  if (entries.length === 0) {
    throw new Error('Estructura de configuración de modelos no reconocida');
  }

  // Validar que todos los valores sean arreglos antes de normalizar
  for (const [role, models] of entries) {
    if (!Array.isArray(models)) {
      throw new Error(`Rol '${role}' debe tener un arreglo de modelos no vacío`);
    }
  }

  return normalizeV1(data);
}

function normalizeV1(data) {
  const result = {};
  for (const [role, models] of Object.entries(data)) {
    if (!Array.isArray(models) || models.length === 0) {
      throw new Error(`Rol '${role}' debe tener un arreglo de modelos no vacío`);
    }
    for (const m of models) {
      if (typeof m !== 'string' || m.trim() === '') {
        throw new Error(`Rol '${role}': modelo inválido '${m}'`);
      }
    }
    result[role] = [...models];
  }
  return result;
}

function normalizeV2(roles) {
  const result = {};
  for (const [role, config] of Object.entries(roles)) {
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      throw new Error(`Rol '${role}' en v2 debe ser un objeto con primary y fallbacks`);
    }

    const { primary, fallbacks } = config;

    if (typeof primary !== 'string' || primary.trim() === '') {
      throw new Error(`Rol '${role}' v2: primary debe ser string no vacío`);
    }

    if (!Array.isArray(fallbacks)) {
      throw new Error(`Rol '${role}' v2: fallbacks debe ser un arreglo`);
    }

    // No duplicar primary dentro de fallbacks
    if (fallbacks.includes(primary)) {
      throw new Error(`Rol '${role}' v2: primary no debe repetirse en fallbacks`);
    }

    for (const fb of fallbacks) {
      if (typeof fb !== 'string' || fb.trim() === '') {
        throw new Error(`Rol '${role}' v2: fallback inválido '${fb}'`);
      }
    }

    result[role] = [primary, ...fallbacks];
  }
  return result;
}

function isModelValid(model, fallbackReason) {
  if (!fallbackReason) return true;

  const reasonLower = fallbackReason.toLowerCase();

  // Clasificación determinista de errores por razón, no por patrón de nombre de modelo
  if (reasonLower.includes('expirado') || reasonLower.includes('credencial')) {
    // Credencial inválida o expirada: excluir modelos sin proveedor disponible
    if (!model.includes('#none')) {
      return false;
    }
  }

  if (reasonLower.includes('quota')) {
    // Cuota agotada: excluir modelos con proveedor no disponible
    if (model.includes('#none')) {
      return false;
    }
  }

  return true;
}

function resolveModel(role, fallbackReason) {
  const fallbacks = loadFallbacks();
  const models = fallbacks[role];

  if (!Array.isArray(models) || models.length === 0) {
    return null;
  }

  let startIndex = 0;

  if (modelHistory.has(role)) {
    const previousModel = modelHistory.get(role);
    const prevIndex = models.indexOf(previousModel);
    if (prevIndex >= 0) {
      startIndex = prevIndex + 1;
    }
  }

  for (let i = startIndex; i < models.length; i++) {
    const model = models[i];
    if (isModelValid(model, fallbackReason)) {
      modelHistory.set(role, model);
      return model;
    }
  }

  modelHistory.set(role, models[models.length - 1]);
  return null;
}

function recordModelFailure(role, reason) {
  if (modelHistory.has(role)) {
    const current = modelHistory.get(role);
    console.log(`📝 Registrado fallo de modelo ${current} para role '${role}': ${reason}`);
  }
  // Mantener el modelo actual en el historial para que resolveModel()
  // pueda avanzar al siguiente modelo en la próxima resolución.
  // No se establece '' porque models.indexOf('') devuelve -1,
  // lo que impediría avanzar en la cadena de fallbacks.
}

function getModelHistory() {
  return new Map(modelHistory);
}

function getAllFallbacks() {
  return loadFallbacks();
}

export { resolveModel, recordModelFailure, getModelHistory, getAllFallbacks, isModelValid, loadFallbacks, normalizeFallbacks };