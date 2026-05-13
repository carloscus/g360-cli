import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { logger } from './logger.js';

/**
 * @typedef {Object} GlobalConfig
 * @property {string} defaultSkill - Skill por defecto
 * @property {string} defaultTemplate - Plantilla por defecto
 * @property {Object} preferences - Preferencias del usuario
 * @property {string[]} recentProjects - Proyectos recientes
 * @property {Object} cache - Configuración de caché
 */

/**
 * Ruta del directorio de configuración global
 * @type {string}
 */
const G360_CONFIG_DIR = path.join(os.homedir(), '.g360');

/**
 * Ruta del archivo de configuración global
 * @type {string}
 */
const G360_CONFIG_FILE = path.join(G360_CONFIG_DIR, 'config.json');

/**
 * Configuración por defecto
 * @type {GlobalConfig}
 */
const DEFAULT_CONFIG = {
  defaultSkill: 'corporativo-movil',
  defaultTemplate: 'web-pwa',
  preferences: {
    language: 'es',
    theme: 'dark',
    verbose: false
  },
  recentProjects: [],
  cache: {
    enabled: true,
    maxSize: 100
  }
};

/**
 * Módulo de configuración global para G360-CLI
 * @namespace globalConfig
 */
export const globalConfig = {
  /**
   * Obtiene la ruta del directorio de configuración
   * @returns {string} Ruta del directorio de configuración
   * @example
   * const configDir = globalConfig.getConfigDir();
   * console.log('Config dir:', configDir);
   */
  getConfigDir() {
    return G360_CONFIG_DIR;
  },

  /**
   * Obtiene la ruta del archivo de configuración
   * @returns {string} Ruta del archivo de configuración
   * @example
   * const configFile = globalConfig.getConfigFile();
   * console.log('Config file:', configFile);
   */
  getConfigFile() {
    return G360_CONFIG_FILE;
  },

  /**
   * Inicializa el directorio de configuración global
   * @returns {Promise<void>}
   * @example
   * await globalConfig.init();
   */
  async init() {
    try {
      await fs.ensureDir(G360_CONFIG_DIR);
      
      if (!fs.existsSync(G360_CONFIG_FILE)) {
        await this.save(DEFAULT_CONFIG);
        logger.info('Global config initialized', { path: G360_CONFIG_FILE });
      }
    } catch (error) {
      logger.error('Failed to initialize global config', { error: error.message });
      throw error;
    }
  },

  /**
   * Carga la configuración global
   * @returns {Promise<GlobalConfig>} Configuración global cargada
   * @example
   * const config = await globalConfig.load();
   * console.log('Default skill:', config.defaultSkill);
   */
  async load() {
    try {
      if (!fs.existsSync(G360_CONFIG_FILE)) {
        await this.init();
        return { ...DEFAULT_CONFIG };
      }

      const config = await fs.readJson(G360_CONFIG_FILE);
      return { ...DEFAULT_CONFIG, ...config };
    } catch (error) {
      logger.error('Failed to load global config', { error: error.message });
      return { ...DEFAULT_CONFIG };
    }
  },

  /**
   * Guarda la configuración global
   * @param {GlobalConfig} config - Configuración a guardar
   * @returns {Promise<void>}
   * @example
   * await globalConfig.save({ defaultSkill: 'moderno' });
   */
  async save(config) {
    try {
      await fs.ensureDir(G360_CONFIG_DIR);
      await fs.writeJson(G360_CONFIG_FILE, config, { spaces: 2 });
      logger.debug('Global config saved');
    } catch (error) {
      logger.error('Failed to save global config', { error: error.message });
      throw error;
    }
  },

  /**
   * Obtiene un valor de configuración específico
   * @param {string} key - Clave de configuración (notación de puntos)
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {Promise<*>} Valor de configuración
   * @example
   * const skill = await globalConfig.get('defaultSkill');
   * const theme = await globalConfig.get('preferences.theme', 'dark');
   */
  async get(key, defaultValue = undefined) {
    const config = await this.load();
    
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  },

  /**
   * Establece un valor de configuración específico
   * @param {string} key - Clave de configuración (notación de puntos)
   * @param {*} value - Valor a establecer
   * @returns {Promise<void>}
   * @example
   * await globalConfig.set('defaultSkill', 'moderno');
   * await globalConfig.set('preferences.theme', 'light');
   */
  async set(key, value) {
    const config = await this.load();
    
    const keys = key.split('.');
    let current = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
    await this.save(config);
  },

  /**
   * Agrega un proyecto a la lista de proyectos recientes
   * @param {string} projectPath - Ruta del proyecto
   * @param {Object} metadata - Metadatos del proyecto
   * @returns {Promise<void>}
   * @example
   * await globalConfig.addRecentProject('/my/project', {
   *   template: 'web-pwa',
   *   skill: 'corporativo-movil'
   * });
   */
  async addRecentProject(projectPath, metadata = {}) {
    const config = await this.load();
    
    // Eliminar el proyecto si ya existe
    config.recentProjects = config.recentProjects.filter(
      p => p.path !== projectPath
    );
    
    // Agregar al inicio
    config.recentProjects.unshift({
      path: projectPath,
      lastAccessed: new Date().toISOString(),
      ...metadata
    });
    
    // Mantener solo los últimos 10 proyectos
    config.recentProjects = config.recentProjects.slice(0, 10);
    
    await this.save(config);
    logger.debug('Project added to recent projects', { path: projectPath });
  },

  /**
   * Obtiene la lista de proyectos recientes
   * @returns {Promise<Array>} Lista de proyectos recientes
   * @example
   * const recent = await globalConfig.getRecentProjects();
   * recent.forEach(project => console.log(project.path));
   */
  async getRecentProjects() {
    const config = await this.load();
    return config.recentProjects || [];
  },

  /**
   * Limpia la configuración global
   * @returns {Promise<void>}
   * @example
   * await globalConfig.clear();
   */
  async clear() {
    try {
      if (fs.existsSync(G360_CONFIG_FILE)) {
        await fs.remove(G360_CONFIG_FILE);
        logger.info('Global config cleared');
      }
    } catch (error) {
      logger.error('Failed to clear global config', { error: error.message });
      throw error;
    }
  },

  /**
   * Verifica si la configuración global existe
   * @returns {boolean} true si existe, false en caso contrario
   * @example
   * if (await globalConfig.exists()) {
   *   console.log('Config exists');
   * }
   */
  async exists() {
    return fs.existsSync(G360_CONFIG_FILE);
  }
};