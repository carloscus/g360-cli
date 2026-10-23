import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { autonomyAuditor } from './autonomy-auditor.js';

/**
 * @typedef {Object} AuditIssue
 * @property {string} file - Archivo donde se encontró el issue
 * @property {string} message - Mensaje descriptivo del issue
 * @property {string} severity - Severidad del issue ('error' | 'warning')
 */

/**
 * @typedef {Object} AuditResult
 * @property {number} passed - Cantidad de checks que pasaron
 * @property {number} failed - Cantidad de checks que fallaron
 * @property {number} warnings - Cantidad de advertencias
 * @property {number} total - Cantidad total de checks
 * @property {AuditIssue[]} issues - Lista de issues encontrados
 */

/**
 * Módulo de auditoría para proyectos G360
 * @namespace auditor
 */
export const auditor = {
  /**
   * Ejecuta auditoría completa del proyecto
   * @param {string} projectDir - Directorio del proyecto a auditar
   * @param {Object} options - Opciones de auditoría
   * @param {boolean} [options.verbose=false] - Mostrar información detallada
   * @returns {Promise<AuditResult>} Resultado de la auditoría
   * @example
   * const result = await auditor.audit('/my/project', { verbose: true });
   * console.log(`Passed: ${result.passed}, Failed: ${result.failed}`);
   */
  async audit(projectDir, options = {}) {
    const { verbose = false, autonomy = true } = options;
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
      issues: []
    };

    const checks = [
      { name: 'manifest', check: () => this.checkManifest(projectDir) },
      { name: 'structure', check: () => this.checkStructure(projectDir) },
      { name: 'config', check: () => this.checkConfig(projectDir) }
    ];

    if (autonomy) {
      checks.push({ name: 'autonomy', check: () => this.checkAutonomy(projectDir) });
    }

    for (const { name, check } of checks) {
      const result = await check();
      const findings = Array.isArray(result.findings) ? result.findings : [result];

      for (const finding of findings) {
        const file = finding.file ?? finding.issue?.file ?? 'proyecto';
        const message = finding.message ?? finding.issue?.message ?? '';

        results.total++;

        if (finding.status === 'pass') {
          results.passed++;
        } else if (finding.status === 'n/a') {
          results.passed++;
        } else if (finding.status === 'fail') {
          results.failed++;
          results.issues.push({ file, message, severity: 'error' });
        } else if (finding.status === 'warn') {
          results.warnings++;
          results.issues.push({ file, message, severity: 'warning' });
        }

        if (verbose) {
          const detail = finding.details ?? finding.message;
          if (detail) {
            console.log(chalk.gray(`  ${name}: ${detail}`));
          }
        }
      }
    }

    return results;
  },

  /**
   * Verifica si existe el manifiesto del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Object} Resultado del check
   * @private
   */
  checkManifest(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      return { status: 'pass', details: 'Manifest found' };
    }
    
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const isG360Tool = 
          pkg.name?.startsWith('g360-') || 
          (pkg.keywords && pkg.keywords.some(k => k.includes('g360'))) ||
          pkg.name === 'g360-cli';
        
        if (isG360Tool) {
          return { status: 'pass', details: 'G360 tool/package - manifest optional' };
        }
      } catch (e) {
        // Continue to warning
      }
    }
    
    return { status: 'warn', issue: { file: 'g360-manifest.json', message: 'No manifest found - run "g360 bring" to initialize' } };
  },

  /**
   * Verifica la estructura del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Object} Resultado del check
   * @private
   */
  checkStructure(projectDir) {
    const g360Dir = path.join(projectDir, 'g360');
    if (fs.existsSync(g360Dir)) {
      return { status: 'pass', details: 'G360 assets directory found' };
    }
    
    // Check if this is a G360 tool/package - structure optional
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const isG360Tool = 
          pkg.name?.startsWith('g360-') || 
          (pkg.keywords && pkg.keywords.some(k => k.includes('g360'))) ||
          pkg.name === 'g360-cli';
        
        if (isG360Tool) {
          return { status: 'pass', details: 'G360 tool/package - G360 structure optional' };
        }
      } catch (e) {
        // If package.json is invalid, continue to warning
      }
    }
    
    return { status: 'warn', issue: { file: 'g360/', message: 'No G360 assets found - run "g360 bring" to initialize assets' } };
  },

  /**
   * Verifica la configuración del proyecto
   * @param {string} projectDir - Directorio del proyecto
   * @returns {Object} Resultado del check
   * @private
   */
  checkConfig(projectDir) {
    const configPath = path.join(projectDir, 'g360', 'config');
    if (fs.existsSync(configPath)) {
      return { status: 'pass', details: 'Config directory found' };
    }
    return { status: 'pass' };
  },

  /**
   * Verifica la autosuficiencia del proyecto: debe poder compilar, ejecutarse
   * y probarse sin el asistente y sin red.
   * @param {string} projectDir - Directorio del proyecto
   * @returns {{status: 'pass'|'warn'|'fail', findings: Object[]}} Resultado del check
   * @private
   */
  checkAutonomy(projectDir) {
    return autonomyAuditor.check(projectDir);
  }
};
