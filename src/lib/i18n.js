/**
 * @file i18n.js
 * @description Sistema de internacionalización para G360-CLI
 */

/**
 * Traducciones disponibles
 * @type {Object.<string, Object.<string, string>>}
 */
const translations = {
  es: {
    // Comandos
    'command.init.title': '🚀 Inicialización de Proyecto G360',
    'command.init.project': 'Proyecto',
    'command.init.template': 'Plantilla',
    'command.init.skill': 'Skill',
    'command.init.target': 'Destino',
    'command.init.success': '✅ Proyecto creado exitosamente',
    'command.init.portable': '📦 Versión portable habilitada',
    'command.init.next_steps': 'Próximos pasos',
    
    'command.list.title': '📋 Assets G360',
    'command.list.templates': '📁 Plantillas',
    'command.list.components': '🧩 Componentes',
    'command.list.skills': '⚡ Skills',
    'command.list.snippets': '📝 Snippets',
    'command.list.no_templates': 'No se encontraron plantillas',
    'command.list.no_components': 'No se encontraron componentes',
    'command.list.no_skills': 'No se encontraron skills',
    'command.list.no_snippets': 'No se encontraron snippets',
    
    'command.set-skill.title': '🎨 Selector de Skill G360',
    'command.set-skill.success': '✅ Skill configurado correctamente',
    'command.set-skill.not_found': '❌ Skill no encontrado',
    'command.set-skill.already_exists': '⚠️ El proyecto ya tiene un skill configurado',
    'command.set-skill.use_force': 'Usa --force para sobrescribir',
    
    'command.audit.title': '🔍 Auditoría de Proyecto G360',
    'command.audit.results': '📊 Resultados de Auditoría',
    'command.audit.passed': 'Pasaron',
    'command.audit.failed': 'Fallaron',
    'command.audit.warnings': 'Advertencias',
    'command.audit.issues': 'Issues Encontrados',
    'command.audit.compliant': '✅ El proyecto es compliant con G360',
    'command.audit.issues_found': '⚠️ Algunos issues necesitan atención',
    
    'command.health.title': '🏥 Verificación de Salud G360',
    'command.health.status': 'Estado del Sistema',
    'command.health.healthy': '✅ El sistema está saludable',
    'command.health.failed': '❌ Algunos checks fallaron',
    
    'command.clean.title': '🧹 Limpieza de Proyecto G360',
    'command.clean.preview': '📋 DRY RUN - No se eliminarán archivos',
    'command.clean.success': '✅ Limpieza completada',
    
    // Errores
    'error.templates_not_found': '❌ Plantillas no encontradas. Ejecuta: g360 update',
    'error.template_not_found': '❌ Plantilla no encontrada',
    'error.directory_exists': '❌ El directorio ya existe. Usa --force para sobrescribir',
    'error.path_not_found': '❌ Ruta no encontrada',
    'error.config_not_found': '❌ No se pudo cargar la configuración de skills',
    
    // General
    'general.available': 'Disponibles',
    'general.device': 'Dispositivo',
    'general.description': 'Descripción',
    'general.language': 'Lenguaje',
    'general.loading': 'Cargando...',
    'general.done': 'Completado',
    'general.cancelled': 'Cancelado',
    'general.error': 'Error',
    'general.warning': 'Advertencia',
    'general.info': 'Información',
    'general.success': 'Éxito'
  },
  
  en: {
    // Commands
    'command.init.title': '🚀 G360 Project Initialization',
    'command.init.project': 'Project',
    'command.init.template': 'Template',
    'command.init.skill': 'Skill',
    'command.init.target': 'Target',
    'command.init.success': '✅ Project created successfully',
    'command.init.portable': '📦 Portable version enabled',
    'command.init.next_steps': 'Next steps',
    
    'command.list.title': '📋 G360 Assets',
    'command.list.templates': '📁 Templates',
    'command.list.components': '🧩 Components',
    'command.list.skills': '⚡ Skills',
    'command.list.snippets': '📝 Snippets',
    'command.list.no_templates': 'No templates found',
    'command.list.no_components': 'No components found',
    'command.list.no_skills': 'No skills found',
    'command.list.no_snippets': 'No snippets found',
    
    'command.set-skill.title': '🎨 G360 Skill Selector',
    'command.set-skill.success': '✅ Skill configured successfully',
    'command.set-skill.not_found': '❌ Skill not found',
    'command.set-skill.already_exists': '⚠️ Project already has a skill configured',
    'command.set-skill.use_force': 'Use --force to overwrite',
    
    'command.audit.title': '🔍 G360 Project Audit',
    'command.audit.results': '📊 Audit Results',
    'command.audit.passed': 'Passed',
    'command.audit.failed': 'Failed',
    'command.audit.warnings': 'Warnings',
    'command.audit.issues': 'Issues Found',
    'command.audit.compliant': '✅ Project is G360 compliant',
    'command.audit.issues_found': '⚠️ Some issues need attention',
    
    'command.health.title': '🏥 G360 Health Check',
    'command.health.status': 'System Status',
    'command.health.healthy': '✅ System is healthy',
    'command.health.failed': '❌ Some checks failed',
    
    'command.clean.title': '🧹 G360 Project Clean',
    'command.clean.preview': '📋 DRY RUN - No files will be removed',
    'command.clean.success': '✅ Cleanup completed',
    
    // Errors
    'error.templates_not_found': '❌ Templates not found. Run: g360 update',
    'error.template_not_found': '❌ Template not found',
    'error.directory_exists': '❌ Directory already exists. Use --force to overwrite',
    'error.path_not_found': '❌ Path not found',
    'error.config_not_found': '❌ Could not load skills configuration',
    
    // General
    'general.available': 'Available',
    'general.device': 'Device',
    'general.description': 'Description',
    'general.language': 'Language',
    'general.loading': 'Loading...',
    'general.done': 'Done',
    'general.cancelled': 'Cancelled',
    'general.error': 'Error',
    'general.warning': 'Warning',
    'general.info': 'Info',
    'general.success': 'Success'
  }
};

/**
 * Idioma actual
 * @type {string}
 */
let currentLanguage = 'es';

/**
 * Módulo de internacionalización para G360-CLI
 * @namespace i18n
 */
export const i18n = {
  /**
   * Establece el idioma actual
   * @param {string} language - Código de idioma ('es' | 'en')
   * @returns {void}
   * @example
   * i18n.setLanguage('en');
   */
  setLanguage(language) {
    if (translations[language]) {
      currentLanguage = language;
    } else {
      console.warn(`Language '${language}' not supported, using 'es'`);
    }
  },

  /**
   * Obtiene el idioma actual
   * @returns {string} Código de idioma actual
   * @example
   * const lang = i18n.getLanguage();
   */
  getLanguage() {
    return currentLanguage;
  },

  /**
   * Traduce una clave de texto
   * @param {string} key - Clave de traducción
   * @param {Object} [params] - Parámetros para interpolación
   * @returns {string} Texto traducido
   * @example
   * const text = i18n.t('command.init.success');
   * const text = i18n.t('command.init.project', { name: 'my-project' });
   */
  t(key, params = {}) {
    const lang = translations[currentLanguage] || translations.es;
    let text = lang[key] || translations.es[key] || key;
    
    // Interpolación de parámetros
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  },

  /**
   * Verifica si una clave de traducción existe
   * @param {string} key - Clave de traducción
   * @returns {boolean} true si existe, false en caso contrario
   * @example
   * if (i18n.has('command.init.success')) {
   *   console.log(i18n.t('command.init.success'));
   * }
   */
  has(key) {
    const lang = translations[currentLanguage] || translations.es;
    return key in lang;
  },

  /**
   * Obtiene todos los idiomas disponibles
   * @returns {string[]} Lista de códigos de idioma
   * @example
   * const languages = i18n.getAvailableLanguages();
   * console.log('Available languages:', languages);
   */
  getAvailableLanguages() {
    return Object.keys(translations);
  },

  /**
   * Obtiene las traducciones para un idioma específico
   * @param {string} language - Código de idioma
   * @returns {Object|null} Objeto de traducciones o null si no existe
   * @example
   * const esTranslations = i18n.getTranslations('es');
   */
  getTranslations(language) {
    return translations[language] || null;
  }
};

export default i18n;