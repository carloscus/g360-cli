/**
 * @file json-io.js
 * @description Helpers seguros para lectura/escritura de JSON que eliminan BOM
 * (Byte Order Mark) antes de parsear. Evita crashes como el reportado en
 * https://github.com/carloscus/g360-cli/issues donde un JSON con BOM
 * causaba JSON.parse("﻿{") → SyntaxError.
 *
 * El BOM suele ser escrito por herramientas de Windows (PowerShell 5,
 * some editors). Esta capa lo strippea automáticamente; si quieres
 * prevenir que se escriba, usa .editorconfig con charset = utf-8.
 */

import fs from 'fs-extra';
import path from 'path';

const BOM = '\uFEFF';

/**
 * Lee un archivo JSON y retorna el objeto parsed.
 * Elimina BOM si existe al inicio del archivo.
 */
export function readJsonSafe(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(new RegExp(`^${BOM}`), '');
  return JSON.parse(raw);
}

/**
 * Escribe un objeto como JSON formateado en filePath.
 * Usa UTF-8 sin BOM explícitamente.
 */
export function writeJsonSafe(filePath, data, options = {}) {
  const content = JSON.stringify(data, null, options.spaces ?? 2) + '\n';
  // WriteAllText con UTF8 encoding false = sin BOM
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
}

/**
 * Verifica si un archivo tiene BOM al inicio.
 */
export function hasBom(filePath) {
  const bytes = fs.readFileSync(filePath, 'utf8').charCodeAt(0);
  return bytes === 0xFEFF;
}

/**
 * Strippea BOM de un string si existe.
 */
export function stripBom(str) {
  return str.replace(new RegExp(`^${BOM}`), '');
}
