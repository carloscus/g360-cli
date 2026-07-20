# Changelog

Todos los cambios notables en g360-cli serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adherce a [Semantic Versioning](https://semver.org/lang/es/).

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
