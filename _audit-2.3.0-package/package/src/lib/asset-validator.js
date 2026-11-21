import Ajv from 'ajv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Indica si la validación fue exitosa
 * @property {string[]} errors - Lista de errores encontrados
 */

/**
 * Módulo de validación de assets con JSON Schema
 * @namespace assetValidator
 */
export const assetValidator = {
  /**
   * Instancia de AJV para validación de schemas
   * @type {Ajv}
   */
  ajv: new Ajv({ allErrors: true }),

  /**
   * Cache de schemas compilados
   * @type {Map<string, any>}
   */
  schemaCache: new Map(),

  /**
   * Carga y compila un schema JSON
   * @param {string} schemaName - Nombre del schema a cargar
   * @returns {Promise<any>} Schema compilado
   * @private
   */
  async loadSchema(schemaName) {
    if (this.schemaCache.has(schemaName)) {
      return this.schemaCache.get(schemaName);
    }

    const schemaPath = path.join(__dirname, '../schemas', `${schemaName}.json`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema not found: ${schemaName}`);
    }

    const schema = await fs.readJson(schemaPath);
    const compiled = this.ajv.compile(schema);
    
    this.schemaCache.set(schemaName, compiled);
    return compiled;
  },

  /**
   * Valida un objeto contra un schema específico
   * @param {string} schemaName - Nombre del schema a usar
   * @param {Object} data - Datos a validar
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * @example
   * const result = await assetValidator.validate('skills-schema', skillsData);
   * if (result.valid) {
   *   console.log('Skills válidos');
   * } else {
   *   console.error('Errores:', result.errors);
   * }
   */
  async validate(schemaName, data) {
    try {
      const validate = await this.loadSchema(schemaName);
      const valid = validate(data);

      if (valid) {
        logger.debug(`Validation passed for schema: ${schemaName}`);
        return { valid: true, errors: [] };
      }

      const errors = validate.errors.map(err => 
        `${err.instancePath} ${err.message}`
      );

      logger.warn(`Validation failed for schema: ${schemaName}`, { errors });
      return { valid: false, errors };
    } catch (error) {
      logger.error(`Error validating against schema: ${schemaName}`, { error: error.message });
      return { 
        valid: false, 
        errors: [`Validation error: ${error.message}`] 
      };
    }
  },

  /**
   * Valida la configuración de skills
   * @param {Object} skillsData - Datos de skills a validar
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * @example
   * const result = await assetValidator.validateSkills(skillsConfig);
   */
  async validateSkills(skillsData) {
    return this.validate('skills-schema', skillsData);
  },

  /**
   * Valida la configuración de snippets
   * @param {Object} snippetsData - Datos de snippets a validar
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * @example
   * const result = await assetValidator.validateSnippets(snippetsConfig);
   */
  async validateSnippets(snippetsData) {
    return this.validate('snippets-schema', snippetsData);
  },

  /**
   * Valida un asset individual
   * @param {string} assetType - Tipo de asset ('skill' | 'snippet')
   * @param {Object} assetData - Datos del asset a validar
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * @example
   * const result = await assetValidator.validateAsset('skill', skillData);
   */
  async validateAsset(assetType, assetData) {
    const schemaName = assetType === 'skill' ? 'skills-schema' : 'snippets-schema';
    
    // Para validación individual, envolvemos el asset en la estructura esperada
    const wrapper = assetType === 'skill' 
      ? { skills: [assetData] }
      : { snippets: [assetData] };

    const result = await this.validate(schemaName, wrapper);
    
    return result;
  },

  /**
   * Limpia el cache de schemas
   * @returns {void}
   */
  clearCache() {
    this.schemaCache.clear();
    logger.debug('Schema cache cleared');
  }
};