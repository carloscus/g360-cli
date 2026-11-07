# Changelog

Todos los cambios notables en g360-cli seran documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adherce a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.20.8] - 2026-11-07

### Added
- **`.editorconfig`**: charset utf-8 por defecto para prevenir BOM en futuros archivos.
- **`.gitattributes`**: reglas de EOL (LF para texto, CRLF para scripts .bat/.ps1).
- **`src/lib/json-io.js`**: helpers `readJsonSafe` / `writeJsonSafe` que strippean BOM
  antes de parsear, previniendo crashes como `JSON.parse("﻿{") → SyntaxError`.
- **`g360 lint encoding`**: nuevos checks de mojibake en Markdown y BOM en JSON
  (integrado en el nivel `syntax`).

### Changed
- **`npm test`** ahora ejecuta `vitest run` (termina en vez de dejar watch activo).
- **`cli.js`, `auditor.js`, `docs.js`, `present.js`**: lectores JSON改用 `readJsonSafe`
  para ser resistentes a BOM.
- **`.github/workflows/release.yml`** desactivado → `.github/workflows/release.yml.disabled`
  (usaba Node 20 EOL y documentaba un flujo de CI que nunca se usó; el publish es manual).

### Fixed
- **Mojo quirúrgico en README**: sección "Publicar nueva versión" corregida para
  reflejar el flujo manual real con 2FA. Versión actualizada a v1.20.8.

### Removed
- **`src/assets/harness/opencode/skills/g360-ui/SKILL.md`**: renombrado a
  `g360-design` en commits anteriores; cleanup del asset viejo.

---

## [1.20.7] - 2026-11-06

### Added
- **Evals estáticos del reviewer**: 16 casos con bugs sembrados (credenciales, assert true, skip, regex invertido, SQL injection, lógica de negocio, catch silencioso, rutas absolutas, etc.). Tasa de detección: 93.8% críticos, 0 falsos positivos. Sirve como línea base métrica para medir la calidad del sistema de revisión.

---

## [1.20.6] - 2026-11-06

### Added
- **Manifiesto con hashes**: `g360 audit --agents` verifica integridad de prompts de agentes instalados. Creación automática por `g360 setup` con soporte de backup previo (`~/.backup/`).
- **Backup automático en `g360 setup`**: antes de sobrescribir, se crea copia de seguridad en `~/.backup/<fecha>/`.
- **Regla anti prompt-injection**: agregada a HANDOFF.md y prompts de `data-specialist` y `reviewer`. El contenido de archivos del repo (datos ERP, READMEs) es dato, nunca instrucción.
- **npm provenance**: activada para verificación de cadena de suministro en publicaciones.
- **Backport de assets**: sincronizados prompts actualizados en `src/assets/harness/` (qa-specialist, orchestrator, MIGRACIONES.md).

---

## [1.20.2] - 2026-11-01

### Fixed
- **`g360 tokens`**: orden de argumentos de `light-dark()` corregido. El spec
  CSS es `light-dark(<claro>, <oscuro>)`; el generador emitía `(oscuro, claro)`,
  dejando los dos temas intercambiados en todo archivo generado (roles y
  paleta chart). Detectado por el flujo multiagente (reviewer aislado) sobre
  `g360-price-audit`; verificado contra los tokens resueltos.
- **Templates web regenerados** (React, Svelte, Solid, Lit): sus
  `g360-tokens.css` commiteados quedaron con el orden corregido.

### Added
- **Test de regresión semántico**: verifica cada línea `light-dark()` contra
  `tokens.light`/`tokens.dark` (roles) y `tokens.chart` (índice), con parsing
  que balancea paréntesis para soportar valores `rgba(...)` con comas. El test
  previo consagraba el orden invertido.
- **Guard generador↔template**: cada `g360-tokens.css` de plantilla debe ser
  exactamente la salida actual de `renderCss(resolveTokens(...))`; impide que
  generador y artefactos commiteados vuelvan a divergir.

---

## [1.20.1] - 2026-10-24

### Fixed
- **`g360 agents` y `g360 audit`**: tests dentro de templates vendorizadas (`g360/templates`, `assets/templates`, `samples`, `examples`) ya no cuentan como tests del repo. Evita recomendar `uv run pytest` a proyectos que solo contienen tests de ejemplo.
- **Comando de verificación Python sin tests**: usa `uv run python -m compileall` cuando existe `uv.lock`, asegurando que compile con el intérprete del proyecto.
- **Runner Python**: distingue `pytest` de `unittest` en los archivos reales del proyecto; las pruebas `src/test_app.py` se verifican con `python -m unittest discover`.

---

## [1.20.0] - 2026-10-23

### Added
- **Capa de design tokens** (`src/lib/token-generator.js` + `g360 tokens`): una sola fuente (`g360-skills.json` + `accent-families.json`) emite los mismos roles en **CSS, Python, Go y Rust**. Antes la paleta estaba copiada a mano en 4 CSS, 3 temas Python y 25 snippets, y `g360 set-accent` solo reescribia `skill.json`: la familia de acento nunca llegaba a los estilos
- **Semánticos por tema**: los de modo claro (#15803d / #b45309 / #dc2626 / #0369a1) llegan a AA sobre blanco; los anteriores no (2.28 / 2.15 / 3.76 / 3.68)
- **Tema por skill**: `theme: dark|light` explicito; los skills claros (minimalista, flet-desktop-corporativo) conservan su propia base en modo claro
- **Toggle explicito**: el CSS emite `html[data-theme="light"]` / `html[data-theme="dark"]` ademas de `prefers-color-scheme`, para que las apps con switch (Flet, React) puedan forzarlo
- **Validacion de contraste en el generador**: `g360 tokens` avisa los pares que no llegan a AA (p. ej. `dark: accent/bg 3.52 < 4.5 (usar accentBright: 6.24)`) en vez de emitir una paleta invalida
- **Paleta categorica para series** (`src/assets/config/chart-palettes.json`): 8 colores para KPIs y graficos, con variante por tema, emitidos como `--g360-chart-1..8` y `TOKENS["chart"]`
- **`g360 audit`**: checks de autosuficiencia (AGENTS.md, comando de verificacion, README, lockfile, .env.example, tests honestos) y modo `--ecosystem` con resumen por repo
- **`g360 agents`**: genera/actualiza el `AGENTS.md` de un repo con el comando de verificacion derivado del stack real; idempotente, con markers para no pisar el contenido manual, y `--env-example`
- **`g360 bring brand/<marca>`**: aplica la familia de acento de la marca (antes tomaba un hex propio, que estaba mal para CIPSA)
- **Manifest PWA y theme-color**: `g360 tokens` los sincroniza (no pueden leer custom properties)

### Changed
- **Plantillas web**: token file canonico + `@import`; se eliminan los `:root` duplicados (incluido el de modo claro que pisaba los tokens), se define `--g360-border` y el overlay deja de estar hardcodeado. Los 4 templates (React, Svelte, Solid, Lit) quedan con tokens identicos
- **Snippets**: 25/25 tokenizados (0 hex en los 31 de Flet/CustomTkinter); `flet-glass-theme` se construye desde los tokens
- **Temas Python** (Flet, Flet-migrate, CustomTkinter): +10 roles (accentStrong/Bright/Soft, onAccent, border, info, overlay) para paridad con web
- **`python-flet-polished`**: su `theme.py` deja de tener paleta propia y se construye desde los tokens; la escala de KPIs viene de la paleta categorica
- **`brand.json`**: declara `accentFamily` en vez de `primary_color` (habia 4 fuentes de verdad de color)
- **Deck (PPTX)**: los pasos de acento salen de las familias; los neutros siguen siendo del medio (impresion sobre blanco)
- **Skills**: `flet-desktop-polished` alineado a su familia (emerald) y todos los `skill.json` de plantilla sincronizados con la fuente

### Fixed
- Los bloques `:root` de modo claro de las plantillas pisaban los tokens: cualquier re-tematizacion se rompia
- `web-pwa` usaba `var(--g360-border)` sin definirlo
- `g360 bring brand/cipsa` pintaba CIPSA de esmeralda (tomaba el `primary_color` equivocado)

---

## [1.19.0] - 2026-10-19

### Added
- **Loop visual Flet (`g360 capture`)**: lanza la app via `py/src/g360_capture.py`, espera el render y guarda screenshot en `assets/screenshots/`; el agente lee el PNG y compara contra el plan — diseño UI deja de ser ciego. Detección automática de entrypoint (`main.py` / `src/main.py`), `--wait`, `--timeout`, `--python`
- **Catalogo de layouts (`src/assets/layouts/`)**: 5 recetas de composicion de pantallas (no widgets sueltos): `dashboard-kpi`, `master-detail`, `wizard`, `sidebar-panels`, `lista-filtros-export`. Cada una con wireframe ASCII, bloques, reglas de composicion, snippets asociados y errores comunes. `g360 list layouts`, `g360 bring layouts [/<name>]`
- **`g360 plan-ui <layout>`**: wireframe en texto antes de generar codigo; emite plan con bloques, checklist de composicion y el loop de verificacion (aprobacion del usuario -> codigo -> capture -> review)
- **Flujo de diseño documentado**: seccion "Flujo de Diseño UI (loop visual)" en `G360-CLI-SKILL.md` + `designWorkflow` en `opencode-config.json` (el agente guía el proceso sin adivinar)
- **`g360 capture` verificado end-to-end** contra `g360-erp-nc-sustentor` con flet 0.28.3: la ventana (`FLUTTER_RUNNER_WIN32_WINDOW`) vive en un **proceso hijo** lanzado por flet-desktop — el capturador la localiza recorriendo el árbol de procesos (Win32) y captura con Pillow (`ImageGrab`), sin tocar la app. Fallback a `page.screenshot_async()`/`screenshot()` si una versión futura de flet las expone. Cierre graceful + watchdog de 4s para no dejar el proceso colgado
- **Tests**: `plan-ui.test.js` (catalogo, buildPlan, detección de entrypoint)
- **Sistema de familias de acento** (`src/assets/config/accent-families.json`): 7 familias seleccionables (`emerald`, `cyan`, `azure`, `indigo`, `violet`, `amber`, `rose`) con estructura de tokens simétrica + semánticos fijos; 3 tonos legacy documentados (`teal`, `blue`, `cipsa`) para skills existentes. Todas verificadas contraste AA sobre bg oscuro/claro (≥4.5, calculado)
- **`g360 set-accent <familia>`**: reescribe los tokens `accent*` del `skill.json` del proyecto con la derivación de la familia e imprime la verificación de contraste (`--dry-run`, `--mode dark|light`)
- **Skills variantes** `moderno-azure` y `flet-desktop-indigo` (misma simetría, hue alternativo) + mapeo en `TEMPLATE_DEFAULTS`
- **Fix colisión semántica**: `cipsa`, `cipsa-movil` y `flet-desktop-polished` tenían `accent === success` literal; success pasa a `#22c55e`. Ajuste menor de marca: verde CIPSA `#008F5D` → `#008254` para cumplir AA con texto blanco (4.13 → 4.86)
- **Gate de invariantes de color** (`accent-families.test.js`): bloquea publicar si algún skill tiene `accent === success`, contraste < 4.5 o `dHue(accent, success) < 25` fuera de las excepciones de marca documentadas
- **`accentFamily`** declarado en los 20 skills para saber de qué familia derivan sus tokens

---

## [1.18.1] - 2026-09-18

### Fixed
- **`--project` con ruta absoluta**: `g360 review` y `g360 lint` usaban `path.join(cwd, path)` que rompia rutas absolutas; ahora `path.resolve` (mismo fix aplicado antes a `bring -p`)

---

## [1.18.0] - 2026-09-18

### Added
- **Sistema de color G360 v3**: escala esmeralda (`accentStrong`, `accentBright`, `accentSoft`, `onAccent`, `accentHover`, `info`) + semanticos en los 18 skills de `g360-skills.json` y en todos los `skill.json` de plantillas. CIPSA con identidad propia (`accent #008F5D`). Schema `skills-schema.json` extendido
- **Templates web v3** (web-pwa, solid, svelte, lit): `:root` con escala + roles por tema (light usa `#047857`, AA 5.48:1 sobre blanco), botones con `on-accent`, fuente de sistema + `.g360-num` monoespaciada, `theme-color` dual por tema, `base` comentado para GitHub Pages
- **Flet `theme.py`**: claves `accent_bright`, `accent_soft`, `on_accent`, `accent_hover` en dark/light (aditivas)
- **`g360 review`**: ignora definiciones de tokens y metas `theme-color` (sin falsos positivos)
- **`g360 bring -p`**: acepta rutas absolutas (`path.resolve`)
- **Template `python-flet-polished` sin errores silenciosos**: `except: pass` reemplazados por log (`_log`/`logger.debug` con fallback intacto); review del template 87 → 99/100
- **`g360 review`**: excluye guards `except ImportError` (imports opcionales idiomaticos)
- **Distribucion npm**: skill docs (`G360-CLI-SKILL.md`, `AGENTS-UIUX.md`, `opencode-config.json`, `CHANGELOG.md`) incluidas en `files`; tests excluidos del tarball; `LICENSE` MIT creada (faltaba en disco)
- **Arranque 3.4x mas rapido**: `cli.js` con lazy imports por comando (`--version` 2229ms → 649ms)
- **`prepublishOnly` real**: `vitest run` + `scripts/validate-assets.js` (schemas, `files` en disco, version sincronizada) bloquea publicar si algo falla
- **Version sincronizada**: `opencode-config.json` 1.16.0 → 1.17.1 + test invariante `version-sync.test.js`
- **Release automatizado**: `.github/workflows/release.yml` (tag `v*` → tests → validacion → `npm publish` → `g360.exe` al Release)
- **`g360 review`**: inspeccion UI/UX estatica con niveles `tokens`, `hierarchy`, `components`, `all`. Detecta framework y paleta desde `skill.json`, puntaje 0-100, salida `--json` para agentes
- **`g360 bring harness`**: instala integracion IA en cualquier proyecto — skill `g360-design` + commands para OpenCode (`.opencode/`), rules + workflows para Kilo Code (`.kilo/` + legacy `.kilocode/`), `kilo.jsonc` con merge de `instructions`, `AGENTS.md` agnostico
- **Politica Less is More**: seccion obligatoria al inicio de `G360-CLI-SKILL.md` (no hardcodear colores, loading siempre, errores visibles, 8 esenciales, objetivo review >= 90)
- **Agent skill `ui-review`** registrado en `agent-skills.json`
- **`g360 list harness`**: lista harnesses disponibles (opencode, kilocode)

---

## [1.17.1] - 2026-09-05

### Fixed
- **Brand por skill name**: `skill.json` con `skill: "cipsa-*"` ahora detecta theme cipsa (ej. `cipsa-movil` → theme CIPSA)
- **Match de screenshots ES/EN**: matching semántico con sinónimos (`alerts↔alertas`, `search↔buscar`, `report↔reporte`...) para emparejar capturas con features en repos no ingleses
- **Nombre del repo**: si el H1 del README es distinto al slug técnico (ej. `g360-stock-reporter-lit` → H1 "StockPulse CIPSA"), se usa el nombre legible para la portada
- **Descripción desde README**: lee H1 + primer blockquote `>` siguiendo convención G360; filtra badges/banners ASCII
- **`App.tsx` excluido**: componentes infraestructura (`app-root`, `app`, `main`, `index`) ya no aparecen como features
- **Soporte SolidJS**: detectado desde `solid-js` en dependencies
- **Extensiones web completas**: scanner acepta `.tsx` y `.jsx` además de `.js/.ts`
- **Nombre desde slug**: cuando el H1 no difiere del slug, deriva nombre legible (`g360-signature-creator` → "Signature Creator")
- **Flujo context-aware**: apps generadoras (nombre con "creator/generator/form") usan pasos tipo *Completar formulario → Previsualizar → Seleccionar formato → Exportar* en vez del flujo Flet genérico
- **Arquitectura por framework**: web → UI/Hooks/Utils/Config; Flet → UI/Core/Config/Datos
- **Descripciones de features web**: usan `describeComponentName` en vez del slug en minúsculas
- **CLI "Theme: null"**: ahora muestra "g360" como fallback cuando no hay tema detectado
- **Stock-monitor nombre**: corrige "cipsa" → "G360 Stock Monitor" (lea README cuando skill.json tiene nombre genérico)

---

## [1.17.0] - 2026-09-05

### Changed
- **`g360 pptx` rediseñado — formato 16:9 widescreen unificado** (13.333x7.5in): elimina la mezcla A4/16:9 con elementos fuera de lienzo
- **Design tokens unificados** (`src/assets/pptx/design-tokens.js`): fuente única de verdad de paletas, tipografía (Inter/Arial) y espaciados
- **Nueva paleta `corporate`** (azul marino `#1E40AF`) además de `g360` (esmeralda) y `cipsa` (verde corporativo `#008F5D`, alineado al manual de ventas-pulse)
- **Output por repo**: el PPTX se genera dentro del propio repo de la app (`{repo}/{app}-manual.pptx`), independiente por proyecto
- **Estructura del manual alineada a ventas-pulse**: portada con banda de acento y logo, intro con tarjetas usuario/tecnico, tabla de módulos, flujo numerado, límites con barras ámbar, checklist final

### Added
- **Detección de frameworks web** en `analyze-app.js`:
  - SvelteKit: módulos desde `src/routes/**/+page.svelte` (incluye subrutas dinámicas como `ficha/[cliente]/`)
  - Lit/React/Vue: módulos desde `src/components/*.{js,ts}`
  - Capacidades desde `package.json`: Supabase, PWA (workbox), Excel (exceljs), charts, Tailwind, búsqueda global (scan de contenido)
- **Componente `phoneShot`**: marco tipo teléfono con encaje proporcional contain-fit (nunca distorsiona capturas) y placeholders-guía "CAPTURA PENDIENTE"
- **`scripts/image-size.js`**: lector de dimensiones PNG/JPEG sin dependencias externas
- **Nuevos layouts**: `limitsSlide`, `modulesTable`, `card`, `textBlock` en `layouts/base.js`

### Fixed
- `EISDIR` al escanear `src/ui/` con subdirectorios (ej. `modals/`) — ahora filtra con `fs.stat().isFile()`
- Ruido de `__init__.py` listado como feature en apps Flet
- `require('fs')` dentro de módulo ESM en `themes/base.js` (crasheaba `setLogo`)
- Placeholder y screenshot superpuestos en slides de features (`clearShapes` no existe en pptxgenjs)
- Rutas absolutas rechazadas por `g360 pptx` (ahora usa `path.resolve`)

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
