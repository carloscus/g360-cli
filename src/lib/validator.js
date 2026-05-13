import fs from 'fs-extra';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Indica si la validación fue exitosa
 * @property {string[]} errors - Lista de errores encontrados
 * @property {string[]} warnings - Lista de advertencias encontradas
 */

/**
 * Módulo de validación para proyectos G360
 * @namespace validator
 */
export const validator = {
  /**
   * Valida si un nombre de proyecto es válido
   * @param {string} name - Nombre del proyecto a validar
   * @returns {boolean} true si el nombre es válido, false en caso contrario
   * @example
   * validator.isValidProjectName('my-project') // true
   * validator.isValidProjectName('My-Project') // false
   */
  isValidProjectName(name) {
    return /^[a-z0-9][a-z0-9-]*$/.test(name);
  },

  /**
   * Valida si una ruta existe en el sistema de archivos
   * @param {string} path - Ruta a validar
   * @returns {boolean} true si la ruta existe, false en caso contrario
   * @example
   * validator.isValidPath('/existing/path') // true
   * validator.isValidPath('/non/existing') // false
   */
  isValidPath(path) {
    try {
      return fs.existsSync(path);
    } catch {
      return false;
    }
  },

  /**
   * Valida si un directorio es un proyecto G360 válido
   * @param {string} projectDir - Ruta del directorio del proyecto
   * @returns {ValidationResult} Objeto con resultado de la validación
   * @example
   * const result = validator.validateProject('/my/project');
   * if (result.valid) {
   *   console.log('Proyecto válido');
   * } else {
   *   console.error('Errores:', result.errors);
   * }
   */
  validateProject(projectDir) {
    const errors = [];
    const warnings = [];

    if (!fs.existsSync(projectDir)) {
      errors.push('Project directory does not exist');
      return { valid: false, errors, warnings };
    }

    const manifestPath = `${projectDir}/g360-manifest.json`;
    if (!fs.existsSync(manifestPath)) {
      warnings.push('No g360-manifest.json found');
    }

    const g360Dir = `${projectDir}/g360`;
    if (!fs.existsSync(g360Dir)) {
      warnings.push('No g360 directory found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};
