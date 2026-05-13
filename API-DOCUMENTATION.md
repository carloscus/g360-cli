# G360-CLI API Documentation

## Overview

Esta documentación describe la API interna de G360-CLI para desarrolladores que deseen extender o mantener el proyecto.

## Table of Contents

- [Modules](#modules)
- [Commands](#commands)
- [Libraries](#libraries)
- [Types](#types)
- [Examples](#examples)

---

## Modules

### Commands

Los comandos son el punto de entrada principal de la CLI. Cada comando está en su propio archivo en `src/commands/`.

#### `init(name, options)`

Inicializa un nuevo proyecto G360.

**Parameters:**
- `name` (string): Nombre del proyecto
- `options` (Object): Opciones de inicialización
  - `template` (string): Tipo de plantilla (default: 'web-pwa')
  - `skill` (string): Skill a usar (default: 'corporativo-movil')
  - `dir` (string): Directorio destino (default: '.')
  - `dryRun` (boolean): Previsualizar sin crear (default: false)
  - `force` (boolean): Sobrescribir existente (default: false)
  - `portable` (boolean): Crear versión portable (default: null)

**Returns:** Promise<void>

**Example:**
```javascript
import { init } from './commands/init.js';

await init('my-project', {
  template: 'web-pwa',
  skill: 'corporativo-movil',
  portable: true
});
```

#### `list(type, options)`

Lista assets disponibles.

**Parameters:**
- `type` (string): Tipo de asset ('templates' | 'components' | 'skills' | 'snippets' | 'all')
- `options` (Object): Opciones de listado
  - `json` (boolean): Salida como JSON (default: false)

**Returns:** Promise<void>

**Example:**
```javascript
import { list } from './commands/list.js';

await list('skills', { json: false });
```

#### `setSkill(skillName, options)`

Cambia el skill del proyecto actual.

**Parameters:**
- `skillName` (string): Nombre del skill a establecer
- `options` (Object): Opciones de configuración
  - `verbose` (boolean): Mostrar detalles (default: false)
  - `force` (boolean): Sobrescribir skill existente (default: false)
  - `cwd` (string): Directorio de trabajo (default: process.cwd())

**Returns:** Promise<void>

**Example:**
```javascript
import { setSkill } from './commands/set-skill.js';

await setSkill('corporativo', { 
  verbose: true, 
  force: true,
  cwd: '/my/project'
});
```

#### `audit(projectPath, options)`

Audita el proyecto para compliance G360.

**Parameters:**
- `projectPath` (string): Ruta del proyecto a auditar
- `options` (Object): Opciones de auditoría
  - `fix` (boolean): Auto-corregir problemas (default: false)
  - `verbose` (boolean): Salida detallada (default: false)

**Returns:** Promise<void>

**Example:**
```javascript
import { audit } from './commands/audit.js';

await audit('.', { verbose: true });
```

---

## Libraries

### validator

Módulo de validación para proyectos G360.

#### `isValidProjectName(name)`

Valida si un nombre de proyecto es válido.

**Parameters:**
- `name` (string): Nombre del proyecto a validar

**Returns:** boolean

**Example:**
```javascript
import { validator } from './lib/validator.js';

validator.isValidProjectName('my-project'); // true
validator.isValidProjectName('My-Project'); // false
```

#### `isValidPath(path)`

Valida si una ruta existe en el sistema de archivos.

**Parameters:**
- `path` (string): Ruta a validar

**Returns:** boolean

**Example:**
```javascript
import { validator } from './lib/validator.js';

validator.isValidPath('/existing/path'); // true
validator.isValidPath('/non/existing'); // false
```

#### `validateProject(projectDir)`

Valida si un directorio es un proyecto G360 válido.

**Parameters:**
- `projectDir` (string): Ruta del directorio del proyecto

**Returns:** ValidationResult

**Example:**
```javascript
import { validator } from './lib/validator.js';

const result = validator.validateProject('/my/project');
if (result.valid) {
  console.log('Proyecto válido');
} else {
  console.error('Errores:', result.errors);
}
```

### manifest

Módulo para gestión de manifiestos de proyectos G360.

#### `init(projectDir, data)`

Inicializa un nuevo manifiesto de proyecto.

**Parameters:**
- `projectDir` (string): Directorio del proyecto
- `data` (Object): Datos del proyecto
  - `name` (string): Nombre del proyecto
  - `template` (string): Plantilla utilizada
  - `version` (string): Versión del proyecto

**Returns:** Promise<ProjectManifest>

**Example:**
```javascript
import { manifest } from './lib/manifest.js';

const manifestData = await manifest.init('/my/project', {
  name: 'my-project',
  template: 'web-pwa',
  version: '1.0.0'
});
```

#### `load(projectDir)`

Carga el manifiesto de un proyecto existente.

**Parameters:**
- `projectDir` (string): Directorio del proyecto

**Returns:** Promise<ProjectManifest|null>

**Example:**
```javascript
import { manifest } from './lib/manifest.js';

const manifestData = await manifest.load('/my/project');
if (manifestData) {
  console.log('Proyecto:', manifestData.name);
}
```

#### `addAsset(projectDir, asset)`

Agrega un asset al manifiesto del proyecto.

**Parameters:**
- `projectDir` (string): Directorio del proyecto
- `asset` (Object): Asset a agregar
  - `name` (string): Nombre del asset
  - `type` (string): Tipo del asset

**Returns:** Promise<void>

**Example:**
```javascript
import { manifest } from './lib/manifest.js';

await manifest.addAsset('/my/project', {
  name: 'components',
  type: 'directory'
});
```

### auditor

Módulo de auditoría para proyectos G360.

#### `audit(projectDir, options)`

Ejecuta auditoría completa del proyecto.

**Parameters:**
- `projectDir` (string): Directorio del proyecto a auditar
- `options` (Object): Opciones de auditoría
  - `verbose` (boolean): Mostrar información detallada

**Returns:** Promise<AuditResult>

**Example:**
```javascript
import { auditor } from './lib/auditor.js';

const result = await auditor.audit('/my/project', { verbose: true });
console.log(`Passed: ${result.passed}, Failed: ${result.failed}`);
```

### assetValidator

Módulo de validación de assets con JSON Schema.

#### `validate(schemaName, data)`

Valida un objeto contra un schema específico.

**Parameters:**
- `schemaName` (string): Nombre del schema ('skills-schema' | 'snippets-schema')
- `data` (Object): Datos a validar

**Returns:** Promise<ValidationResult>

**Example:**
```javascript
import { assetValidator } from './lib/asset-validator.js';

const result = await assetValidator.validate('skills-schema', skillsData);
if (result.valid) {
  console.log('Skills válidos');
} else {
  console.error('Errores:', result.errors);
}
```

#### `validateSkills(skillsData)`

Valida la configuración de skills.

**Parameters:**
- `skillsData` (Object): Datos de skills a validar

**Returns:** Promise<ValidationResult>

**Example:**
```javascript
import { assetValidator } from './lib/asset-validator.js';

const result = await assetValidator.validateSkills(skillsConfig);
```

#### `validateSnippets(snippetsData)`

Valida la configuración de snippets.

**Parameters:**
- `snippetsData` (Object): Datos de snippets a validar

**Returns:** Promise<ValidationResult>

**Example:**
```javascript
import { assetValidator } from './lib/asset-validator.js';

const result = await assetValidator.validateSnippets(snippetsConfig);
```

### globalConfig

Módulo de configuración global para G360-CLI.

#### `init()`

Inicializa el directorio de configuración global.

**Returns:** Promise<void>

**Example:**
```javascript
import { globalConfig } from './lib/global-config.js';

await globalConfig.init();
```

#### `load()`

Carga la configuración global.

**Returns:** Promise<GlobalConfig>

**Example:**
```javascript
import { globalConfig } from './lib/global-config.js';

const config = await globalConfig.load();
console.log('Default skill:', config.defaultSkill);
```

#### `save(config)`

Guarda la configuración global.

**Parameters:**
- `config` (GlobalConfig): Configuración a guardar

**Returns:** Promise<void>

**Example:**
```javascript
import { globalConfig } from './lib/global-config.js';

await globalConfig.save({ defaultSkill: 'moderno' });
```

#### `get(key, defaultValue)`

Obtiene un valor de configuración específico.

**Parameters:**
- `key` (string): Clave de configuración (notación de puntos)
- `defaultValue` (*): Valor por defecto si no existe

**Returns:** Promise<*>

**Example:**
```javascript
import { globalConfig } from './lib/global-config.js';

const skill = await globalConfig.get('defaultSkill');
const theme = await globalConfig.get('preferences.theme', 'dark');
```

#### `set(key, value)`

Establece un valor de configuración específico.

**Parameters:**
- `key` (string): Clave de configuración (notación de puntos)
- `value` (*): Valor a establecer

**Returns:** Promise<void>

**Example:**
```javascript
import { globalConfig } from './lib/global-config.js';

await globalConfig.set('defaultSkill', 'moderno');
await globalConfig.set('preferences.theme', 'light');
```

#### `addRecentProject(projectPath, metadata)`

Agrega un proyecto a la lista de proyectos recientes.

**Parameters:**
- `projectPath` (string): Ruta del proyecto
- `metadata` (Object): Metadatos del proyecto

**Returns:** Promise<void>

**Example:**
```javascript
import { globalConfig } from './lib/global-config.js';

await globalConfig.addRecentProject('/my/project', {
  template: 'web-pwa',
  skill: 'corporativo-movil'
});
```

### i18n

Módulo de internacionalización para G360-CLI.

#### `setLanguage(language)`

Establece el idioma actual.

**Parameters:**
- `language` (string): Código de idioma ('es' | 'en')

**Returns:** void

**Example:**
```javascript
import { i18n } from './lib/i18n.js';

i18n.setLanguage('en');
```

#### `t(key, params)`

Traduce una clave de texto.

**Parameters:**
- `key` (string): Clave de traducción
- `params` (Object): Parámetros para interpolación

**Returns:** string

**Example:**
```javascript
import { i18n } from './lib/i18n.js';

const text = i18n.t('command.init.success');
const text = i18n.t('command.init.project', { name: 'my-project' });
```

#### `getLanguage()`

Obtiene el idioma actual.

**Returns:** string

**Example:**
```javascript
import { i18n } from './lib/i18n.js';

const lang = i18n.getLanguage();
```

---

## Types

### ValidationResult

Resultado de validación.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### ProjectManifest

Manifiesto de proyecto G360.

```typescript
interface ProjectManifest {
  name: string;
  template: string;
  version: string;
  createdAt: string;
  assets: Asset[];
}
```

### Asset

Asset de proyecto.

```typescript
interface Asset {
  name: string;
  type: string;
  addedAt: string;
}
```

### AuditResult

Resultado de auditoría.

```typescript
interface AuditResult {
  passed: number;
  failed: number;
  warnings: number;
  total: number;
  issues: AuditIssue[];
}
```

### AuditIssue

Issue encontrado en auditoría.

```typescript
interface AuditIssue {
  file: string;
  message: string;
  severity: 'error' | 'warning';
}
```

### GlobalConfig

Configuración global de G360-CLI.

```typescript
interface GlobalConfig {
  defaultSkill: string;
  defaultTemplate: string;
  preferences: {
    language: string;
    theme: string;
    verbose: boolean;
  };
  recentProjects: RecentProject[];
  cache: {
    enabled: boolean;
    maxSize: number;
  };
}
```

### RecentProject

Proyecto reciente.

```typescript
interface RecentProject {
  path: string;
  lastAccessed: string;
  template?: string;
  skill?: string;
}
```

---

## Examples

### Crear un comando personalizado

```javascript
import chalk from 'chalk';
import { logger } from '../lib/logger.js';
import { i18n } from '../lib/i18n.js';

export async function myCommand(options) {
  logger.info('Starting my command');
  
  console.log(chalk.bold.cyan(i18n.t('command.init.title')));
  
  // Lógica del comando
  
  logger.info('Command completed successfully');
}
```

### Validar datos de entrada

```javascript
import { validator } from '../lib/validator.js';
import { assetValidator } from '../lib/asset-validator.js';

export async function processSkill(skillData) {
  // Validar nombre del proyecto
  if (!validator.isValidProjectName(skillData.name)) {
    throw new Error('Invalid project name');
  }
  
  // Validar estructura del skill
  const result = await assetValidator.validateAsset('skill', skillData);
  if (!result.valid) {
    throw new Error(`Invalid skill: ${result.errors.join(', ')}`);
  }
  
  // Procesar skill
  return skillData;
}
```

### Usar configuración global

```javascript
import { globalConfig } from '../lib/global-config.js';

export async function getDefaultSkill() {
  const skill = await globalConfig.get('defaultSkill', 'corporativo-movil');
  return skill;
}

export async function saveRecentProject(projectPath, metadata) {
  await globalConfig.addRecentProject(projectPath, metadata);
}
```

### Implementar logging estructurado

```javascript
import { logger, commandLogger } from '../lib/logger.js';

export async function myFunction() {
  logger.info('Function started');
  
  try {
    // Lógica de la función
    commandLogger.debug('Processing data', { count: 10 });
    
    logger.info('Function completed successfully');
  } catch (error) {
    logger.error('Function failed', { error: error.message });
    throw error;
  }
}
```

### Usar internacionalización

```javascript
import { i18n } from '../lib/i18n.js';

export function displaySuccess() {
  console.log(i18n.t('command.init.success'));
}

export function displayError(error) {
  console.log(i18n.t('general.error'), error);
}
```

---

## Best Practices

### 1. Siempre usar JSDoc

Documenta todas las funciones públicas con JSDoc:

```javascript
/**
 * Valida si un nombre de proyecto es válido
 * @param {string} name - Nombre del proyecto a validar
 * @returns {boolean} true si el nombre es válido, false en caso contrario
 */
export function isValidProjectName(name) {
  return /^[a-z0-9][a-z0-9-]*$/.test(name);
}
```

### 2. Usar logging estructurado

Usa el logger en lugar de console.log:

```javascript
// ❌ Mal
console.log('Processing data');

// ✅ Bien
logger.info('Processing data');
commandLogger.debug('Processing data', { count: 10 });
```

### 3. Validar datos de entrada

Siempre valida los datos de entrada:

```javascript
export async function processProject(projectDir) {
  // Validar que el directorio existe
  if (!validator.isValidPath(projectDir)) {
    throw new Error(`Invalid path: ${projectDir}`);
  }
  
  // Validar que es un proyecto G360 válido
  const result = validator.validateProject(projectDir);
  if (!result.valid) {
    throw new Error(`Invalid project: ${result.errors.join(', ')}`);
  }
  
  // Procesar proyecto
  return processProject(projectDir);
}
```

### 4. Usar internacionalización

Usa i18n para todos los mensajes de usuario:

```javascript
// ❌ Mal
console.log('Project created successfully');

// ✅ Bien
console.log(i18n.t('command.init.success'));
```

### 5. Manejar errores correctamente

Siempre maneja errores con try-catch:

```javascript
export async function riskyOperation() {
  try {
    const result = await doSomething();
    logger.info('Operation completed successfully');
    return result;
  } catch (error) {
    logger.error('Operation failed', { error: error.message });
    throw new Error(`Operation failed: ${error.message}`);
  }
}
```

---

## Contributing

Para agregar nuevas funciones a la API:

1. Agregar JSDoc completo a la función
2. Agregar tests unitarios
3. Actualizar esta documentación
4. Seguir las convenciones de código existentes
5. Usar los módulos existentes cuando sea posible

---

## Version History

- **v1.4.0**: Agregado soporte para testing, logging estructurado, validación de assets, configuración global e internacionalización
- **v1.3.0**: Mejoras en comandos existentes
- **v1.2.0**: Agregado soporte para proyectos Python
- **v1.1.0**: Agregado sistema de auditoría
- **v1.0.0**: Versión inicial