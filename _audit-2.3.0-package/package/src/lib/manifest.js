import fs from 'fs-extra';
import path from 'path';

/**
 * @typedef {Object} ProjectManifest
 * @property {string} name - Nombre del proyecto
 * @property {string} template - Plantilla utilizada
 * @property {string} version - Versión del proyecto
 * @property {string} createdAt - Fecha de creación en formato ISO
 * @property {Asset[]} assets - Lista de assets del proyecto
 */

/**
 * @typedef {Object} Asset
 * @property {string} name - Nombre del asset
 * @property {string} type - Tipo del asset
 * @property {string} addedAt - Fecha de adición en formato ISO
 */

/**
 * Módulo para gestión de manifiestos de proyectos G360
 * @namespace manifest
 */
export const manifest = {
  /**
   * Inicializa un nuevo manifiesto de proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @param {Object} data - Datos del proyecto
   * @param {string} data.name - Nombre del proyecto
   * @param {string} data.template - Plantilla utilizada
   * @param {string} data.version - Versión del proyecto
   * @returns {Promise<ProjectManifest>} Manifiesto creado
   * @example
   * const manifest = await manifest.init('/my/project', {
   *   name: 'my-project',
   *   template: 'web-pwa',
   *   version: '1.0.0'
   * });
   */
  async init(projectDir, data) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    const manifest = {
      name: data.name,
      template: data.template,
      version: data.version,
      createdAt: new Date().toISOString(),
      assets: []
    };
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    return manifest;
  },

  /**
   * Carga el manifiesto de un proyecto existente
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Promise<ProjectManifest|null>} Manifiesto del proyecto o null si no existe
   * @example
   * const manifest = await manifest.load('/my/project');
   * if (manifest) {
   *   console.log('Proyecto:', manifest.name);
   * }
   */
  async load(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        return await fs.readJson(manifestPath);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  /**
   * Agrega un asset al manifiesto del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @param {Object} asset - Asset a agregar
   * @param {string} asset.name - Nombre del asset
   * @param {string} asset.type - Tipo del asset
   * @returns {Promise<void>}
   * @example
   * await manifest.addAsset('/my/project', {
   *   name: 'components',
   *   type: 'directory'
   * });
   */
  async addAsset(projectDir, asset) {
    const data = await this.load(projectDir);
    if (data) {
      data.assets.push({
        ...asset,
        addedAt: new Date().toISOString()
      });
      await fs.writeJson(path.join(projectDir, 'g360-manifest.json'), data, { spaces: 2 });
    }
  },

  /**
   * Elimina el manifiesto del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Promise<void>}
   * @example
   * await manifest.remove('/my/project');
   */
  async remove(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      await fs.remove(manifestPath);
    }
  }
};
