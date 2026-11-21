/**
 * @file file-cache.js
 * @description Caché en memoria para lecturas de archivos por proceso.
 *
 * Evita I/O redundante cuando el mismo archivo se lee varias veces dentro de
 * un mismo comando (por ejemplo, auditor lee stacks.json y package.json en
 * múltiples checks). El caché es por proceso: no persiste entre ejecuciones,
 * por lo que no hay riesgo de datos obsoletos entre runs.
 *
 * Se limpia al inicio de cada `audit()` para evitar contaminación entre
 * comandos que operen sobre directorios distintos.
 */

import fs from 'fs-extra';

const cache = new Map();

/**
 * Lee un archivo usando caché. La primera invocation ejecuta `fn(filepath)`
 * y guarda el resultado; las siguientes devuelven el valor en caché.
 * @param {string} filepath - Ruta al archivo
 * @param {(filepath: string) => any} fn - Función de lectura (solo se ejecuta si no hay caché)
 * @returns {any} Valor cacheado o recién leído
 */
export function readFileCached(filepath, fn) {
  if (!cache.has(filepath)) {
    cache.set(filepath, fn(filepath));
  }
  return cache.get(filepath);
}

/**
 * Limpia toda la caché. Útil al inicio de cada run/comando para evitar
 * contaminación entre directorios o entre tests.
 */
export function clearCache() {
  cache.clear();
}

/**
 * Helper para leer JSON con caché. Usa readJsonSafe (maneja BOM) y retorna
 * `null` si el archivo no existe o no se puede parsear, para que los
 * llamantes no tengan que envolver en try/catch.
 * @param {string} filepath - Ruta al archivo JSON
 * @returns {any|null} Objeto parsed o null si no existe / inválido
 */
export function readJsonCached(filepath) {
  return readFileCached(filepath, (path) => {
    try {
      return fs.readJsonSync(path, { throws: false });
    } catch {
      return null;
    }
  });
}
