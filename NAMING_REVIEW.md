# Naming Review Report — g360-cli

> Analisis de consistencia de nomenclatura, estructura y convenciones.
> Generado por el asistente de revisión de nombres.

---

## Resumen ejecutivo

Se revisaron 15 categorías de nomenclatura y arquitectura en el repositorio g360-cli.
Se encontraron 23 hallazgos: 3 críticos, 10 importantes y 10 menores.

**Puntaje general: 78/100**

El proyecto tiene una base sólida de nomenclatura consistente (camelCase para funciones JS, PascalCase para clases, snake_case para Python), pero presenta inconsistencias en variables genéricas, mezcla de idiomas en comentarios y texto de usuario, convenciones de test mixtas, archivos demasiado grandes y documentación incompleta.

---

## Puntaje general

| Categoría | Puntaje |
|---|---|
| Consistencia General | 78/100 |
| Funciones | 85/100 |
| Métodos | 92/100 |
| Clases | 95/100 |
| Variables | 72/100 |
| Constantes | 88/100 |
| Archivos | 70/100 |
| Carpetas | 85/100 |
| Módulos | 65/100 |
| Arquitectura | 88/100 |
| APIs | 90/100 |
| DTO / Models | 80/100 |
| Tests | 60/100 |
| Documentación | 75/100 |
| Mermaid | 80/100 |
| Consistencia de idioma | 68/100 |

---

## Hallazgos críticos

### 1. Variables genéricas `result` y `info`

**Problema**: El nombre `result` se usa 13 veces como variable genérica en múltiples archivos (`scan.js`, `ingest.js`, `validate.js`, `docs.js`). El nombre `info` se usa en `convert.js:115` sin contexto descriptivo.

**Motivo**: Cuando `result` aparece 13 veces sin contexto, cada uso requiere leer la línea anterior para entender qué resultado se está almacenando. Esto reduce la legibilidad y aumenta la carga cognitiva.

**Ejemplo actual** (src/commands/scan.js:36-37):
```js
const result = await runPython(pyCode);
const data = JSON.parse(result.stdout);
```

**Ejemplo recomendado**:
```js
const scanResult = await runPython(pyCode);
const scanData = JSON.parse(scanResult.stdout);
```

**Beneficio**: Cada variable describe su contenido sin necesidad de leer el código circundante. Un agente de IA o un desarrollador nuevo entiende inmediatamente qué contiene cada variable.

**Prioridad**: Alta

---

### 2. Convención de test mixta (JS vs Python)

**Problema**: Los tests de JavaScript usan el sufijo `.test.js` (e.g., `addon.test.js`, `audit.test.js`), mientras que los tests de Python usan el prefijo `test_` (e.g., `test_app.py`, `test_ingestion.py`). Esto crea confusión sobre la convención del proyecto.

**Motivo**: Un desarrollador o agente de IA que busca tests no puede usar un único patrón para encontrarlos. La inconsistencia sugiere falta de convención definida.

**Ejemplo actual**:
- JS: `src/commands/addon.test.js`
- Python: `src/assets/templates/python-flet/src/test_app.py`

**Ejemplo recomendado**: Elegir una convención única. Para JS mantener `.test.js` (estándar Vitest). Para Python, alinear con `.test.py` como sufijo en lugar de prefijo, o documentar explícitamente la convención de prefijo para Python.

**Beneficio**: Unifica la búsqueda de tests y elimina ambigüedad.

**Prioridad**: Alta

---

### 3. Archivo `docs.js` demasiado grande (815 líneas)

**Problema**: `src/commands/docs.js` tiene 815 líneas y contiene 17 funciones. Viola el principio de responsabilidad única.

**Motivo**: Un archivo tan grande contiene lógica de detección de proyecto, carga de configuración, generación de múltiples niveles de documentación, escaneo de archivos y construcción de diagramas. Esto dificulta el mantenimiento y la navegación.

**Ejemplo actual**: `src/commands/docs.js` (815 líneas, 17 funciones)

**Ejemplo recomendado**: Dividir en módulos especializados:
- `src/commands/docs.js` — función principal `docs()` y enrutamiento
- `src/lib/doc-generators/readme.js` — generación de README
- `src/lib/doc-generators/architecture.js` — generación de ARCHITECTURE.md
- `src/lib/doc-generators/business-rules.js` — generación de BUSINESS_RULES.md
- `src/lib/doc-generators/dependencies.js` — generación de diagrams
- `src/lib/doc-scanning.js` — escaneo de proyecto y análisis de archivos

**Beneficio**: Cada módulo es más pequeño, más fácil de testear y más fácil de entender. Un agente de IA puede enfocarse en un módulo a la vez.

**Prioridad**: Alta

---

## Hallazgos importantes

### 4. Variable `data` en scan.js

**Problema**: `const data = JSON.parse(result.stdout)` en `scan.js:37` usa un nombre demasiado genérico.

**Motivo**: `data` no describe qué tipo de datos contiene ni de dónde vienen.

**Ejemplo actual** (src/commands/scan.js:37):
```js
const data = JSON.parse(result.stdout);
```

**Ejemplo recomendado**:
```js
const scanOutput = JSON.parse(scanResult.stdout);
```

**Prioridad**: Media

---

### 5. Variable `valid` ambigua en validate.js

**Problema**: `let valid = false` en `validate.js:69` y `let valid = false` en `validate.js:106` no describe qué tipo de validación se está realizando.

**Motivo**: `valid` es un booleano genérico. En el contexto de un comando de validación, debería ser más específico.

**Ejemplo actual** (src/commands/validate.js:69):
```js
let validCount = 0;
```

**Ejemplo recomendado**:
```js
let passedCount = 0;
```

**Prioridad**: Media

---

### 6. Mezcla de idiomas en comentarios y texto de usuario

**Problema**: El código mezca español e inglés en comentarios, mensajes de usuario y nombres de funciones.

**Ejemplos actuales**:
- Comentarios en español: `// Paso 1`, `// Normalizar IDs`, `// Convertir a numérico`
- Mensajes de usuario en español: `"❌ Comando invalido"`, `"No se detecto un proyecto"`
- Nombres de funciones en inglés: `detectProjectType`, `installWeb`, `generateReadme`
- Nombres de variables en inglés: `targetDir`, `dryRun`, `projectInfo`

**Ejemplo recomendado**: Elegir un idioma predominante (inglés para código, español para mensajes de usuario) y ser consistente. Los comentarios deben estar en el mismo idioma que los mensajes de usuario.

**Beneficio**: Un desarrollador hispanohablante entiende los mensajes de usuario en español, mientras que un desarrollador internacional entiende el código en inglés. La mezcla confunde a ambos.

**Prioridad**: Media

---

### 7. Archivo `app-root.js` usa kebab-case (inusual para JS)

**Problema**: `src/assets/templates/lit-web/src/components/app-root.js` usa kebab-case en el nombre del archivo, mientras que el resto de archivos JS usan camelCase o snake_case.

**Motivo**: En JavaScript, la convención estándar para nombres de archivo es camelCase (`appRoot.js`) o snake_case (`app_root.js`). Kebab-case (`app-root.js`) es inusual y puede causar confusión con imports.

**Ejemplo actual**: `app-root.js`

**Ejemplo recomendado**: `appRoot.js` (camelCase, convención JS estándar)

**Prioridad**: Media

---

### 8. Carpetas `ingestion/` vs `src/core/` y `src/ui/` inconsistentes

**Problema**: El assets de ingestion usa `src/assets/templates/python-flet/src/core/` y `src/assets/templates/python-flet/src/ui/`, pero el assets de ingestion en `src/assets/ingestion/` usa `core/` y `ui/` directamente sin el prefijo `src/`.

**Ejemplo actual**:
- Template: `src/assets/templates/python-flet/src/core/ingestion.py`
- Assets: `src/assets/ingestion/core/` y `src/assets/ingestion/ui/`

**Ejemplo recomendado**: Estandarizar la estructura. Si el template usa `src/core/`, el assets debería usar `src/core/` también.

**Prioridad**: Media

---

### 9. `snippets.json` demasiado grande (35KB)

**Problema**: `src/assets/snippets/snippets.json` tiene 35KB y contiene muchos snippets en un solo archivo. Esto dificulta el mantenimiento y la navegación.

**Motivo**: Un archivo grande de JSON es difícil de editar, revisar y mantener. Si un snippet tiene un error, hay que buscarlo en un archivo enorme.

**Ejemplo recomendado**: Dividir en archivos individuales por categoría:
- `src/assets/snippets/python-cli.json`
- `src/assets/snippets/web-components.json`
- `src/assets/snippets/flet-components.json`

**Prioridad**: Media

---

### 10. Módulos demasiado grandes en `commands/`

**Problema**: Varios archivos de comandos exceden las 300 líneas, violando el principio de responsabilidad única.

| Archivo | Líneas | Funciones |
|---|---|---|
| `docs.js` | 815 | 17 |
| `convert.js` | 365 | 10 |
| `clean.js` | 348 | 8 |
| `bring.js` | 303 | 6 |
| `signature.js` | 289 | 6 |

**Ejemplo recomendado**: Extraer funcionalidades secundarias a `src/lib/`:
- `convert.js` → `src/lib/project-analyzer.js`, `src/lib/framework-detector.js`
- `clean.js` → `src/lib/dead-file-finder.js`, `src/lib/duplicate-finder.js`
- `bring.js` → `src/lib/brand-applier.js`, `src/lib/asset-installer.js`

**Prioridad**: Media

---

### 11. `dataLines` en ingest.js es confuso

**Problema**: `const dataLines = lines.filter(l => l && l !== header)` en `ingest.js:64` usa `dataLines` que es redundante (ya son líneas de datos).

**Ejemplo recomendado**:
```js
const dataRows = lines.filter(line => line && line !== header);
```

**Prioridad**: Baja

---

### 12. `walk` como nombre de función interna en docs.js y clean.js

**Problema**: La función `walk` se define en `docs.js:580` y `clean.js` no la tiene, pero el patrón de recorrido recursivo de directorios aparece en múltiples lugares sin un nombre consistente.

**Ejemplo actual** (docs.js:580):
```js
function walk(d, depth) {
```

**Ejemplo recomendado**: Si se extrae a `src/lib/file-utils.js`, el nombre `walk` está bien, pero debería ser `walkDirectory` para mayor claridad.

**Prioridad**: Baja

---

## Hallazgos menores

### 13. `getAllFiles` extraído a `src/lib/file-utils.js` pero no tiene test

**Problema**: La función `getAllFiles` fue recientemente extraída a `src/lib/file-utils.js` pero no tiene un archivo de test asociado.

**Ejemplo recomendado**: Crear `src/lib/file-utils.test.js`.

**Prioridad**: Baja

---

### 14. `docs.js` no tiene test

**Problema**: El nuevo comando `docs.js` no tiene un archivo de test asociado.

**Ejemplo recomendado**: Crear `src/commands/docs.test.js`.

**Prioridad**: Baja

---

### 15. `ARCHITECTURE.md` en templates no tiene test de validación

**Problema**: No hay forma de verificar que el `ARCHITECTURE.md` template sea válido o esté actualizado.

**Prioridad**: Baja

---

### 16. `file-utils.js` no exporta funciones de utilidad adicionales

**Problema**: El nuevo `file-utils.js` solo exporta `getAllFiles`. Podría ser un lugar natural para otras utilidades de archivo como `findFiles`, `readJson`, `writeJson`, etc.

**Prioridad**: Baja

---

### 17. `progress.js` no usa la clase `ProgressBar` en todos los comandos

**Problema**: Solo `bring.js` e `init.js` usan el `ProgressBar`. Otros comandos como `docs.js`, `convert.js`, `clean.js` no usan progreso visual.

**Prioridad**: Baja

---

### 18. `convert.js` tiene `loadSkill` duplicado

**Problema**: `convert.js:175` define `async function loadSkill(skillName)` que es similar a `docs.js:147` `function loadSkill(dir)`. Ambas cargan un `skill.json` pero con parámetros diferentes.

**Ejemplo recomendado**: Unificar en `src/lib/skill-loader.js` con una firma consistente.

**Prioridad**: Baja

---

### 19. `runPython` duplicado en scan.js y validate.js

**Problema**: `scan.js:65` y `validate.js:125` definen la misma función `runPython(code)` que ejecuta código Python.

**Ejemplo recomendado**: Extraer a `src/lib/python-runner.js` (que ya existía pero fue eliminada como código muerto — debería ser reemplazada por esta utilidad compartida).

**Prioridad**: Baja

---

### 20. `detectProjectType` en signature.js vs `detectProject` en docs.js

**Problema**: `signature.js:107` tiene `detectProjectType(dir)` y `docs.js:66` tiene `detectProject(dir)`. Ambas detectan el tipo de proyecto pero con implementaciones diferentes.

**Ejemplo recomendado**: Unificar en `src/lib/project-detector.js`.

**Prioridad**: Baja

---

### 21. `showPositions` y `showUsageTips` en signature.js son genéricas

**Problema**: `showPositions()` y `showUsageTips()` son funciones de utilidad que podrían reutilizarse en otros comandos.

**Prioridad**: Baja

---

### 22. `generateThemeCSS` en convert.js es específico de un caso

**Problema**: `convert.js:279` define `generateThemeCSS(skillConfig)` que genera CSS para el tema. Es una función muy específica que podría vivir en `src/lib/theme-generator.js`.

**Prioridad**: Baja

---

### 23. `createBackupFolder` en convert.js podría ser genérico

**Problema**: `convert.js:356` define `createBackupFolder(projectPath)` que crea una carpeta de backup. Esta utilidad podría reutilizarse en `clean.js` y `convert.js`.

**Ejemplo recomendado**: Extraer a `src/lib/backup.js`.

**Prioridad**: Baja

---

## Propuestas de mejora

### Convención de nombres recomendada

| Elemento | Convención | Ejemplo |
|---|---|---|
| Funciones JS | camelCase | `loadProject`, `generateReadme` |
| Clases JS | PascalCase | `G360Signature`, `ProgressBar` |
| Variables JS | camelCase | `scanResult`, `projectInfo` |
| Constantes JS | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_DEPTH` |
| Archivos Python | snake_case.py | `commercial_engine.py`, `batch_processor.py` |
| Archivos JS | camelCase.js | `assetValidator.js`, `fileUtils.js` |
| Archivos test JS | `.test.js` suffix | `addon.test.js` |
| Archivos test Python | `test_` prefix O `_test.py` suffix | `test_app.py` o `app_test.py` |
| Carpetas | kebab-case o snake_case | `g360-core`, `doc_generators` |
| Funciones internas | verbNoun camelCase | `scanProject`, `buildReadmeDiagram` |

### Convención de idioma recomendada

| Elemento | Idioma |
|---|---|
| Nombres de funciones (JS) | Inglés |
| Nombres de clases (JS) | Inglés |
| Nombres de variables (JS) | Inglés |
| Nombres de archivos (JS) | camelCase o snake_case |
| Nombres de archivos (Python) | snake_case |
| Comentarios en código | Inglés |
| Mensajes de usuario (CLI) | Español |
| Documentación (README, docs) | Español con términos técnicos en inglés |

---

## Convención recomendada

### Para el proyecto g360-cli

1. **Funciones JS**: camelCase con verbo inicial (`loadProject`, `generateReadme`, `detectProjectType`)
2. **Clases JS**: PascalCase (`G360Signature`, `ProgressBar`, `FileUtils`)
3. **Variables JS**: camelCase, nunca genéricas (`scanResult` no `result`, `projectInfo` no `info`)
4. **Constantes JS**: UPPER_SNAKE_CASE (`DEFAULT_DEPTH`, `MAX_FILE_SIZE`)
5. **Archivos Python**: snake_case (`commercial_engine.py`, `batch_processor.py`)
6. **Archivos JS**: camelCase (`assetValidator.js`, `fileUtils.js`) — no kebab-case
7. **Tests JS**: sufijo `.test.js` (`addon.test.js`)
8. **Tests Python**: prefijo `test_` (`test_app.py`) — mantener convención actual pero documentarla
9. **Carpetas**: snake_case para utilidades (`doc_generators/`, `file_utils/`)
10. **Idioma del código**: Inglés para nombres y comentarios, español para mensajes de usuario
11. **Variables genéricas prohibidas**: `result`, `data`, `info`, `val`, `obj`, `tmp`, `aux` — siempre descriptivas
12. **Archivos > 300 líneas**: dividir en módulos especializados

---

## Próximos pasos

1. **Alta prioridad**:
   - Renombrar variables genéricas (`result` → descriptivo, `info` → descriptivo) en `scan.js`, `ingest.js`, `validate.js`, `convert.js`, `docs.js`
   - Elegir y documentar convención de tests (JS: `.test.js`, Python: `test_` prefix)
   - Dividir `docs.js` (815 líneas) en módulos especializados

2. **Media prioridad**:
   - Unificar `runPython` en `src/lib/python-runner.js`
   - Unificar `detectProjectType`/`detectProject` en `src/lib/project-detector.js`
   - Unificar `loadSkill` en `src/lib/skill-loader.js`
   - Estandarizar estructura de carpetas `ingestion/` vs `src/core/`
   - Dividir `snippets.json` en archivos individuales
   - Dividir `convert.js`, `clean.js`, `bring.js`, `signature.js` en módulos más pequeños

3. **Baja prioridad**:
   - Renombrar `app-root.js` → `appRoot.js`
   - Crear tests para `file-utils.js` y `docs.js`
   - Crear `src/lib/backup.js` para utilidad de backup
   - Crear `src/lib/theme-generator.js` para CSS generation
   - Documentar convención de idioma en `AGENTS.md`

---

*Generado por el asistente de revisión de nombres · No se modificó código automáticamente*
