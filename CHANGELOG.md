# Changelog

Todos los cambios notables en g360-cli serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adherce a [Semantic Versioning](https://semver.org/lang/es/).

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
