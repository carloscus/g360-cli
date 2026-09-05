# Changelog

Todos los cambios notables en g360-cli seran documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adherce a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.16.0] - 2026-08-16

### Added
- **Comando `g360 pptx`**: Generador de manuales y presentaciones PPTX para apps G360
  - Modo manual (A4 portrait) y demo (16:9 widescreen)
  - Analyzer automatico de estructura de app (skill.json, src/ui/, modals, src/app.py)
  - Deteccion de features UI, workflows, arquitectura por capas
  - Placeholders automaticos para screenshots (fallback si no hay imagenes)
  - Temas g360 y cipsa auto-detectados desde skill.json
- **App-to-PPTX OpenCode skill**: `.opencode/skills/app-to-pptx/SKILL.md`
- **`src/assets/pptx/`**: Estructura completa de assets PPTX
  - `themes/g360.js`, `themes/cipsa.js` — Temas de marca
  - `layouts/base.js` — 6 layouts reutilizables (cover, screenshot, feature, workflow, architecture, checklist, kpi)
  - `templates/app-manual.js` — Template de 12 slides A4
  - `scripts/analyze-app.js` — Analyzer de estructura G360
- **Dependencia**: `pptxgenjs@^4.0.1` agregado a `package.json`

---

## [1.15.8] - 2026-08-15

### Improved
- **G360 Registry mejorado**: Async support, better error handling, schema versioning
- **Event callbacks**: Soporte para callbacks sync y async
- **Wildcard matching**: Mejora en matching de patrones de eventos
- **Cleanup offline**: Metodo para limpiar apps offline automaticamente
- **Discover apps**: Nueva funcion discover_apps() para descubrimiento facil

---

## [1.15.7] - 2026-08-15

### Added
- **G360 Event Bus**: Sistema de eventos para comunicacion entre apps
- **App Registry**: Descubrimiento automatico de apps G360
- **register_g360_app()**: Funcion de registro en el registry
- **Event patterns**: Patrones estandarizados (app:{name}:*, g360:*)
- **skill.json**: Campos events y endpoints agregados

---

## [1.15.6] - 2026-08-15

### Added
- **Docs**: Documentacion de flujo de uso de skills en apps existentes
- **README**: Secciones de comando set-skill, bring, convert actualizadas

---

## [1.15.5] - 2026-08-15

### Added
- **Colores flexibles en theme.py**: Ahora lee de skill.json con fallback a defaults
- **set_brand_colors()**: Funcion para sobrescribir colores en runtime
- **README template**: Documentacion sobre como personalizar colores

---

## [1.15.4] - 2026-08-13

### Added
- **FLET-NAMING-CONVENTIONS.md**: Sistema completo de convenciones de nombres para apps Flet
  - Patrones de clases UI (App, Dashboard, Card, Modal, Overlay, Badge, Chip, Table)
  - Patrones de funciones/metodos (_setup_, _build_, _on_, _fetch_, etc.)
  - Patrones de variables y archivos
  - Pattern de entry point obligatorio
- **G360-CLI-SKILL.md**: Actualizado con convenciones detalladas de nombres

---

## [1.15.3] - 2026-08-16

### Reverted
- **Flet reverted to ==0.28.3** - v0.85 had compatibility issues with existing patterns

### Kept
- **pip-system-certs>=4.38** - Mantiene fix para SSL en redes corporativas Windows
- **Python 3.11** - Version estable y ligera

### Changed
- API compatibility fixes preserved (ft.padding.only, ft.border.only)

---

## [1.15.2] - 2026-08-16

### Changed
- Flet bumped to >=0.85.0 (reverted in 1.15.3)
- Added pip-system-certs for SSL fixes on Windows corporate networks

---

## [1.15.1] - 2026-08-15

### Fixed
- README actualizado: version v1.15.1, template python-flet-polished, 5 skills nuevos, LEGACY notice, agent-skills.json
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
- **`src/assets/config/agent-skills.json`**: Renombrado desde `skills.json` para desambiguar con `g360-skills.json`
- **5 skills visuales nuevos**: `react-web`, `solid-web`, `svelte-web`, `lit-web`, `customtkinter`
- **Project-type `python-customtkinter`**: Agregado a `project-types.json`
- **Snippets language**: Campo `language: "html"` agregado a snippets `g360-header`, `g360-button`, `g360-card`, `g360-badge`

### Changed
- **`scan.js`**: Usa `python-runner.js` en vez de runPython() inline
- **`ingest.js`**: Usa `python-runner.js` — eliminadas 2 funciones runPython() duplicadas
- **`validate.js`**: Usa `python-runner.js` — eliminada runPython() duplicada
- **`lint.js`**: Usa `walkProject()` — eliminados 3 walk() duplicados (~60 lineas)
- **`skills.json` → `agent-skills.json`**: Renombrado para desambiguar con `g360-skills.json`
- **`init.js`**: Referencia actualizada a `agent-skills.json`
- **Template `python-flet` legacy**: Removida dependencia ficticia `g360-core>=0.1.0`
- **Template `python-flet-migrate`**: Removidas dependencias no usadas (`pandas`, `openpyxl`)
- **Template `python-flet-polished`**: Unificados los 2 skill.json (root y src/core) con mismos colores
- **Template `python-cli`**: Agregado `src/core/__init__.py`, removido `package.json` innecesario
- **Limpiieza de artefactos**: Eliminados `.pytest_cache/` y `__pycache__/*.pyc` de templates

### Fixed
- **B-01**: `docs.js` — brand.json path incorrecto (`../..` → `..`) — `loadBrand()` ahora funciona
- **B-02**: `lint.js` — `lint()` ahora respeta parametro `targetPath`
- **B-03**: `lint.js` — `checkJsSyntax()` skipea archivos ESM en vez de fallar
- **B-04**: `lint.js` — `checkPySyntax()` ahora registra findings de indentacion
- **B-05**: `solid-web/App.jsx` — `<slot />` → `{props.children}` (SolidJS correcto)
- **B-06**: `lit-web/index.js` — import path corregido (`./src/components/` → `./components/`)
- **B-07**: `docs.js` — handler `api` agregado (antes silenciosamente no hacia nada)
- **M-01**: Dead code `structureRules` removido de `clean.js`
- **M-02**: Unused `__dirname` removido de `clean.js` y `lint.js`
- **A-01**: `.pytest_cache/` removido del template `python-flet`
- **A-03**: `__pycache__/*.pyc` eliminados de templates y directorio `py/`

---

## [1.14.2] - 2026-08-13

### Added
- **Skills visuales para frameworks web**: `react-web`, `solid-web`, `svelte-web`, `lit-web` agregados a `g360-skills.json`
- **Skill `customtkinter`**: Agregado a `g360-skills.json` con soporte portable
- **Project-type `python-customtkinter`**: Agregado a `project-types.json`

### Fixed
- **D-01**: `python-flet` skill.json flet version `>=0.25.0` → `>=0.28.3` (ahora consistente con pyproject.toml)
- **D-02**: `python-flet` pyproject.toml — agregada dependencia faltante `numpy>=1.24.0`
- **D-03**: `python-flet-migrate` pyproject.toml — removidas dependencias no usadas (`pandas`, `openpyxl`)
- **D-04**: `python-flet-polished` — unificados los 2 skill.json (root y src/core) con mismos colores
- **D-05**: `python-cli` — agregado `src/core/__init__.py` faltante para importabilidad
- **A-02**: `python-cli/package.json` — removido (template Python no necesita package.json)

---

## [1.14.1] - 2026-08-13

### Fixed
- **B-01**: `docs.js` — brand.json path incorrecto (`../..` → `..`) — `loadBrand()` siempre retornaba `null`
- **B-03**: `lint.js` — `checkJsSyntax()` usaba `new Function()` que fallaba en ES modules. Ahora skipea archivos ESM automaticamente
- **B-04**: `lint.js` — `checkPySyntax()` detectaba errores de indentacion pero nunca los registraba. Ahora genera findings con severidad WARNING
- **B-05**: `solid-web/App.jsx` — usaba `<slot />` (concepto Svelte) en vez de `{props.children}` (SolidJS). Template roto corregido
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

### Changed
- **`python-flet`**: Marcado como **legacy/deprecated**. Usar `--template python-flet` muestra advertencia y redirige a `python-flet-polished`
- **`project-types.json`**: `python-flet-polished` marcado `default: true`, `python-flet` marcado `deprecated: true`
- **`cli.js`**: `--template` default cambiado a `auto` (resuelve segun skill), `--help` actualizado
- **Arquitectura en G360-CLI-SKILL.md**: Documentada nueva estructura python-flet-polished con `src/config/theme.py`, `src/core/processor.py`, `src/ui/search_overlay.py`, `g360_flet/g360_signature.py`

### Deprecated
- Template `python-flet` — usar `python-flet-polished` para nuevos proyectos

---

## [1.13.1] - 2026-06-30

### Changed
- chore: bump version for npm publish

---

## [1.13.0] - 2026-06-15

### Added
- Template `python-flet-polished` preparado como base para patrones avanzados

### Changed
- `g360-skills.json`: Mejoras en estructura de skills

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
- Comando `g360 addon` para gestion de paquetes de desarrollo
- Integracion con OpenCode para desarrollo asistido por IA
- `G360-CLI-SKILL.md` y `opencode-config.json`

### Changed
- Estructura de proyecto actualizada
- Mejoras en documentacion

---

## [1.10.0] - 2026

### Added
- Tests con Vitest (53 tests, 9 suites)
- Cobertura de tests para `commands/` y `lib/`
- `asset-validator.js` y `python_runner.js`

### Changed
- Refactorizacion de modulos `lib/`
