# g360-cli

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/brand/g360/logotypes/logo-g360-light.svg">
  <img alt="G360" height="64" src="src/assets/brand/g360/logotypes/logo-g360-dark.svg">
</picture>

> CLI tool for bootstrapping G360 projects with standardized structure, assets, and identity

[![npm version](https://img.shields.io/npm/v/g360-cli?color=00d084&label=version)](https://www.npmjs.com/package/g360-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/g360-cli?color=94a3b8)](https://www.npmjs.com/package/g360-cli)

## ¿Cómo está organizado el proyecto?

```mermaid
flowchart TD
    CLI["g360 CLI<br/>cli.js"]
    CMD["Comandos<br/>init · bring · audit · lint · review · clean · convert · docs · pptx · ingest · scan · validate · setup"]
    LIB["Librerías<br/>manifest · auditor · validator · logger"]
    ASSETS["Assets<br/>templates · brand · signature · ingestion · harness"]
    PY["g360-core (PyPI)<br/>commercial_engine · pipeline · batch_processor"]
    ERP["Datos ERP<br/>.xls · .xlsx · .csv"]
    IA["Sistema Multiagente<br/>orchestrator · architect · reviewer · security-auditor · data-specialist · qa-specialist"]

    CLI --> CMD
    CMD --> LIB
    CMD --> ASSETS
    CMD --> PY
    PY --> ERP
    ASSETS --> IA
```

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Inicio Rápido](#inicio-rápido)
- [Comandos](#comandos)
- [Plantillas](#plantillas)
- [Componentes](#componentes)
- [Skills](#skills)
- [Convenciones de Nombres](#convenciones-de-nombres)
- [Configuración](#configuración)
- [API](#api)
- [Estructura](#estructura)
- [Reglas de negocio](#reglas-de-negocio)
- [Scripts](#scripts)
- [Testing](#testing)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Ecosistema G360](#ecosistema-g360)
- [Integración con OpenCode](#integración-con-opencode)
- [Sistema Multiagente](#sistema-multiagente)

---

## Descripción

CLI tool para el ecosistema G360 que permite inicializar proyectos con estructura estándar, gestionar assets embebidos, y asegurar compliance mediante auditoría automática. Forma parte del núcleo del ecosistema y está disponible como paquete global de npm.

**Tipo**: CLI Tool / Scaffolding / Generator  
**Plataforma**: Node.js >= 18.0.0  
**Distribución**: npm global (`npm install -g g360-cli`)

---

## Tecnologías

- **Runtime**: Node.js >= 18.0.0
- **Lenguaje**: JavaScript (ESModules)
- **CLI Framework**: Commander 14.x
- **UI**: Chalk 5.x (colores), Ora 9.x (spinners), Inquirer 13.x (prompts)
- **Filesystem**: fs-extra 11.x
- **Build**: pkg 5.8.1 (portable .exe)
- **Distribución**: npm global

---

## Características

- **Inicialización rápida** - Crea proyectos G360 con estructura estándar
- **Gestión de assets** - Trae componentes, skills y plantillas embebidas
- **Ingesta ERP** - Normaliza `.xls/.xlsx` de SAP, StarSoft, Spring con `g360 bring ingestion`
- **Motor de clasificación comercial** - `commercial_engine` clasifica documentos en VENTA/DEVOLUCION/AJUSTE con subtipos (PRECIO_LINEA, CARGO_FIJO, SIN_BASE)
- **Precio efectivo** - PRECIO_BASE, RECARGO_UNITARIO y PRECIO_EFECTIVO separan precio físico de ajustes financieros FAE
- **Paquete Python** - `g360-core` en PyPI para pipelines de datos independientes
- **Auditoría** - Verifica compliance de proyectos G360
- **Lint** - Nomenclatura, duplicados y sintaxis con puntaje 0-100
- **Review UI** - Tokens de diseño, jerarquía tipográfica y 8 componentes esenciales (`g360 review`, objetivo >= 90)
- **Harness IA** - Skill + commands para OpenCode y rules + workflows para Kilo Code (`g360 bring harness`)
- **Color System v3** - Escala esmeralda con roles por tema (AA en light y dark), identidad CIPSA propia
- **Limpieza** - Elimina assets embebidos antes de deployment
- **Multi-plantilla** - Web (Lit, Solid, Svelte, PWA, React), Python (CLI, Flet â­, Flet Polished â­, CustomTkinter, Migration)
- **Flet Polished** - Template estandar con dual theme, auto-refresh, hash cache, search debounce, KPI glow, G360 signature, portable launcher
- **Brand System v2.0.0** - Sistema de marca unificado con favicons, PWA icons, logotypes para G360 y CIPSA
- **Modo portable** - Proyectos Python con ejecución directa (sin PyInstaller)
- **Modo offline** - Funciona sin conexión usando assets cacheados
- **Preview** - Dry-run para previsualizar cambios

---

## Versión

**Current: v1.22.0** — [Ver en npm](https://www.npmjs.com/package/g360-cli)

---

## Instalación

### Requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0

### Instalación global

```bash
npm install -g g360-cli
```

### Verificar instalación

```bash
g360 --version
# â†’ 1.22.0

g360 health
```

### Publicar nueva versión

```bash
npm version patch   # o minor / major
git push origin main
npm publish --access public  # requiere 2FA en npm
```

La publicación es **manual** (sin CI). El workflow anterior se desactivó porque
usaba Node 20 (EOL) y nunca se ejecutó en la práctica. Para futuros releases
con CI + provenance, ver ítem de deuda: *trusted publishing con OIDC*.

---

## Inicio Rápido

```bash
# 1. Inicializar nuevo proyecto
g360 init mi-proyecto

# 2. Entrar al proyecto
cd mi-proyecto

# 3. Traer assets G360
g360 bring

# 4. Ver estructura
g360 present

# 5. Auditar proyecto
g360 audit

# 6. Limpiar antes de deploy
g360 clean
```

---

## Comandos

### `g360 init`

Inicializa un nuevo proyecto G360.

```bash
g360 init <nombre> [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-t, --template <tipo>` | Tipo de plantilla (default: auto segun skill) | `auto` |
| `-s, --skill <skill>` | Skill a usar | `corporativo-movil` |
| `-d, --dir <ruta>` | Directorio destino | `.` |
| `--dry-run` | Previsualizar sin crear | `false` |
| `--force` | Sobrescribir existente | `false` |
| `--brand` | Aplicar marca G360 (logo, colores, firma) después de init | `false` |

**Ejemplos:**

```bash
# Proyecto Lit para cliente móvil
g360 init mi-proyecto --template lit-web --skill corporativo-movil

# Proyecto Solid para herramienta propia
g360 init mi-herramienta --template solid-web --skill moderno-movil

# Proyecto SvelteKit minimalista
g360 init mi-script --template svelte-web --skill minimalista

# Preview sin crear
g360 init mi-proyecto --dry-run

# Crear proyecto con marca G360 aplicada automáticamente
g360 init mi-proyecto --brand
```

---

### `g360 set-skill`

Cambia el skill del proyecto actual.

```bash
g360 set-skill <skill> [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--verbose` | Mostrar detalles |
| `--force` | Sobrescribir skill existente |

**Ejemplos:**

```bash
# Cambiar a skill corporativo para PC
g360 set-skill corporativo

# Cambiar a skill moderno para móvil
g360 set-skill moderno-movil

# Ver detalles del skill
g360 set-skill corporativo-g360 --verbose
```

---

### `g360 tokens`

Emite los **design tokens** del proyecto en el formato de cada stack. Es la
puente entre la fuente de diseño y el código: las plantillas ya no llevan la
paleta escrita a mano, la reciben de acá.

```bash
g360 tokens [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--skill <name>` | Skill a aplicar (por defecto, el del `skill.json`) |
| `--accent <familia>` | Familia de acento a aplicar |
| `--dry-run` | Previsualizar sin escribir |
| `--verbose` | Mostrar todos los tokens |

**Destinos por stack:**

| Stack | Archivo generado |
|-------|------------------|
| Web (React, Svelte, Solid, Lit, PWA) | `src/styles/g360-tokens.css` |
| Tailwind v4 (CSS-first) | `src/styles/g360-tokens.tailwind.css` (bloque `@theme`) |
| Python (Flet, CustomTkinter) | `src/core/g360_tokens.py` |
| Go | `internal/theme/tokens.go` |
| Rust / Tauri | `src-tauri/src/theme.rs` |

**Roles emitidos** (idénticos en todos los stacks, para que los componentes
sean simétricos):

```text
bg · surface · surfaceAlt · overlay · border · borderStrong
text · textMuted · textInverse
accent · accentStrong · accentBright · accentSoft · accentHover · onAccent
success · warning · error · info
glass · blur · radius · radiusSm
font · fontMono · fontSize · spaceXs..spaceXl
```

En CSS se emiten como `--g360-*` (más los alias `--g360-muted` y
`--g360-rounded` que ya usaban las plantillas y proyectos existentes).

**Temas con `light-dark()`**: cada rol se declara dos veces —el valor oscuro
como fallback y `light-dark(oscuro, claro)`— así funciona en navegadores sin
`light-dark()` y el toggle real es `color-scheme`:

```css
:root { color-scheme: dark light; }   /* sigue al sistema */
html[data-theme="light"] { color-scheme: light; }   /* toggle de la app */
```

**Tailwind**: con v4 (CSS-first) se emite además el bloque `@theme`, que
expone los tokens como utilidades (`bg-g360-accent`, `text-g360-muted`,
`border-g360-border`). En v3 el tema sigue en `tailwind.config.js` y la CLI lo
avisa.

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--skill <name>` | Skill a aplicar (por defecto, el del `skill.json`) |
| `--accent <familia>` | Familia de acento a aplicar |
| `--wire-css` | Conectar el token file con las hojas de estilo del proyecto |
| `--dry-run` | Previsualizar sin escribir |
| `--verbose` | Mostrar todos los tokens |

`--wire-css` es quirúrgico: de cada bloque `:root` retira **solo** las
variables de paleta (las propias de la app se conservan), agrega el `@import`
al principio del archivo (CSS exige que los imports precedan a las reglas) y
elimina el bloque de modo claro únicamente si define paleta. No toca
artefactos de build ni la galería `g360/`.

**Ejemplos:**

```bash
g360 tokens
g360 tokens ./mi-proyecto --skill react-web
g360 tokens --accent cyan --dry-run
```

`g360 set-skill` y `g360 set-accent` reemiten los tokens automáticamente: la
familia de acento llega a los estilos, no solo al `skill.json`.

---

### `g360 convert`

Convierte un proyecto existente a identidad G360.

```bash
g360 convert [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-s, --skill <skill>` | Skill a aplicar | `corporativo-movil` |
| `--dry-run` | Previsualizar sin aplicar | `false` |
| `--restructure` | Reestructurar archivos | `false` |
| `--force` | Forzar cambios peligrosos | `false` |
| `--backup` | Crear backup antes | `false` |

**Ejemplos:**

```bash
# Preview de cambios
g360 convert . --dry-run

# Convertir proyecto existente
g360 convert ./mi-proyecto --skill corporativo

# Con backup automático
g360 convert . --skill moderno --backup

# Forzar cambios peligrosos
g360 convert . --skill corporativo-movil --force
```

---

### `g360 signature`

Instala el componente de firma oficial G360 en proyectos web.

```bash
g360 signature install [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-p, --path <ruta>` | Ruta al index.html | `.` |
| `--force` | Reinstalar si ya existe | `false` |

**Ejemplos:**

```bash
# Instalar en el directorio actual
g360 signature install

# Forzar reinstalación
g360 signature install --force
```

---

### `g360 bring`

Trae assets G360 al proyecto actual.

```bash
g360 bring [asset] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `-p, --path <ruta>` | Ruta destino |
| `--dry-run` | Previsualizar |
| `--force` | Sobrescribir |

**Ejemplos:**

```bash
# Traer todos los assets
g360 bring

# Traer solo componentes
g360 bring components

# Traer solo skills
g360 bring skills

# Traer engine específico
g360 bring engine/g360-skill-audit

# Traer ingestion module ERP a proyecto Flet existente
g360 bring ingestion

# Instalar integracion IA (OpenCode + Kilo Code)
g360 bring harness
g360 bring harness/opencode   # solo OpenCode (.opencode/)
g360 bring harness/kilocode   # solo Kilo Code (.kilo/ + legacy .kilocode/)
```

### `g360 bring harness`

Instala los archivos de integracion con harnesses de IA en el proyecto actual.

```bash
g360 bring harness [opciones]
```

**Scopes:** `harness` (todo), `harness/opencode`, `harness/kilocode`

**Archivos instalados:**

| Destino | Contenido |
|---------|-----------|
| `.opencode/skills/g360-design/SKILL.md` | Skill orquestador de diseño (politica Less is More + tokens dinamicos) |
| `.opencode/commands/g360-review.md` | Slash command de revision UI |
| `.opencode/commands/g360-ship.md` | Slash command del pipeline completo |
| `.kilo/rules/g360-*.md` | Rules de politica + naming (Kilo Code) |
| `.kilo/commands/g360-*.md` | Workflows de revision y ship |
| `.kilocode/rules/` | Copia legacy para compatibilidad |
| `kilo.jsonc` | `instructions` (merge, no sobrescribe) |
| `AGENTS.md` | Guia agnostica (solo si no existe) |

### `g360 bring ingestion`

Instala el módulo de normalización de datos ERP en proyectos Flet.

```bash
g360 bring ingestion [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `-p, --path <ruta>` | Ruta al proyecto |
| `--dry-run` | Previsualizar |
| `--force` | Sobrescribir archivos existentes |

**Archivos instalados:**
- `src/core/ingestion.py` — Normalización de datos (estabilizar_excel_crudo)
- `src/ui/ingestion_panel.py` — Panel Flet para carga de archivos

**Importación (auto-detects pip â†’ local):**
```python
# Si g360-core está instalado via pip â†’ from g360_core.ingestion import ...
# Si no â†’ from core.ingestion import ...
from ui.ingestion_panel import IngestionPanel
```

El paquete pip acompañante `g360-core` se publica en PyPI:
```bash
pip install g360-core
```

### `g360-core` — Módulos principales

#### `commercial_engine.py`

Motor de lógica de negocio para clasificación documental. Ãšnica fuente de verdad para reglas comerciales.

| Función | Propósito |
|---------|-----------|
| `classify_base()` | Clasificación primaria: VENTA, DEVOLUCION, AJUSTE |
| `build_invoice_index()` | Índice de facturas para cruce de referencias |
| `resolve_document_relationships()` | Asigna SUBTIPO_AJUSTE (PRECIO_LINEA, CARGO_FIJO, SIN_BASE) |
| `calculate_prices()` | PRECIO_BASE, RECARGO_UNITARIO, PRECIO_EFECTIVO |
| `parse_referencia()` | Descompone REFERENCIA "F01/204-56287" en tipo/serie/número |

**Clasificación de documentos** (`classify_base` â†’ primero, `resolve_document_relationships` â†’ después para AJUSTE):
```
TPO_DOC          CANTIDAD   â†’  CATEGORIA_OP   SUBTIPO_AJUSTE (cruce vs índice)
F01/BDI/F03/...  cualquiera â†’  VENTA          —
NC*              â‰  0        â†’  DEVOLUCION     —
NC*              = 0        â†’  AJUSTE         (ver reglas de cruce abajo)
ND*              cualquiera â†’  AJUSTE         (ver reglas de cruce abajo)
```
Subtipos de AJUSTE (`resolve_document_relationships` cruza `REFERENCIA` contra `build_invoice_index`):
```
Clave con SKU coincide   CANTIDAD_FAE = 0            â†’ CARGO_FIJO
Clave con SKU coincide   CANTIDAD_FAE â‰ˆ CANT_FACT    â†’ PRECIO_LINEA
Clave con SKU coincide   CANTIDAD_FAE < CANT_FACT    â†’ PRECIO_PARCIAL
Clave con SKU coincide   CANTIDAD_FAE > CANT_FACT    â†’ SIN_BASE
Clave no coincide        CANTIDAD_FAE = 1            â†’ CARGO_FIJO
Clave no coincide        CANTIDAD_FAE â‰  1            â†’ SIN_BASE
Sin facturas en dataset  —                            â†’ SIN_BASE (todo AJUSTE)
```
> Ver detalle completo en [`BUSINESS_RULES.md`](./BUSINESS_RULES.md).

#### `batch_processor.py`

| Función | Propósito |
|---------|-----------|
| `read_erp_file()` | Punto único de lectura: .xls (xlrd), .xlsx (openpyxl), .csv. `dtype=str` preserva ceros a la izquierda |

---

### `g360 list`

Lista assets disponibles.

```bash
g360 list [tipo] [opciones]
```

**Tipos:**

| Tipo | Descripción |
|------|-------------|
| `templates` | Lista de plantillas |
| `components` | Lista de componentes |
| `skills` | Lista de skills |
| `ingestion` | Módulo de ingesta ERP |
| `all` | Todo (por defecto) |

**Ejemplos:**

```bash
# Listar todo
g360 list

# Solo plantillas
g360 list templates

# Solo componentes
g360 list components

# Salida JSON
g360 list --json
```

---

### `g360 present`

Presenta la estructura del proyecto.

```bash
g360 present [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--depth <n>` | Profundidad máxima | `3` |

**Ejemplo:**

```bash
g360 present
g360 present ./mi-proyecto --depth 2
```

---

### `g360 audit`

Audita el proyecto para compliance G360 **y autosuficiencia**: que el repo pueda
compilar, ejecutarse y probarse sin el asistente y sin red.

```bash
g360 audit [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--fix` | Auto-corregir problemas |
| `--verbose` | Salida detallada |
| `--no-autonomy` | Omitir los checks de autosuficiencia |
| `--ecosystem` | Auditar todos los repos bajo `<ruta>/projects` y mostrar un resumen |
| `--agents` | Verificar integridad de los prompts de agentes instalados (ver abajo) |

**Verificación de integridad de agentes (`--agents`):**

```bash
g360 audit --agents
# → verifica que los prompts de agentes no fueron alterados
# → requiere `g360 setup --platform all` (crea ~/.agents/.manifest.json)
```

Compara los hashes SHA-256 guardados en `~/.agents/.manifest.json` contra
los archivos instalados (`~/.agents/`, `~/.config/opencode/`, `~/.config/kilo/`).
Si un prompt cambió desde el setup, lista las rutas y falla; si el cambio es
intencional, regenerá el manifest con `g360 setup --platform all`.

**Checks de autosuficiencia:**

| Check | Falla | Aviso |
|-------|-------|-------|
| `AGENTS.md` | No existe | — |
| Comando de verificación | No se declara en `AGENTS.md` | Solo está en el README |
| `README.md` | No existe | — |
| Lockfile | — | Declara dependencias sin lockfile |
| `.env.example` | — | El código lee variables de entorno sin documentar |
| Tests honestos | — | Hay `skip` / `xfail` / `todo` en archivos de test |

Criterio: `git clone <repo>` + un comando â‡’ la app levanta y los tests pasan,
sin red y sin intervención humana.

**Ejemplo:**

```bash
g360 audit
g360 audit ./mi-proyecto --verbose
g360 audit --ecosystem C:\ruta\G360-ecosystem
```

**Salida en modo ecosistema:**

```text
Proyecto                     AGENTS  VERIF   README  LOCK    ENV     TESTS   Estado
-------------------------------------------------------------------------------------
g360-price-audit             âœ“       âœ“       âœ“       âœ“       âœ“       âœ“       ok
g360-ventas-pulse            âœ—       !       âœ“       âœ“       âœ“       âœ“       fail
```

---

### `g360 agents`

Genera (o actualiza) el `AGENTS.md` de un repo con el comando de verificación
real, derivado del stack: `package.json`, `pyproject.toml`, `uv.lock`,
`go.mod` o `Cargo.toml`.

```bash
g360 agents [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--dry-run` | Simular sin escribir |
| `--force` | Sobrescribir el `AGENTS.md` entero (pierde lo manual) |
| `--ecosystem` | Generar para todos los repos bajo `<ruta>/projects` |

El bloque generado va entre markers `<!-- g360:agents:begin -->` y
`<!-- g360:agents:end -->`: lo que escribas **afuera** de los markers se
conserva, y regenerar es idempotente.

**Ejemplo:**

```bash
g360 agents                              # en el repo actual
g360 agents ./mi-proyecto --dry-run
g360 agents --ecosystem C:\ruta\G360-ecosystem
```

Comandos que detecta por stack:

| Stack | Verificación |
|-------|--------------|
| Node + Vitest/Jest | `npm ci` + `npm test` |
| Node sin script de test | `npm run build && npm run lint` (o los que existan) |
| Python + uv | `uv sync` + `uv run pytest` |
| Python + pip | `pip install -r requirements.txt` + `pytest` |
| Go | `go build ./... && go test ./...` |
| Rust | `cargo build && cargo test` |

---

### `g360 clean`

Limpia código muerto, duplicados y archivos huérfanos del proyecto.

```bash
g360 clean [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--dry-run` | Previsualizar archivos |
| `--force` | Omitir confirmación |
| `--dead` | Eliminar archivos muertos/descontinuados |
| `--duplicates` | Eliminar archivos duplicados |
| `--orphans` | Eliminar archivos huérfanos (sin referencias) |
| `--organize` | Mostrar archivos descolocados |
| `--all` | Ejecutar todas las verificaciones |

**Ejemplos:**

```bash
# Preview de limpieza completa
g360 clean --dry-run --all

# Solo archivos muertos
g360 clean --dead --force

# Solo duplicados
g360 clean --duplicates --force

# Verificar huérfanos (sin eliminar)
g360 clean --orphans --dry-run
```

---

### `g360 health`

Verifica el estado del sistema.

```bash
g360 health [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--verbose` | Info detallada |

**Ejemplo:**

```bash
g360 health
g360 health --verbose
```

---

### `g360 update`

Actualiza g360-cli a la última versión.

```bash
g360 update [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--check` | Solo verificar sin actualizar |

**Ejemplo:**

```bash
# Verificar nueva versión
g360 update --check

# Actualizar
g360 update
```

---

### `g360 config`

Visualiza o modifica la configuración de g360-cli.

```bash
g360 config [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--list` | Listar todas las opciones de configuración |
| `--get <key>` | Obtener valor de una configuración |
| `--set <key=value>` | Establecer un valor de configuración |

**Ejemplos:**

```bash
# Listar configuración disponible
g360 config --list

# Verificar skill actual
g360 config --get skill
```

---

### `g360 setup`

Instala la configuración global del sistema multiagente G360 en tu máquina.

```bash
g360 setup [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--platform <platform>` | Plataforma: opencode, kilo, cline, all | `all` |
| `--reset` | Sobrescribir configuración existente | `false` |
| `--dry-run` | Previsualizar sin escribir | `false` |
| `--model <model>` | Modelo default: free, paid | `free` |

**Ejemplos:**

```bash
# Instalar todo (OpenCode + Kilo + Cline)
g360 setup

# Solo OpenCode
g360 setup --platform opencode

# Forzar reinstall
g360 setup --platform all --reset

# Preview sin escribir
g360 setup --dry-run

# Usar modelo pago
g360 setup --model paid
```

**Qué instala:**

| Plataforma | Archivos |
|---|---|
| OpenCode | `~/.config/opencode/opencode.json`, `agents/*.md`, `skills/orchestrate/SKILL.md` |
| Kilo | `~/.config/kilo/kilo.jsonc` (shape V1) |
| Cline | `~/.agents/goldfish.ps1` |
| Docs | `~/.agents/HANDOFF.md`, `MULTIAGENTE.md`, `AGENTS.md`, `MIGRACIONES.md`, `GLOSARIO.md` |

**Además:** antes de escribir, `setup` crea un backup en `~/.backup/<fecha>/`,
y al terminar genera `~/.agents/.manifest.json` (hashes SHA-256 de los archivos
instalados) para verificar integridad con `g360 audit --agents`.

**Verificación:**

```bash
opencode api get /api/agent    # OpenCode
kilo agent list                 # Kilo
g360 audit --agents             # Integridad de prompts instalados
```

---

### `g360 scan`

Escanea un directorio para detectar archivos ERP válidos (.xls, .xlsx, .csv).

```bash
g360 scan <directorio> [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-r, --recursive` | Buscar recursivamente | `true` |
| `--min-score <n>` | Puntuación mínima de coincidencia | `10` |

**Ejemplos:**

```bash
# Escanear directorio actual
g360 scan .

# Escanear recursivamente con puntuación mínima
g360 scan ./data --min-score 20

# Solo directorio actual (sin recursión)
g360 scan ./exports --no-recursive
```

---

### `g360 validate`

Valida archivos ERP (.xls, .xlsx, .csv) sin procesar completamente.

```bash
g360 validate <archivos...> [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `-r, --recursive` | Buscar recursivamente en directorios |

**Ejemplos:**

```bash
# Validar un archivo
g360 validate factura.xlsx

# Validar múltiples archivos
g360 validate *.xlsx *.xls

# Validar todos los archivos ERP en un directorio
g360 validate ./exports --recursive
```

---

### `g360 ingest`

Procesa archivos ERP y genera un CSV maestro normalizado.

```bash
g360 ingest <input> [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-o, --output <archivo>` | Ruta de salida CSV | `maestro_ventas_crm.csv` |

**Archivos de entrada soportados:** `.xls`, `.xlsx`, `.csv`

**Ejemplos:**

```bash
# Procesar un archivo Excel
g360 ingest ventas_sap.xlsx

# Procesar directorio completo
g360 ingest ./exports/ -o consolidado.csv

# Procesar con nombre de salida personalizado
g360 ingest reporte.xlsx -o mi_reporte.csv
```

---

## Plantillas

### python-flet-polished â­ (Estandar actual)

Plantilla desktop Python con Flet — patrones de UI avanzados heredados de produccion.

```
mi-proyecto/
â”œâ”€â”€ main.py
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app.py
â”‚   â”œâ”€â”€ config/theme.py
â”‚   â”œâ”€â”€ core/constants.py, processor.py
â”‚   â””â”€â”€ ui/dashboard.py, kpi_card.py, search_overlay.py
â”œâ”€â”€ g360_flet/g360_signature.py
â”œâ”€â”€ assets/fonts/, images/, data/
â”œâ”€â”€ run.bat, launch.vbs, build-portable.bat
â”œâ”€â”€ skill.json, pyproject.toml
â””â”€â”€ sync_portable.py
```

### web-pwa

Plantilla Progressive Web App con React.

```
mi-proyecto/
â”œâ”€â”€ index.html
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.jsx
â”‚   â”œâ”€â”€ App.jsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ Header.jsx
â”‚   â”‚   â”œâ”€â”€ FooterSignature.jsx
â”‚   â”‚   â””â”€â”€ LoadingOverlay.jsx
â”‚   â””â”€â”€ styles/main.css
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ package.json
â””â”€â”€ skill.json
```

### lit-web

Plantilla Web Components con Lit.

```
mi-proyecto/
â”œâ”€â”€ index.html
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.js
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â””â”€â”€ app-root.js
â”‚   â””â”€â”€ styles/
â”‚       â””â”€â”€ main.css
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ package.json
â””â”€â”€ skill.json
```

### solid-web

Plantilla con SolidJS.

```
mi-proyecto/
â”œâ”€â”€ index.html
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ index.jsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â””â”€â”€ App.jsx
â”‚   â””â”€â”€ styles/
â”‚       â””â”€â”€ main.css
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ package.json
â””â”€â”€ skill.json
```

### svelte-web

Plantilla con SvelteKit.

```
mi-proyecto/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app.html
â”‚   â”œâ”€â”€ app.css
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â””â”€â”€ +page.svelte
â”‚   â””â”€â”€ core/
â”‚       â””â”€â”€ skill.json
â”œâ”€â”€ svelte.config.js
â”œâ”€â”€ package.json
â””â”€â”€ skill.json
```

### web-pwa (React)

Plantilla React + Vite con PWA.

```
mi-proyecto/
â”œâ”€â”€ index.html
â”œâ”€â”€ app.js
â”œâ”€â”€ styles.css
â”œâ”€â”€ manifest.json
â””â”€â”€ package.json
```

### python-cli

Plantilla CLI de Python con estructura argparse completa.

```
mi-cli/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.py
â”‚   â””â”€â”€ core/
â”‚       â””â”€â”€ skill.json
â”œâ”€â”€ requirements.txt
â”œâ”€â”€ run.bat
â”œâ”€â”€ build-portable.bat
â””â”€â”€ skill.json
```

### python-flet (LEGACY)

> âš ï¸ **Deprecado** — Usar `python-flet-polished` para nuevos proyectos.

Plantilla GUI de escritorio con **Flet** para apps de contexto ERP.

```
mi-app/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.py                  â† Punto de entrada con IngestionPanel integrado
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”œâ”€â”€ ingestion.py         â† Normalizador de datos ERP
â”‚   â”‚   â”œâ”€â”€ g360_theme.py        â† Tema visual G360
â”‚   â”‚   â””â”€â”€ skill.json
â”‚   â”œâ”€â”€ ui/
â”‚   â”‚   â””â”€â”€ ingestion_panel.py   â† Panel Flet para carga .xls/.xlsx
â”‚   â””â”€â”€ export/
â”‚       â””â”€â”€ __init__.py
â”œâ”€â”€ pyproject.toml                â† Dependencias: flet, pandas, g360-core
â”œâ”€â”€ run.bat
â”œâ”€â”€ build.bat
â””â”€â”€ skill.json
```

**Normalización de datos:** La ingesta aplica transformaciones automáticas:
- Parseo de referencias (`F01/201-243065` â†’ tipo, serie, periodo, número)
- Separación de sucursales (nombre + dirección)
- Clasificación de documentos (RUC 11 dígitos / DNI 8 dígitos)
- Normalización monetaria con auto-detección de formato SAP/Spring
- Cantidad + Cantidad FAE â†’ cantidad_total + tipo_transaccion
- **Clasificación comercial**: VENTA / DEVOLUCION / AJUSTE con subtipos PRECIO_LINEA, CARGO_FIJO, SIN_BASE
- **Precio efectivo**: PRECIO_BASE (físico) y RECARGO_UNITARIO (financiero) separados
- Cruce de NC/NDB contra facturas referenciadas para determinar ajustes de precio por línea
- Purga de filas total/general/acumulado
- **Columnas derivadas para UI**: `cliente_label`, `vendedor_label`, `articulo_label`, `linea_label`, etc. (ID - NOMBRE)
- **Cliente completo**: `cliente_full_label` = ID_CLIENTE - DOC_CLIENTE_CLEAN - NOM_CLIENTE
- **Código de factura**: `doc_completo` = TPO_DOC + SERIE_DOC + NRO_DOC (ej: "F204-56287")
- **Precio unitario**: `precio_base` = SOLES / CANTIDAD

### python-flet-migrate

Plantilla para migrar aplicaciones Tkinter/CTkinter a Flet.

```
mi-app/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.py
â”‚   â””â”€â”€ migrate_tkinter.py
â”œâ”€â”€ requirements.txt
â””â”€â”€ skill.json
```

### python-customtkinter

Plantilla GUI de escritorio con **CustomTkinter** (tema oscuro moderno).

```
mi-app/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.py
â”‚   â””â”€â”€ core/
â”‚       â””â”€â”€ skill.json
â”œâ”€â”€ requirements.txt
â”œâ”€â”€ run.bat
â””â”€â”€ build-portable.bat
```

---

## Componentes

### g360-signature

Firma G360 para proyectos web (Web Component).

```html
<!-- Modo para clientes -->
<g360-signature mode="powered"></g360-signature>

<!-- Modo propio -->
<g360-signature mode="own"></g360-signature>

<!-- Con versión -->
<g360-signature mode="powered" version="1.0.0"></g360-signature>
```

**Atributos:**
- `mode`: "own" (G360 by ccusi) o "powered" (powered by G360)
- `version`: Número de versión opcional

**Características:**
- Isotipo: 3 puntos verticales + chevron >
- Colores: #00d084 (verde), #94a3b8 (gris)
- Opacidad: 0.4 por defecto, 1.0 en hover
- Tema: auto-detecta prefers-color-scheme

### G360DragModal

Modal draggable para interfaces.

```jsx
import G360DragModal from './g360/components/G360DragModal.jsx';

G360DragModal({
  isOpen: true,
  title: 'Configuración',
  onClose: () => setOpen(false),
  children: '<p>Contenido del modal</p>'
});
```

---

## Skills

Los skills definen el estilo visual, dispositivo y signature del proyecto.

### corporativo

Proyectos para clientes - estilo corporativo conservador (PC).

### corporativo-movil

Proyectos para clientes - estilo corporativo - enfoque móvil.

### corporativo-g360

Proyectos para clientes con colores G360 vibrantes (PC).

### corporativo-g360-movil

Proyectos para clientes con colores G360 - enfoque móvil.

### moderno

Herramientas propias G360 - estilo innovador (PC).

### moderno-movil

Herramientas propias G360 - estilo innovador (móvil).

### minimalista

Proyectos minimalistas - scripts, CLI, Python.

### custom

Configuración personalizada - colores ajustables.

### flet-desktop

Aplicaciones de escritorio Flet - estilo moderno G360 (PC).

### flet-desktop-corporativo

Aplicaciones Flet para clientes - estilo corporativo conservador.

### cipsa

Proyectos con marca CIPSA - favicon CIPSA rojo, logo corporativo, signature "powered by G360".

### cipsa-movil

Apps móviles con marca CIPSA - favicon CIPSA rojo, logo corporativo, enfoque móvil.

### flet-desktop-polished

App Flet desktop con patrones UI avanzados: dual theme, auto-refresh, hash cache, search debounce, KPI glow, G360 signature widget. **Estandar actual para Flet.**

### react-web

Aplicaciones web con React/JSX - estilo G360 moderno.

### solid-web

Aplicaciones web con SolidJS - estilo G360 moderno.

### svelte-web

Aplicaciones web con Svelte/SvelteKit - estilo G360 moderno.

### lit-web

Aplicaciones web con Lit Web Components - estilo G360 moderno.

### customtkinter

Aplicaciones desktop con CustomTkinter - estilo G360 moderno.

### Ejemplos de uso

```bash
# Al crear proyecto
g360 init mi-proyecto --skill corporativo-movil

# Cambiar skill después
g360 set-skill moderno

# Ver skills disponibles
g360 list skills

# Aplicar marca a proyecto existente
g360 bring brand/cipsa

# Convertir proyecto con nuevo skill
g360 convert . --skill flet-desktop-polished --force
```

---

## Convenciones de Nombres

Las aplicaciones G360 siguen un sistema de nomenclatura estandarizado para ser identificables y consistentes en el ecosistema.

### Clases UI

| Sufijo | Uso | Ejemplo |
|--------|-----|---------|
| `App` | Orquestador principal | `StockMonitorApp`, `G360App` |
| `Dashboard` | Vista principal con KPIs | `SalesDashboard` |
| `Card` | Tarjeta reutilizable | `KpiCard`, `WarehouseCard` |
| `Modal` | Ventana modal | `ExportModal`, `SearchModal` |
| `Overlay` | Capa flotante | `SearchOverlay`, `LoadingOverlay` |
| `Badge` | Indicador pequeno | `HealthBadge` |
| `Chip` | Tag seleccionable | `WarehouseChip` |
| `Table` | Tabla de datos | `ProductTable` |

### Funciones/Metodos

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `_setup_` | Inicializacion | `_setup_page()`, `_setup_theme()` |
| `_build_` | Construccion UI | `_build_header()`, `_build_content()` |
| `_on_` | Event handlers | `_on_click()`, `_on_refresh()` |
| `_fetch_` / `_download_` | Obtencion datos | `_fetch_data()`, `_download_api()` |
| `_load_` / `_save_` | Persistencia | `_load_cache()`, `_save_data()` |
| `_update_` / `_refresh_` | Actualizacion | `_update_ui()`, `_refresh_kpis()` |
| `_show_` / `_hide_` | Visibilidad | `_show_loading()`, `_hide_overlay()` |
| `_toggle_` | Cambio estado | `_toggle_theme()` |
| `_validate_` | Validaciones | `_validate_input()` |

### Archivos

| Capa | Convention | Ejemplo |
|------|------------|---------|
| Entry | `main.py` | `main.py` |
| App | `app.py` | `app.py` |
| Config | `config/*.py` | `theme.py`, `constants.py` |
| Core | `core/*.py` | `processor.py`, `downloader.py` |
| UI | `ui/*.py` | `dashboard.py`, `kpi_card.py` |
| Modals | `ui/modals/*.py` | `export_modal.py` |

> Para mas detalles, ver [`FLET-NAMING-CONVENTIONS.md`](./FLET-NAMING-CONVENTIONS.md)

---

## Configuración

### g360-manifest.json

Archivo de manifiesto del proyecto.

```json
{
  "name": "mi-proyecto",
  "template": "web-pwa",
  "version": "1.0.0",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "assets": [
    {
      "name": "components",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Configuración Global

```bash
# Directorio de configuración
~/.g360/

# Assets cacheados
~/.g360/cache/
```

---

## API

### Módulo Principal

```javascript
import { g360 } from 'g360-cli';

await g360.init({ name: 'proyecto', template: 'web-pwa' });
await g360.bring('components');
await g360.audit({ path: '.', verbose: true });
await g360.clean({ path: '.', force: true });
```

---

## Estructura

```
g360-cli/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ cli.js           # Entrada principal CLI
â”‚   â”œâ”€â”€ commands/         # Comandos (init, bring, audit, scan, validate, ingest, etc.)
â”‚   â”œâ”€â”€ lib/             # Utilidades (assets, auditor, config, logger, validator, etc.)
â”‚   â”œâ”€â”€ schemas/         # Schemas de validación
â”‚   â””â”€â”€ assets/          # Assets embebidos
â”‚       â”œâ”€â”€ templates/    # Plantillas de proyecto
â”‚       â”œâ”€â”€ components/   # Componentes G360
â”‚       â”œâ”€â”€ brand/        # Sistema de marca v2.0.0 (G360 + CIPSA)
â”‚       â”œâ”€â”€ ingestion/    # Módulo de ingesta ERP (bring)
â”‚       â”œâ”€â”€ engine/      # G360 Engine
â”‚       â”œâ”€â”€ snippets/    # Snippets de código reutilizables
â”‚       â””â”€â”€ config/      # Configuraciones (g360-skills.json, agent-skills.json, project-types.json)
â”œâ”€â”€ py/                  # Paquete Python publicable en PyPI
â”‚   â”œâ”€â”€ pyproject.toml   # g360-core
â”‚   â””â”€â”€ src/g360_core/   # commercial_engine.py, pipeline.py, processor.py, batch_processor.py, utils.py
â”œâ”€â”€ package.json
â”œâ”€â”€ CHANGELOG.md
â”œâ”€â”€ README.md
â””â”€â”€ LICENSE
```

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Build portable con pkg (g360.exe) |
| `npm run build:portable` | Especificar target node18-win-x64 |
| `npm test` | Ejecutar tests con Vitest (258 tests) |
| `npm run prepublishOnly` | Validación antes de publicar en npm (tests + schemas + files + versión) |

---

## Testing

```bash
npm test            # Vitest — 258 tests
npm run test:watch  # Modo watch
npm run test:ui     # UI interactiva
npm run test:coverage
```

**Cobertura actual (v1.22.0):**
- `commands/`: init, bring, list, audit, set-skill, addon
- `lib/`: manifest, validator, asset-validator, python_runner, ui-review, version-sync
- ****258 passing****

---

## Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

---

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## Ecosistema G360

Este proyecto forma parte de la familia de microherramientas **G360** para apoyo CRM y gestión de datos en escritorio, enfocadas en áreas como ventas, finanzas y logística.

### Identidad Visual G360

- **Isotipo**: 3 puntos verticales paralelos (gris-verde-gris) + chevron `>`
- **Colores**: #00d084 (verde), #94a3b8 (gris)
- **Marca**: G360 - Microherramientas para apoyo CRM y datos en escritorio
- **Implementación**: Usar `g360-signature` para branding consistente

### Herramientas Relacionadas

- **[g360-signature](https://github.com/carloscus/g360-signature)**: Web component de branding G360
- **[g360-order-xlsx](https://github.com/carloscus/g360-order-xlsx)**: Procesador de cotizaciones Excel
- **[g360-day-calculator](https://github.com/carloscus/g360-day-calculator)**: Calculadora de días laborables
- **[g360-master-data](https://github.com/carloscus/g360-master-data)**: Gestión de datos maestros

---

### `g360 addon`

Gestión de addons y paquetes de desarrollo.

```bash
g360 addon <comando> [paquete] [opciones]
```

**Comandos:**
- `install <package>` - Instala un addon (core o dev-tool)
- `list` - Lista addons instalados
- `remove <package>` - Desinstala un addon

**Opciones:**
| Opción | Descripción |
|--------|-------------|
| `-p, --path <ruta>` | Ruta destino (default: `.`) |
| `--dry-run` | Previsualizar cambios |
| `--force` | Forzar reinstalación/remoción |

**Ejemplos:**
```bash
# Instalar paquete de diseño (core)
g360 addon install @google/design.md

# Instalar kit de testing (dev)
g360 addon install @g360/testing

# Listar addons
g360 addon list

# Remover addon
g360 addon remove @google/design.md
```

**Registro de addons:**
- 🧪��›ï¸ Core Dev: Van a `dependencies` (producción)
- 🧪��› ï¸ Dev Tools: Van a `devDependencies` (desarrollo)

---

### `g360 docs`

Genera o actualiza la documentación del proyecto.

```bash
g360 docs [level] [opciones]
```

**Niveles:**

| Nivel | Archivo generado | Descripción |
|---|---|---|
| `readme` (default) | `README.md` | Logo, diagrama Mermaid, quick start, identidad, firma |
| `architecture` | `ARCHITECTURE.md` | Diagrama de arquitectura general + flujo de datos |
| `business-rules` | `BUSINESS_RULES.md` | Reglas de negocio (solo Python con commercial_engine) |
| `dependencies` | `docs/generated/dependencies.mmd` | Dependencias entre módulos |
| `classes` | `docs/generated/classes.mmd` | Relaciones entre clases e interfaces |
| `code-graph` | `docs/generated/code_graph.mmd` | Grafo de código (proyectos grandes) |
| `all` | Todos los anteriores | Todos los niveles aplicables |

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--level <nivel>` | Nivel de documentación | `readme` |
| `--project <ruta>` | Ruta del proyecto | `.` |
| `--dry-run` | Previsualizar sin escribir | `false` |

**Ejemplos:**

```bash
# Generar README con diagrama
g360 docs

# Generar toda la documentación
g360 docs --level all

# Generar BUSINESS_RULES para un proyecto Python
g360 docs --level business-rules --project ./mi-proyecto

# Previsualizar sin escribir
g360 docs --level all --dry-run
```

---

### `g360 lint`

Revisa la consistencia de nomenclatura, detecta funciones duplicadas y verifica la sintaxis del proyecto.

```bash
g360 lint [level] [opciones]
```

**Niveles:**

| Nivel | Qué revisa |
|---|---|
| `naming` | Nomenclatura de funciones, clases, variables y archivos |
| `duplicates` | Funciones duplicadas con nombres iguales o diferentes |
| `syntax` | Errores de sintaxis en archivos JS y Python |
| `structure` | Archivos faltantes (README.md, skill.json, manifest) |
| `all` (default) | Todas las anteriores |

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--level <nivel>` | Nivel de lint | `all` |
| `--project <ruta>` | Ruta del proyecto | `.` |

**Ejemplos:**

```bash
# Revisar todo el proyecto
g360 lint

# Solo revisar nomenclatura
g360 lint --level naming

# Revisar un proyecto específico
g360 lint --project ./mi-proyecto
```

**Puntaje:** `g360 lint` asigna un puntaje de 0 a 100 basado en la cantidad de hallazgos.

---

### `g360 review`

Revisa la UI del proyecto: tokens de diseño, jerarquía tipográfica y componentes esenciales. Detecta el framework (Flet, React, Solid, Svelte, Lit, Vue, CustomTkinter) y la paleta desde `skill.json`.

```bash
g360 review [level] [opciones]
```

**Niveles:**

| Nivel | Qué revisa |
|---|---|
| `tokens` | Colores hardcodeados vs paleta de `skill.json`, `rgb()` literales, colores fuera de paleta |
| `hierarchy` | Múltiples `<h1>`, saltos de nivel (H1â†’H3), tamaños fuera de escala 10-64, más de 6 pasos tipográficos |
| `components` | 8 esenciales (header, KPI, tabla, drop-zone, loading, firma, export, búsqueda) + antipatrones (sin loading, errores silenciosos, `print`/`console.log` en UI, archivos >400 líneas) |
| `all` (default) | Todas las anteriores |

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--project <ruta>` | Ruta del proyecto | `.` |
| `--json` | Salida JSON (para agentes) | `false` |

**Ejemplos:**

```bash
# Revisar todo el proyecto
g360 review

# Solo paleta de colores
g360 review tokens

# Salida JSON para un agente
g360 review --json --project ./mi-app
```

**Puntaje:** `g360 review` asigna un puntaje de 0 a 100. Objetivo: >= 90 antes de presentar.

---

### `g360 pptx`

Genera manuales y presentaciones en PowerPoint (.pptx) desde una app G360. Detecta automáticamente el framework (Flet, SvelteKit, Lit, React, Vue), los módulos UI, las capacidades (PWA, Supabase, Excel, búsqueda) y el tema de marca. El archivo se genera **dentro del propio repo de la app**, independiente para cada proyecto.

```bash
g360 pptx [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--mode <tipo>` | Modo de generacion (`manual`, `demo`, `onboarding`) | `manual` |
| `--theme <nombre>` | Tema de marca (`g360`, `cipsa`, `corporate`) | auto-detectado desde `skill.json` |
| `--out <archivo>` | Ruta del archivo de salida | `{repo}/{app-name}-manual.pptx` |
| `--dry-run` | Solo muestra outline sin generar | `false` |

**Modos:**

| Modo | Proposito | Formato |
|------|-----------|---------|
| `manual` | Documentacion de usuario | 16:9 (compartir/imprimir) |
| `demo` | Presentaciones comerciales | 16:9 (proyector/screens) |
| `onboarding` | Guia de inicio rapido | 16:9 |

**Detección automática por framework:**

| Framework | Módulos UI | Capacidad |
|-----------|-----------|-----------|
| Flet | `src/ui/*.py` + `src/ui/modals/` | desde `src/app.py` (auto-refresh, search, export) |
| SvelteKit | `src/routes/**/+page.svelte` (incluye subrutas dinámicas) | desde `package.json` |
| Lit / React / Vue | `src/components/*.js\|ts` | desde `package.json` (supabase, PWA, exceljs, charts, tailwind) |

**Ejemplos:**

```bash
# Generar manual dentro del repo de la app (theme auto-detectado)
g360 pptx ../g360-ventas-pulse

# Manual para app CIPSA (auto-detectado desde skill.json)
g360 pptx ../mi-app --mode manual

# Solo preview del outline
g360 pptx . --dry-run

# Presentacion 16:9 con tema corporate
g360 pptx . --mode demo --theme corporate --out demo.pptx
```

**Estructura generada (16:9 widescreen 13.33x7.5in):**

| # | Slide | Contenido |
|---|-------|-----------|
| 1 | Portada | Nombre + descripcion + tagline + version + logo |
| 2 | ¿Que es? | Descripcion + tarjetas usuario/tecnico + capacidades |
| 3 | Modulos | Tabla de modulos + capturas laterales |
| 4 | Flujo de trabajo | Pasos numerados + capturas |
| 5-N | Features | Una por modulo UI detectado |
| N+1 | Flujos | Modals y workflows (PWA, busqueda en web) |
| N+2 | Arquitectura | Diagrama por capas |
| N+3 | Buenas practicas | Checklist de uso |
| N+4 | Limites conocidos | Solo si el proyecto define `limits` |
| N+5 | Resumen | Sintesis final |

**Screenshots:**

Colocar imagenes en `assets/screenshots/` para inclusion automatica con encaje proporcional (nunca distorsiona):
- `dashboard.png` — vista principal
- `kpi-card.png`, `modal-export.png` — componentes relevantes

Si no hay screenshots, se generan placeholders-guia ("CAPTURA PENDIENTE") que indican que capturar y donde guardarlo.

**Temas disponibles** (design tokens unificados en `design-tokens.js`):

- **`g360`**: Esmeralda `#10B981` sobre slate (default)
- **`cipsa`**: Verde corporativo `#008F5D`, logo CIPSA
- **`corporate`**: Azul marino `#1E40AF`, neutral para apps sin marca

---

## Integracion con OpenCode

g360-cli incluye integración con **OpenCode** para desarrollo asistido por IA. Esta integración permite que los agentes de IA tengan acceso a los recursos de g360-cli durante el desarrollo.

### Archivo de Skill

El archivo `G360-CLI-SKILL.md` contiene toda la información necesaria para que OpenCode:

- **Recomiende skills apropiados** basándose en el tipo de proyecto
- **Sugiera snippets** relevantes para el contexto de desarrollo
- **Aplique convenciones** del ecosistema G360 automáticamente
- **Genere código** siguiendo los patrones G360
- **Valide compliance** con los estándares G360

### Configuración de OpenCode

El archivo `opencode-config.json` contiene la configuración de integración con OpenCode, incluyendo:

- Rutas a los recursos de g360-cli
- Comandos disponibles para ejecución
- Convenciones de desarrollo del ecosistema
- Configuración de colores y formato

### Uso con OpenCode

Para usar g360-cli con OpenCode:

1. **Asegúrate de tener el repo local**:
   ```bash
   cd "C:\Users\ccusi\Documents\Proyect_Coder\G360-ecosystem\projects\g360-cli"
   ```

2. **Ejecuta comandos g360**:
   ```bash
   node src/cli.js list
   node src/cli.js init <nombre> -t <template> -s <skill>
   ```

3. **OpenCode puede acceder a los recursos**:
   - Skills de identidad visual
   - Snippets de código reutilizables
   - Plantillas de proyecto estandarizadas
   - Componentes G360 predefinidos
   - Convenciones de desarrollo

### Ejemplos de Interacción

#### Crear Nuevo Proyecto

```
Usuario: "Quiero crear una app web para un cliente corporativo"
OpenCode: "Te recomiendo usar el skill 'corporativo-movil' con la plantilla 'web-pwa'. 
¿Quieres que inicialice el proyecto con g360 init mi-proyecto --skill corporativo-movil --template web-pwa?"
```

#### Agregar Componente

```
Usuario: "Necesito un botón con estilo G360"
OpenCode: "Puedo usar el snippet 'g360-button' que incluye los estilos G360 estándar. 
Aquí está el código: <button class='g360-btn'>Click</button>"
```

#### Validar Compliance

```
Usuario: "Verifica si este proyecto cumple con los estándares G360"
OpenCode: "Ejecutaré g360 audit para verificar compliance y te reportaré cualquier problema encontrado."
```

### Recursos Disponibles

#### Skills de Identidad Visual

- `corporativo` - Proyectos para clientes - estilo corporativo conservador (PC)
- `corporativo-movil` - Proyectos para clientes - estilo corporativo - enfoque móvil
- `corporativo-g360` - Proyectos para clientes con colores G360 vibrantes (PC)
- `corporativo-g360-movil` - Proyectos para clientes con colores G360 - enfoque móvil
- `moderno` - Herramientas propias G360 - estilo innovador (PC)
- `moderno-movil` - Herramientas propias G360 - estilo innovador (móvil)
- `minimalista` - Proyectos minimalistas - scripts, CLI, Python
- `custom` - Configuración personalizada - colores ajustables
- `flet-desktop` - Aplicaciones de escritorio Flet - estilo moderno G360 (PC)
- `flet-desktop-corporativo` - Aplicaciones Flet para clientes - estilo corporativo conservador
- `cipsa` - Proyectos con marca CIPSA - favicon CIPSA rojo, logo corporativo
- `cipsa-movil` - Apps móviles con marca CIPSA - enfoque móvil

#### Snippets de Código

**Python CLI**: `cli-argparse-basic`, `cli-subcommands`, `cli-logging`, `cli-config-json`, `cli-progress-bar`, `cli-env-config`, `cli-exit-codes`

**Web Components**: `g360-header`, `g360-button`, `g360-card`, `g360-badge`

**Flet Components**: `flet-page`, `flet-card`, `flet-button`, `flet-nav-rail`, `flet-datatable`, `flet-dialog`, `flet-chart-bar`

#### Plantillas de Proyecto

- `web-pwa` - Progressive Web App with offline support
- `svelte-web` - Svelte web application
- `solid-web` - SolidJS web application
- `lit-web` - Lit web application
- `python-cli` - Python command-line tool
- `python-flet` - Python desktop app with Flet framework
- `python-flet-migrate` - Migrate tkinter/ctkinter app to Flet
- `python-customtkinter` - Python desktop app with CustomTkinter

### Actualización del Skill

Para mantener la integración con OpenCode actualizada:

1. **Sincronizar con g360-cli**: Actualizar `G360-CLI-SKILL.md` cuando se agreguen nuevos skills o snippets
2. **Validar comandos**: Verificar que los comandos de g360-cli funcionen correctamente
3. **Documentar cambios**: Agregar nuevas funcionalidades a la documentación
4. **Testing**: Probar las integraciones con OpenCode regularmente

### Referencias

- **G360-CLI-SKILL.md**: Documentación completa del skill para OpenCode
- **opencode-config.json**: Configuración de integración con OpenCode
- **AGENTS.md**: Guías de desarrollo para agentes en el ecosistema G360

---

## Sistema Multiagente

g360-cli incluye el comando `setup` para instalar la configuración global del sistema multiagente G360 en tu máquina. El sistema se basa en el método **Elefante–Goldfish** y despliega 6 agentes especializados en OpenCode, Kilo y Cline.

### Instalación rápida

```bash
# Instalar g360-cli globalmente
npm install -g g360-cli

# Instalar configuración multiagente
g360 setup --platform all
```

### Agentes desplegados

| Agente | Rol | Modelo base | Variante | OpenCode | Kilo | Cline |
|---|---|---|---|---|---|---|
| `orchestrator` | Clasifica nivel A/B/C, invoca agentes, consolida reporte | deepseek-v4.1-flash | `#high` | ✓ primary | ✓ primary | — |
| `architect` | Implementa código según especificación | deepseek-v4.1-flash | `#none` | ✓ subagent | ✓ g360-architect | — |
| `reviewer` | Revisa diff aislado vs criterio de aceptación (Goldfish) | deepseek-v4.1-flash | `#max` | ✓ subagent | ✓ g360-reviewer | goldfish.ps1 |
| `security-auditor` | Busca credenciales, CVEs, rupturas de contrato | deepseek-v4.1-flash | `#low` | ✓ subagent | ✓ g360-security-auditor | — |
| `data-specialist` | Audita schemas, migraciones, contratos de datos | deepseek-v4.1-flash | `#low` | ✓ subagent | ✓ g360-data-specialist | — |
| `qa-specialist` | Ejecuta tests, valida equivalencia y visual | deepseek-v4.1-flash | `#none` | ✓ subagent | ✓ g360-qa-specialist | — |

> Las variantes (`#none`, `#low`, `#high`, `#max`) controlan el nivel de razonamiento ampliado por modelo. Se asignan según coste del error: reviewer → `#max` (gate crítico), orchestrator → `#high`, auditores → `#low`, implementación/QA → `#none`. Ver `docs/decisions.md`.

### Niveles de complejidad

| Nivel | Qué es | Flujo | Gate |
|---|---|---|---|
| **A** | Mantenimiento ligero (typo, estilo, dep menor) | implementa → (qa opcional) | Ninguno |
| **B** | Módulo o funcionalidad nueva | architect → reviewer → qa | Reviewer puede bloquear |
| **C** | Estructural (schema, migración, contratos de datos) | data-specialist → architect (spec) → reviewer ×2 → security-auditor → data-specialist (plan+rollback) → **aprobación humana** → architect (implementa) → qa (funcional+visual) → **aprobación humana final** | Aprobación obligatoria antes y después |

> Un cambio que toca contratos de datos es **C por definición**, aunque sean 3 líneas.

### Uso desde un repo

Abrir el repo en OpenCode o Kilo e invocar:

```
Usá el agente orchestrator.
Tarea: <descripción concreta>
Repo: <ruta absoluta>
Criterio de aceptación: <criterio verificable>
```

El orquestador clasifica el nivel, invoca los agentes correspondientes y presenta un reporte consolidado antes de cambios estructurales.

### Protocolo de migraciones

Para actualizaciones de frameworks (Flet, React, Svelte, etc.) con breaking changes, consultar `~/.agents/MIGRACIONES.md`. El protocolo cubre: diagnóstico de breaking changes, estrategia de compatibilidad (sin shims automáticos), migración incremental por componentes, y rollback plan.

### Verificación

```bash
opencode api get /api/agent    # OpenCode
kilo agent list                 # Kilo
g360 setup --dry-run           # Preview sin escribir
```

### Archivos instalados

| Destino | Contenido |
|---|---|
| `~/.config/opencode/opencode.json` | 6 agentes + permisos (shape V2) + variantes de modelo |
| `~/.config/opencode/agents/*.md` | Prompts de cada agente con modelo+variante |
| `~/.config/opencode/skills/orchestrate/SKILL.md` | Flujo A/B/C + handoff |
| `~/.config/kilo/kilo.jsonc` | Agentes g360-* (shape V1) |
| `~/.agents/HANDOFF.md` | Metodología elefante-goldfish |
| `~/.agents/MULTIAGENTE.md` | Documentación del sistema + reglas de autonomía |
| `~/.agents/MIGRACIONES.md` | Protocolo de migraciones |
| `~/.agents/GLOSARIO.md` | Glosario de términos G360 |
| `~/.agents/goldfish.ps1` | Revisor emulado para Cline |
| `~/.agents/.manifest.json` | Hashes SHA-256 de integridad (ver `g360 audit --agents`) |

---

## Enlaces

- [npm](https://www.npmjs.com/package/g360-cli)
- [GitHub](https://github.com/carloscus/g360-cli)
- [Documentación](#)
- [Reportar Issue](https://github.com/carloscus/g360-cli/issues)
---

**Marca**: G360 · Microherramientas para apoyo CRM y datos en escritorio
**Isotipo**: 3 puntos verticales paralelos (gris-verde-gris) + chevron `>`
**Signature**: G360 by ccusi (`mode: own`, definido en `brand/g360/signature`)
**Powered by**: [g360-signature](https://github.com/carloscus/g360-signature)

> Identidad generada desde `src/assets/brand/brand.json` (Brand System v2.0.0).
> El logo arriba usa `<picture>` con `prefers-color-scheme` para light/dark.

