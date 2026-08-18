
---

## [1.15.2] - 2026-08-16

### Changed
- **Flet bumped to >=0.85.0** - Modern version with better SSL/network support
- **Added pip-system-certs>=4.38** - Fixes SSL certificate issues on Windows corporate networks
- **Python mantenido en 3.11** - Version estable y ligera para distribucion portable

### Fixed
- **API compatibility Flet 0.85**: t.Padding() -> t.padding.only()
- **API compatibility Flet 0.85**: t.border.Top() -> t.border.only(top=...)
- Added pip-system-certs initialization in main.py for SSL fixes

---# Changelog

Todos los cambios notables en g360-cli serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adherce a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.15.1] - 2026-08-15

### Fixed
- README actualizado: version v1.15.1, plantilla python-flet-polished, 5 skills nuevos, LEGACY notice, agent-skills.json
- `opencode-config.json`: JSON malformado corregido (bug preexistente — llave faltante)

---

## [1.15.0] - 2026-08-13

### Added
- **`src/lib/python-runner.js`**: Runner consolidado para ejecutar Python desde Node.js
  - `runPython(code)` — retorna `{stdout, stderr}`
  - `runPythonStdout(code)` — retorna solo stdout
  - `g360CorePath(dir)` — genera sys.path para importar g360_core
- **`src/lib/file-utils.js` — `walkProject(dir, callbacks)`**: Walk recursivo consolidado con callbacks por tipo de archivo
  - Reemplaza 4 walk() duplicados en lint.js
  - Soporta `onJs`, `onPy`, `onFile`, `onDir` callbacks
  - `getJsFiles()` y `getPyFiles()` como helpers

### Changed
- **`scan.js`**: Usa `python-runner.js` en vez de runPython() inline
- **`ingest.js`**: Usa `python-runner.js` — eliminadas 2 funciones runPython() duplicadas
- **`validate.js`**: Usa `python-runner.js` — eliminada runPython() duplicada
- **`lint.js`**: Usa `walkProject()` — eliminados 3 walk() duplicados (~60 lineas)
- **`skills.json` → `agent-skills.json`**: Renombrado para desambiguar con `g360-skills.json`
- **`init.js`**: Referencia actualizada a `agent-skills.json`

### Removed
- `scan.js`: import `spawn` (ya no es necesario)
- `ingest.js`: import `spawn` + 2 funciones runPython/runBatchIngest duplicadas
- `validate.js`: import `spawn` + runPython duplicada
- `lint.js`: 3 funciones walk() inline (~60 lineas de codigo duplicado eliminadas)

### Metrics
- **Lineas eliminadas**: ~212 lineas de codigo duplicado
- **Modulos nuevos**: 2 (`python-runner.js`, `walkProject` en `file-utils.js`)
- **Funciones consolidadas**: 4 runPython + 3 walk = 7 funciones

---

## [1.14.2] - 2026-08-13

### Added
- **Skills visuales para frameworks web**: `react-web`, `solid-web`, `svelte-web`, `lit-web` agregados a `g360-skills.json`
- **Skill `customtkinter`**: Agregado a `g360-skills.json` con soporte portable
- **Project-type `python-customtkinter`**: Agregado a `project-types.json`
- **Snippet language**: Campo `language: "html"` agregado a snippets `g360-header`, `g360-button`, `g360-card`, `g360-badge`

### Fixed
- **D-01**: `python-flet` skill.json flet version `>=0.25.0` → `>=0.28.3` (ahora consistente con pyproject.toml)
- **D-02**: `python-flet` pyproject.toml — agregada dependencia faltante `numpy>=1.24.0`
- **D-03**: `python-flet-migrate` pyproject.toml — removidas dependencias no usadas (`pandas`, `openpyxl`)
- **D-04**: `python-flet-polished` — unificados los 2 skill.json (root y src/core) con mismos colores (`surface: #1a2333`, `accent: #34d399`) y schema consistente
- **D-05**: `python-cli` — agregado `src/core/__init__.py` faltante para importabilidad

### Removed
- `python-cli/package.json` — template Python no necesita package.json (A-02)

---

## [1.14.1] - 2026-08-13

### Fixed
- **B-01**: `docs.js` — brand.json path incorrecto (`../..` → `..`) — `loadBrand()` siempre retornaba `null`
- **B-03**: `lint.js` — `checkJsSyntax()` usaba `new Function()` que fallaba en ES modules (import/export). Ahora skipea archivos ESM automaticamente
- **B-04**: `lint.js` — `checkPySyntax()` detectaba errores de indentacion pero nunca los registraba. Ahora genera findings con severidad WARNING
- **B-05**: `solid-web/App.jsx` — usaba `<slot />` (concepto Svelte/Web Components) en vez de `{props.children}` (SolidJS). Template roto corregido
- **B-06**: `lit-web/index.js` — import path incorrecto `./src/components/app-root.js` (path duplicado). Corregido a `./components/app-root.js`
- **B-07**: `docs.js` — nivel `api` aceptado por CLI pero sin handler (silenciosamente no hacia nada). Agregada funcion `generateApi()` que detecta exports publicos de Python/JS
- **B-02**: `lint.js` — `lint()` ignoraba su parametro `targetPath`, siempre usaba `options.project`

### Removed
- Dead code: `structureRules` en `clean.js` (declarado pero nunca usado)
- Dead code: `__dirname` no utilizado en `clean.js` y `lint.js`
- Artifact: `.pytest_cache/` en template `python-flet` (no debe estar en distribucion)
- Artifact: `__pycache__/*.pyc` en templates y directorio `py/` (22 archivos limpiados)

---

## [1.14.0] - 2026-08-13

### Added
- **Template `python-flet-polished`**: Nueva plantilla estandar de Flet con patrones de UI avanzados heredados de produccion (g360-erp-stock-monitor)
  - Dual theme (dark/light) con persistencia en `~/.g360/`
  - Auto-refresh con lock thread-safe, hash diff cache
  - Search overlay con debounce 250ms
  - KPI cards con glow backlight
  - G360 Signature widget detecta tema automaticamente
  - Custom fonts (Inter + JetBrains Mono) embebidas
  - Launcher auto-instalable de 5 pasos (run.bat)
  - Sistema portable completo (sync_portable.py, launch.vbs, build-portable.bat)
  - Logger RotatingFileHandler con traceback captura
- **Skill `flet-desktop-polished`**: Nuevo skill con 10 features listadas
- **Auto-resolucion de template**: g360 init ahora resuelve template automaticamente segun skill (`g360 init mi-app --skill flet-desktop-polished` usa `python-flet-polished` por defecto)
- **`TEMPLATE_DEFAULTS`**: Mapeo skill→template en init.js
- **`WEAKNESSES.md`**: Registro de debilidades y areas de mejora futura

### Changed
- **`python-flet`**: Marcado como **legacy/deprecated**. Usar `--template python-flet` muestra advertencia y redirige a `python-flet-polished`
- **`pyproject.toml` del template python-flet**: Removida dependencia ficticia `g360-core>=0.1.0`
- **`project-types.json`**: `python-flet-polished` marcado `default: true`, `python-flet` marcado `deprecated: true`
- **`cli.js`**: `--template` default cambiado a `auto` (resuelve segun skill), `--help` actualizado
- **Arquitectura en G360-CLI-SKILL.md**: Documentada nueva estructura python-flet-polished con `src/config/theme.py`, `src/core/processor.py`, `src/ui/search_overlay.py`, `g360_flet/g360_signature.py`

### Deprecated
- Template `python-flet` — usar `python-flet-polished` para nuevos proyectos

---

## [1.13.0] - 2026-06-15

### Added
- Template `python-flet-polished` preparado como base para patrones avanzados

### Changed
- `g360-skills.json`: Mejoras en estructura de skills
- `AGENTS-UIUX.md`: Actualizaciones de lineamientos

---

## [1.13.1] - 2026-06-30

### Changed
- chore: bump version for npm publish
- Correcciones menores en documentacion

---

## [1.12.0] - 2026-07-20

### Added
- **Brand System v2.0.0**: Sistema de marca unificado con favicons, PWA icons y logotypes
  - Marca G360: favicon verde, ICO 16/32/48px, apple-touch-icon 180px, PWA icons 192/512px
  - Marca CIPSA: favicon rojo, ICO 16/32px, apple-touch-icon 180px, PWA icons 192/512px
  - Estructura `src/assets/brand/{g360,cipsa}/{favicons,pwa,logotypes}/`
- **Comandos documentados**: `g360 config`, `g360 scan`, `g360 validate`, `g360 ingest`
- **Skills CIPSA**: `cipsa` y `cipsa-movil` para proyectos con marca corporativa
- **`bring.js` - `applyBrandFavicons()`**: Copia automática de favicons y PWA icons al proyecto destino

### Changed
- `brand.json` actualizado a v2.0.0 con secciones `favicons` y `pwa` por marca
- `g360-skills.json`: `app_icon` corregido a `cipsa/favicons/cipsa.ico`
- README actualizado con comandos faltantes, skills CIPSA, estructura de archivos
- `package.json`: exclusiones `__pycache__` y `.pytest_cache` en `files` array

### Removed
- Template `vba-excel` eliminado del README (template no existe en disco)
- `Devolucion_de_Productos/`: directorio obsoleto eliminado
- `g360-stock-reporter/dist/`: artifacts de build eliminados

### Fixed
- Templates `lit-web`, `solid-web`, `svelte-web`: agregado `favicon.svg` faltante
- `g360-order-form`: favicon reference actualizado a `/favicon.svg`
- `g360-order-xlsx`: apple-touch-icon reference corregido a `/apple-touch-icon.png`

---

## [1.11.0] - 2026

### Added
- Comando `g360 addon` para gestión de paquetes de desarrollo
- Integración con OpenCode para desarrollo asistido por IA
- `G360-CLI-SKILL.md` y `opencode-config.json`

### Changed
- Estructura de proyecto actualizada
- Mejoras en documentación

---

## [1.10.0] - 2026

### Added
- Tests con Vitest (53 tests, 9 suites)
- Cobertura de tests para `commands/` y `lib/`
- `asset-validator.js` y `python_runner.js`

### Changed
- Refactorización de módulos `lib/`
