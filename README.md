# g360-cli

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/brand/g360/logotypes/logo-g360-light.svg">
  <img alt="G360" height="64" src="src/assets/brand/g360/logotypes/logo-g360-dark.svg">
</picture>

> CLI tool for bootstrapping G360 projects with standardized structure, assets, and identity

[![npm version](https://img.shields.io/npm/v/g360-cli?color=00d084&label=version)](https://www.npmjs.com/package/g360-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/g360-cli?color=94a3b8)](https://www.npmjs.com/package/g360-cli)

## Â¿CÃ³mo estÃ¡ organizado el proyecto?

```mermaid
flowchart TD
    CLI["g360 CLI<br/>cli.js"]
    CMD["Comandos<br/>init · bring · audit · lint · review · clean · convert · docs · pptx · ingest · scan · validate · setup"]
    LIB["LibrerÃ­as<br/>manifest Â· auditor Â· validator Â· logger"]
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

- [DescripciÃ³n](#descripciÃ³n)
- [CaracterÃ­sticas](#caracterÃ­sticas)
- [TecnologÃ­as](#tecnologÃ­as)
- [InstalaciÃ³n](#instalaciÃ³n)
- [Inicio RÃ¡pido](#inicio-rÃ¡pido)
- [Comandos](#comandos)
- [Plantillas](#plantillas)
- [Componentes](#componentes)
- [Skills](#skills)
- [Convenciones de Nombres](#convenciones-de-nombres)
- [ConfiguraciÃ³n](#configuraciÃ³n)
- [API](#api)
- [Estructura](#estructura)
- [Reglas de negocio](#reglas-de-negocio)
- [Scripts](#scripts)
- [Testing](#testing)
- [ContribuciÃ³n](#contribuciÃ³n)
- [Licencia](#licencia)
- [Ecosistema G360](#ecosistema-g360)
- [IntegraciÃ³n con OpenCode](#integraciÃ³n-con-opencode)
- [Sistema Multiagente](#sistema-multiagente)

---

## DescripciÃ³n

CLI tool para el ecosistema G360 que permite inicializar proyectos con estructura estÃ¡ndar, gestionar assets embebidos, y asegurar compliance mediante auditorÃ­a automÃ¡tica. Forma parte del nÃºcleo del ecosistema y estÃ¡ disponible como paquete global de npm.

**Tipo**: CLI Tool / Scaffolding / Generator  
**Plataforma**: Node.js >= 18.0.0  
**DistribuciÃ³n**: npm global (`npm install -g g360-cli`)

---

## TecnologÃ­as

- **Runtime**: Node.js >= 18.0.0
- **Lenguaje**: JavaScript (ESModules)
- **CLI Framework**: Commander 14.x
- **UI**: Chalk 5.x (colores), Ora 9.x (spinners), Inquirer 13.x (prompts)
- **Filesystem**: fs-extra 11.x
- **Build**: pkg 5.8.1 (portable .exe)
- **DistribuciÃ³n**: npm global

---

## CaracterÃ­sticas

- **InicializaciÃ³n rÃ¡pida** - Crea proyectos G360 con estructura estÃ¡ndar
- **GestiÃ³n de assets** - Trae componentes, skills y plantillas embebidas
- **Ingesta ERP** - Normaliza `.xls/.xlsx` de SAP, StarSoft, Spring con `g360 bring ingestion`
- **Motor de clasificaciÃ³n comercial** - `commercial_engine` clasifica documentos en VENTA/DEVOLUCION/AJUSTE con subtipos (PRECIO_LINEA, CARGO_FIJO, SIN_BASE)
- **Precio efectivo** - PRECIO_BASE, RECARGO_UNITARIO y PRECIO_EFECTIVO separan precio fÃ­sico de ajustes financieros FAE
- **Paquete Python** - `g360-core` en PyPI para pipelines de datos independientes
- **AuditorÃ­a** - Verifica compliance de proyectos G360
- **Lint** - Nomenclatura, duplicados y sintaxis con puntaje 0-100
- **Review UI** - Tokens de diseÃ±o, jerarquÃ­a tipogrÃ¡fica y 8 componentes esenciales (`g360 review`, objetivo >= 90)
- **Harness IA** - Skill + commands para OpenCode y rules + workflows para Kilo Code (`g360 bring harness`)
- **Color System v3** - Escala esmeralda con roles por tema (AA en light y dark), identidad CIPSA propia
- **Limpieza** - Elimina assets embebidos antes de deployment
- **Multi-plantilla** - Web (Lit, Solid, Svelte, PWA, React), Python (CLI, Flet â­, Flet Polished â­, CustomTkinter, Migration)
- **Flet Polished** - Template estandar con dual theme, auto-refresh, hash cache, search debounce, KPI glow, G360 signature, portable launcher
- **Brand System v2.0.0** - Sistema de marca unificado con favicons, PWA icons, logotypes para G360 y CIPSA
- **Modo portable** - Proyectos Python con ejecuciÃ³n directa (sin PyInstaller)
- **Modo offline** - Funciona sin conexiÃ³n usando assets cacheados
- **Preview** - Dry-run para previsualizar cambios

---

## VersiÃ³n

**Current: v1.20.4** — [Ver en npm](https://www.npmjs.com/package/g360-cli)

---

## InstalaciÃ³n

### Requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0

### InstalaciÃ³n global

```bash
npm install -g g360-cli
```

### Verificar instalaciÃ³n

```bash
g360 --version
# â†’ 1.18.0

g360 health
```

### Publicar nueva versiÃ³n

```bash
npm version patch   # o minor / major
git push --tags     # CI publica a npm y sube g360.exe al Release (requiere secret NPM_TOKEN)
```

El workflow `.github/workflows/release.yml` corre tests + `validate-assets.js`,
verifica que el tag coincida con `package.json`, publica a npm y adjunta
`dist/g360.exe` al Release. Publicacion manual (sin CI): `npm publish`.

---

## Inicio RÃ¡pido

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

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `-t, --template <tipo>` | Tipo de plantilla (default: auto segun skill) | `auto` |
| `-s, --skill <skill>` | Skill a usar | `corporativo-movil` |
| `-d, --dir <ruta>` | Directorio destino | `.` |
| `--dry-run` | Previsualizar sin crear | `false` |
| `--force` | Sobrescribir existente | `false` |
| `--brand` | Aplicar marca G360 (logo, colores, firma) despuÃ©s de init | `false` |

**Ejemplos:**

```bash
# Proyecto Lit para cliente mÃ³vil
g360 init mi-proyecto --template lit-web --skill corporativo-movil

# Proyecto Solid para herramienta propia
g360 init mi-herramienta --template solid-web --skill moderno-movil

# Proyecto SvelteKit minimalista
g360 init mi-script --template svelte-web --skill minimalista

# Preview sin crear
g360 init mi-proyecto --dry-run

# Crear proyecto con marca G360 aplicada automÃ¡ticamente
g360 init mi-proyecto --brand
```

---

### `g360 set-skill`

Cambia el skill del proyecto actual.

```bash
g360 set-skill <skill> [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--verbose` | Mostrar detalles |
| `--force` | Sobrescribir skill existente |

**Ejemplos:**

```bash
# Cambiar a skill corporativo para PC
g360 set-skill corporativo

# Cambiar a skill moderno para mÃ³vil
g360 set-skill moderno-movil

# Ver detalles del skill
g360 set-skill corporativo-g360 --verbose
```

---

### `g360 tokens`

Emite los **design tokens** del proyecto en el formato de cada stack. Es la
puente entre la fuente de diseÃ±o y el cÃ³digo: las plantillas ya no llevan la
paleta escrita a mano, la reciben de acÃ¡.

```bash
g360 tokens [ruta] [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
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

**Roles emitidos** (idÃ©nticos en todos los stacks, para que los componentes
sean simÃ©tricos):

```text
bg Â· surface Â· surfaceAlt Â· overlay Â· border Â· borderStrong
text Â· textMuted Â· textInverse
accent Â· accentStrong Â· accentBright Â· accentSoft Â· accentHover Â· onAccent
success Â· warning Â· error Â· info
glass Â· blur Â· radius Â· radiusSm
font Â· fontMono Â· fontSize Â· spaceXs..spaceXl
```

En CSS se emiten como `--g360-*` (mÃ¡s los alias `--g360-muted` y
`--g360-rounded` que ya usaban las plantillas y proyectos existentes).

**Temas con `light-dark()`**: cada rol se declara dos veces â€”el valor oscuro
como fallback y `light-dark(oscuro, claro)`â€” asÃ­ funciona en navegadores sin
`light-dark()` y el toggle real es `color-scheme`:

```css
:root { color-scheme: dark light; }   /* sigue al sistema */
html[data-theme="light"] { color-scheme: light; }   /* toggle de la app */
```

**Tailwind**: con v4 (CSS-first) se emite ademÃ¡s el bloque `@theme`, que
expone los tokens como utilidades (`bg-g360-accent`, `text-g360-muted`,
`border-g360-border`). En v3 el tema sigue en `tailwind.config.js` y la CLI lo
avisa.

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--skill <name>` | Skill a aplicar (por defecto, el del `skill.json`) |
| `--accent <familia>` | Familia de acento a aplicar |
| `--wire-css` | Conectar el token file con las hojas de estilo del proyecto |
| `--dry-run` | Previsualizar sin escribir |
| `--verbose` | Mostrar todos los tokens |

`--wire-css` es quirÃºrgico: de cada bloque `:root` retira **solo** las
variables de paleta (las propias de la app se conservan), agrega el `@import`
al principio del archivo (CSS exige que los imports precedan a las reglas) y
elimina el bloque de modo claro Ãºnicamente si define paleta. No toca
artefactos de build ni la galerÃ­a `g360/`.

**Ejemplos:**

```bash
g360 tokens
g360 tokens ./mi-proyecto --skill react-web
g360 tokens --accent cyan --dry-run
```

`g360 set-skill` y `g360 set-accent` reemiten los tokens automÃ¡ticamente: la
familia de acento llega a los estilos, no solo al `skill.json`.

---

### `g360 convert`

Convierte un proyecto existente a identidad G360.

```bash
g360 convert [ruta] [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
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

# Con backup automÃ¡tico
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

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `-p, --path <ruta>` | Ruta al index.html | `.` |
| `--force` | Reinstalar si ya existe | `false` |

**Ejemplos:**

```bash
# Instalar en el directorio actual
g360 signature install

# Forzar reinstalaciÃ³n
g360 signature install --force
```

---

### `g360 bring`

Trae assets G360 al proyecto actual.

```bash
g360 bring [asset] [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
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

# Traer engine especÃ­fico
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
| `.opencode/skills/g360-ui/SKILL.md` | Skill primario UI (politica Less is More) |
| `.opencode/commands/g360-review.md` | Slash command de revision UI |
| `.opencode/commands/g360-ship.md` | Slash command del pipeline completo |
| `.kilo/rules/g360-*.md` | Rules de politica + naming (Kilo Code) |
| `.kilo/commands/g360-*.md` | Workflows de revision y ship |
| `.kilocode/rules/` | Copia legacy para compatibilidad |
| `kilo.jsonc` | `instructions` (merge, no sobrescribe) |
| `AGENTS.md` | Guia agnostica (solo si no existe) |

### `g360 bring ingestion`

Instala el mÃ³dulo de normalizaciÃ³n de datos ERP en proyectos Flet.

```bash
g360 bring ingestion [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `-p, --path <ruta>` | Ruta al proyecto |
| `--dry-run` | Previsualizar |
| `--force` | Sobrescribir archivos existentes |

**Archivos instalados:**
- `src/core/ingestion.py` â€” NormalizaciÃ³n de datos (estabilizar_excel_crudo)
- `src/ui/ingestion_panel.py` â€” Panel Flet para carga de archivos

**ImportaciÃ³n (auto-detects pip â†’ local):**
```python
# Si g360-core estÃ¡ instalado via pip â†’ from g360_core.ingestion import ...
# Si no â†’ from core.ingestion import ...
from ui.ingestion_panel import IngestionPanel
```

El paquete pip acompaÃ±ante `g360-core` se publica en PyPI:
```bash
pip install g360-core
```

### `g360-core` â€” MÃ³dulos principales

#### `commercial_engine.py`

Motor de lÃ³gica de negocio para clasificaciÃ³n documental. Ãšnica fuente de verdad para reglas comerciales.

| FunciÃ³n | PropÃ³sito |
|---------|-----------|
| `classify_base()` | ClasificaciÃ³n primaria: VENTA, DEVOLUCION, AJUSTE |
| `build_invoice_index()` | Ãndice de facturas para cruce de referencias |
| `resolve_document_relationships()` | Asigna SUBTIPO_AJUSTE (PRECIO_LINEA, CARGO_FIJO, SIN_BASE) |
| `calculate_prices()` | PRECIO_BASE, RECARGO_UNITARIO, PRECIO_EFECTIVO |
| `parse_referencia()` | Descompone REFERENCIA "F01/204-56287" en tipo/serie/nÃºmero |

**ClasificaciÃ³n de documentos** (`classify_base` â†’ primero, `resolve_document_relationships` â†’ despuÃ©s para AJUSTE):
```
TPO_DOC          CANTIDAD   â†’  CATEGORIA_OP   SUBTIPO_AJUSTE (cruce vs Ã­ndice)
F01/BDI/F03/...  cualquiera â†’  VENTA          â€”
NC*              â‰  0        â†’  DEVOLUCION     â€”
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
Sin facturas en dataset  â€”                            â†’ SIN_BASE (todo AJUSTE)
```
> Ver detalle completo en [`BUSINESS_RULES.md`](./BUSINESS_RULES.md).

#### `batch_processor.py`

| FunciÃ³n | PropÃ³sito |
|---------|-----------|
| `read_erp_file()` | Punto Ãºnico de lectura: .xls (xlrd), .xlsx (openpyxl), .csv. `dtype=str` preserva ceros a la izquierda |

---

### `g360 list`

Lista assets disponibles.

```bash
g360 list [tipo] [opciones]
```

**Tipos:**

| Tipo | DescripciÃ³n |
|------|-------------|
| `templates` | Lista de plantillas |
| `components` | Lista de componentes |
| `skills` | Lista de skills |
| `ingestion` | MÃ³dulo de ingesta ERP |
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

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `--depth <n>` | Profundidad mÃ¡xima | `3` |

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

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--fix` | Auto-corregir problemas |
| `--verbose` | Salida detallada |
| `--no-autonomy` | Omitir los checks de autosuficiencia |
| `--ecosystem` | Auditar todos los repos bajo `<ruta>/projects` y mostrar un resumen |

**Checks de autosuficiencia:**

| Check | Falla | Aviso |
|-------|-------|-------|
| `AGENTS.md` | No existe | â€” |
| Comando de verificaciÃ³n | No se declara en `AGENTS.md` | Solo estÃ¡ en el README |
| `README.md` | No existe | â€” |
| Lockfile | â€” | Declara dependencias sin lockfile |
| `.env.example` | â€” | El cÃ³digo lee variables de entorno sin documentar |
| Tests honestos | â€” | Hay `skip` / `xfail` / `todo` en archivos de test |

Criterio: `git clone <repo>` + un comando â‡’ la app levanta y los tests pasan,
sin red y sin intervenciÃ³n humana.

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

Genera (o actualiza) el `AGENTS.md` de un repo con el comando de verificaciÃ³n
real, derivado del stack: `package.json`, `pyproject.toml`, `uv.lock`,
`go.mod` o `Cargo.toml`.

```bash
g360 agents [ruta] [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
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

| Stack | VerificaciÃ³n |
|-------|--------------|
| Node + Vitest/Jest | `npm ci` + `npm test` |
| Node sin script de test | `npm run build && npm run lint` (o los que existan) |
| Python + uv | `uv sync` + `uv run pytest` |
| Python + pip | `pip install -r requirements.txt` + `pytest` |
| Go | `go build ./... && go test ./...` |
| Rust | `cargo build && cargo test` |

---

### `g360 clean`

Limpia cÃ³digo muerto, duplicados y archivos huÃ©rfanos del proyecto.

```bash
g360 clean [ruta] [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--dry-run` | Previsualizar archivos |
| `--force` | Omitir confirmaciÃ³n |
| `--dead` | Eliminar archivos muertos/descontinuados |
| `--duplicates` | Eliminar archivos duplicados |
| `--orphans` | Eliminar archivos huÃ©rfanos (sin referencias) |
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

# Verificar huÃ©rfanos (sin eliminar)
g360 clean --orphans --dry-run
```

---

### `g360 health`

Verifica el estado del sistema.

```bash
g360 health [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--verbose` | Info detallada |

**Ejemplo:**

```bash
g360 health
g360 health --verbose
```

---

### `g360 update`

Actualiza g360-cli a la Ãºltima versiÃ³n.

```bash
g360 update [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--check` | Solo verificar sin actualizar |

**Ejemplo:**

```bash
# Verificar nueva versiÃ³n
g360 update --check

# Actualizar
g360 update
```

---

### `g360 config`

Visualiza o modifica la configuraciÃ³n de g360-cli.

```bash
g360 config [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `--list` | Listar todas las opciones de configuraciÃ³n |
| `--get <key>` | Obtener valor de una configuraciÃ³n |
| `--set <key=value>` | Establecer un valor de configuraciÃ³n |

**Ejemplos:**

```bash
# Listar configuraciÃ³n disponible
g360 config --list

# Verificar skill actual
g360 config --get skill
```

---

### `g360 setup`

Instala la configuraciÃ³n global del sistema multiagente G360 en tu mÃ¡quina.

```bash
g360 setup [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `--platform <platform>` | Plataforma: opencode, kilo, cline, all | `all` |
| `--reset` | Sobrescribir configuraciÃ³n existente | `false` |
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

**QuÃ© instala:**

| Plataforma | Archivos |
|---|---|
| OpenCode | `~/.config/opencode/opencode.json`, `agents/*.md`, `skills/orchestrate/SKILL.md` |
| Kilo | `~/.config/kilo/kilo.jsonc` (shape V1) |
| Cline | `~/.agents/goldfish.ps1` |
| Docs | `~/.agents/HANDOFF.md`, `MULTIAGENTE.md`, `AGENTS.md` |

**VerificaciÃ³n:**

```bash
opencode api get /api/agent    # OpenCode
kilo agent list                 # Kilo
g360 health --agents            # Verificar instalaciÃ³n
```

---

### `g360 scan`

Escanea un directorio para detectar archivos ERP vÃ¡lidos (.xls, .xlsx, .csv).

```bash
g360 scan <directorio> [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `-r, --recursive` | Buscar recursivamente | `true` |
| `--min-score <n>` | PuntuaciÃ³n mÃ­nima de coincidencia | `10` |

**Ejemplos:**

```bash
# Escanear directorio actual
g360 scan .

# Escanear recursivamente con puntuaciÃ³n mÃ­nima
g360 scan ./data --min-score 20

# Solo directorio actual (sin recursiÃ³n)
g360 scan ./exports --no-recursive
```

---

### `g360 validate`

Valida archivos ERP (.xls, .xlsx, .csv) sin procesar completamente.

```bash
g360 validate <archivos...> [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `-r, --recursive` | Buscar recursivamente en directorios |

**Ejemplos:**

```bash
# Validar un archivo
g360 validate factura.xlsx

# Validar mÃºltiples archivos
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

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
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

Plantilla desktop Python con Flet â€” patrones de UI avanzados heredados de produccion.

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

> âš ï¸ **Deprecado** â€” Usar `python-flet-polished` para nuevos proyectos.

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

**NormalizaciÃ³n de datos:** La ingesta aplica transformaciones automÃ¡ticas:
- Parseo de referencias (`F01/201-243065` â†’ tipo, serie, periodo, nÃºmero)
- SeparaciÃ³n de sucursales (nombre + direcciÃ³n)
- ClasificaciÃ³n de documentos (RUC 11 dÃ­gitos / DNI 8 dÃ­gitos)
- NormalizaciÃ³n monetaria con auto-detecciÃ³n de formato SAP/Spring
- Cantidad + Cantidad FAE â†’ cantidad_total + tipo_transaccion
- **ClasificaciÃ³n comercial**: VENTA / DEVOLUCION / AJUSTE con subtipos PRECIO_LINEA, CARGO_FIJO, SIN_BASE
- **Precio efectivo**: PRECIO_BASE (fÃ­sico) y RECARGO_UNITARIO (financiero) separados
- Cruce de NC/NDB contra facturas referenciadas para determinar ajustes de precio por lÃ­nea
- Purga de filas total/general/acumulado
- **Columnas derivadas para UI**: `cliente_label`, `vendedor_label`, `articulo_label`, `linea_label`, etc. (ID - NOMBRE)
- **Cliente completo**: `cliente_full_label` = ID_CLIENTE - DOC_CLIENTE_CLEAN - NOM_CLIENTE
- **CÃ³digo de factura**: `doc_completo` = TPO_DOC + SERIE_DOC + NRO_DOC (ej: "F204-56287")
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

<!-- Con versiÃ³n -->
<g360-signature mode="powered" version="1.0.0"></g360-signature>
```

**Atributos:**
- `mode`: "own" (G360 by ccusi) o "powered" (powered by G360)
- `version`: NÃºmero de versiÃ³n opcional

**CaracterÃ­sticas:**
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
  title: 'ConfiguraciÃ³n',
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

Proyectos para clientes - estilo corporativo - enfoque mÃ³vil.

### corporativo-g360

Proyectos para clientes con colores G360 vibrantes (PC).

### corporativo-g360-movil

Proyectos para clientes con colores G360 - enfoque mÃ³vil.

### moderno

Herramientas propias G360 - estilo innovador (PC).

### moderno-movil

Herramientas propias G360 - estilo innovador (mÃ³vil).

### minimalista

Proyectos minimalistas - scripts, CLI, Python.

### custom

ConfiguraciÃ³n personalizada - colores ajustables.

### flet-desktop

Aplicaciones de escritorio Flet - estilo moderno G360 (PC).

### flet-desktop-corporativo

Aplicaciones Flet para clientes - estilo corporativo conservador.

### cipsa

Proyectos con marca CIPSA - favicon CIPSA rojo, logo corporativo, signature "powered by G360".

### cipsa-movil

Apps mÃ³viles con marca CIPSA - favicon CIPSA rojo, logo corporativo, enfoque mÃ³vil.

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

# Cambiar skill despuÃ©s
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

## ConfiguraciÃ³n

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

### ConfiguraciÃ³n Global

```bash
# Directorio de configuraciÃ³n
~/.g360/

# Assets cacheados
~/.g360/cache/
```

---

## API

### MÃ³dulo Principal

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
â”‚   â”œâ”€â”€ schemas/         # Schemas de validaciÃ³n
â”‚   â””â”€â”€ assets/          # Assets embebidos
â”‚       â”œâ”€â”€ templates/    # Plantillas de proyecto
â”‚       â”œâ”€â”€ components/   # Componentes G360
â”‚       â”œâ”€â”€ brand/        # Sistema de marca v2.0.0 (G360 + CIPSA)
â”‚       â”œâ”€â”€ ingestion/    # MÃ³dulo de ingesta ERP (bring)
â”‚       â”œâ”€â”€ engine/      # G360 Engine
â”‚       â”œâ”€â”€ snippets/    # Snippets de cÃ³digo reutilizables
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

| Comando | DescripciÃ³n |
|---------|-------------|
| `npm run build` | Build portable con pkg (g360.exe) |
| `npm run build:portable` | Especificar target node18-win-x64 |
| `npm test` | Ejecutar tests con Vitest (193 tests, 18 suites) |
| `npm run prepublishOnly` | ValidaciÃ³n antes de publicar en npm (tests + schemas + files + versiÃ³n) |

---

## Testing

```bash
npm test            # Vitest — 193 tests, 18 suites
npm run test:watch  # Modo watch
npm run test:ui     # UI interactiva
npm run test:coverage
```

**Cobertura actual (v1.20.4):**
- `commands/`: init, bring, list, audit, set-skill, addon
- `lib/`: manifest, validator, asset-validator, python_runner, ui-review, version-sync
- **193 passing**

---

## ContribuciÃ³n

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funciÃ³n'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

---

## Licencia

MIT License - ver [LICENSE](LICENSE) para mÃ¡s detalles.

---

## Ecosistema G360

Este proyecto forma parte de la familia de microherramientas **G360** para apoyo CRM y gestiÃ³n de datos en escritorio, enfocadas en Ã¡reas como ventas, finanzas y logÃ­stica.

### Identidad Visual G360

- **Isotipo**: 3 puntos verticales paralelos (gris-verde-gris) + chevron `>`
- **Colores**: #00d084 (verde), #94a3b8 (gris)
- **Marca**: G360 - Microherramientas para apoyo CRM y datos en escritorio
- **ImplementaciÃ³n**: Usar `g360-signature` para branding consistente

### Herramientas Relacionadas

- **[g360-signature](https://github.com/carloscus/g360-signature)**: Web component de branding G360
- **[g360-order-xlsx](https://github.com/carloscus/g360-order-xlsx)**: Procesador de cotizaciones Excel
- **[g360-day-calculator](https://github.com/carloscus/g360-day-calculator)**: Calculadora de dÃ­as laborables
- **[g360-master-data](https://github.com/carloscus/g360-master-data)**: GestiÃ³n de datos maestros

---

### `g360 addon`

GestiÃ³n de addons y paquetes de desarrollo.

```bash
g360 addon <comando> [paquete] [opciones]
```

**Comandos:**
- `install <package>` - Instala un addon (core o dev-tool)
- `list` - Lista addons instalados
- `remove <package>` - Desinstala un addon

**Opciones:**
| OpciÃ³n | DescripciÃ³n |
|--------|-------------|
| `-p, --path <ruta>` | Ruta destino (default: `.`) |
| `--dry-run` | Previsualizar cambios |
| `--force` | Forzar reinstalaciÃ³n/remociÃ³n |

**Ejemplos:**
```bash
# Instalar paquete de diseÃ±o (core)
g360 addon install @google/design.md

# Instalar kit de testing (dev)
g360 addon install @g360/testing

# Listar addons
g360 addon list

# Remover addon
g360 addon remove @google/design.md
```

**Registro de addons:**
- ðŸ›ï¸ Core Dev: Van a `dependencies` (producciÃ³n)
- ðŸ› ï¸ Dev Tools: Van a `devDependencies` (desarrollo)

---

### `g360 docs`

Genera o actualiza la documentaciÃ³n del proyecto.

```bash
g360 docs [level] [opciones]
```

**Niveles:**

| Nivel | Archivo generado | DescripciÃ³n |
|---|---|---|
| `readme` (default) | `README.md` | Logo, diagrama Mermaid, quick start, identidad, firma |
| `architecture` | `ARCHITECTURE.md` | Diagrama de arquitectura general + flujo de datos |
| `business-rules` | `BUSINESS_RULES.md` | Reglas de negocio (solo Python con commercial_engine) |
| `dependencies` | `docs/generated/dependencies.mmd` | Dependencias entre mÃ³dulos |
| `classes` | `docs/generated/classes.mmd` | Relaciones entre clases e interfaces |
| `code-graph` | `docs/generated/code_graph.mmd` | Grafo de cÃ³digo (proyectos grandes) |
| `all` | Todos los anteriores | Todos los niveles aplicables |

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `--level <nivel>` | Nivel de documentaciÃ³n | `readme` |
| `--project <ruta>` | Ruta del proyecto | `.` |
| `--dry-run` | Previsualizar sin escribir | `false` |

**Ejemplos:**

```bash
# Generar README con diagrama
g360 docs

# Generar toda la documentaciÃ³n
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

| Nivel | QuÃ© revisa |
|---|---|
| `naming` | Nomenclatura de funciones, clases, variables y archivos |
| `duplicates` | Funciones duplicadas con nombres iguales o diferentes |
| `syntax` | Errores de sintaxis en archivos JS y Python |
| `structure` | Archivos faltantes (README.md, skill.json, manifest) |
| `all` (default) | Todas las anteriores |

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
|--------|-------------|-------------------|
| `--level <nivel>` | Nivel de lint | `all` |
| `--project <ruta>` | Ruta del proyecto | `.` |

**Ejemplos:**

```bash
# Revisar todo el proyecto
g360 lint

# Solo revisar nomenclatura
g360 lint --level naming

# Revisar un proyecto especÃ­fico
g360 lint --project ./mi-proyecto
```

**Puntaje:** `g360 lint` asigna un puntaje de 0 a 100 basado en la cantidad de hallazgos.

---

### `g360 review`

Revisa la UI del proyecto: tokens de diseÃ±o, jerarquÃ­a tipogrÃ¡fica y componentes esenciales. Detecta el framework (Flet, React, Solid, Svelte, Lit, Vue, CustomTkinter) y la paleta desde `skill.json`.

```bash
g360 review [level] [opciones]
```

**Niveles:**

| Nivel | QuÃ© revisa |
|---|---|
| `tokens` | Colores hardcodeados vs paleta de `skill.json`, `rgb()` literales, colores fuera de paleta |
| `hierarchy` | MÃºltiples `<h1>`, saltos de nivel (H1â†’H3), tamaÃ±os fuera de escala 10-64, mÃ¡s de 6 pasos tipogrÃ¡ficos |
| `components` | 8 esenciales (header, KPI, tabla, drop-zone, loading, firma, export, bÃºsqueda) + antipatrones (sin loading, errores silenciosos, `print`/`console.log` en UI, archivos >400 lÃ­neas) |
| `all` (default) | Todas las anteriores |

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
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

Genera manuales y presentaciones en PowerPoint (.pptx) desde una app G360. Detecta automÃ¡ticamente el framework (Flet, SvelteKit, Lit, React, Vue), los mÃ³dulos UI, las capacidades (PWA, Supabase, Excel, bÃºsqueda) y el tema de marca. El archivo se genera **dentro del propio repo de la app**, independiente para cada proyecto.

```bash
g360 pptx [ruta] [opciones]
```

**Opciones:**

| OpciÃ³n | DescripciÃ³n | Valor por defecto |
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

**DetecciÃ³n automÃ¡tica por framework:**

| Framework | MÃ³dulos UI | Capacidad |
|-----------|-----------|-----------|
| Flet | `src/ui/*.py` + `src/ui/modals/` | desde `src/app.py` (auto-refresh, search, export) |
| SvelteKit | `src/routes/**/+page.svelte` (incluye subrutas dinÃ¡micas) | desde `package.json` |
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
| 2 | Â¿Que es? | Descripcion + tarjetas usuario/tecnico + capacidades |
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
- `dashboard.png` â€” vista principal
- `kpi-card.png`, `modal-export.png` â€” componentes relevantes

Si no hay screenshots, se generan placeholders-guia ("CAPTURA PENDIENTE") que indican que capturar y donde guardarlo.

**Temas disponibles** (design tokens unificados en `design-tokens.js`):

- **`g360`**: Esmeralda `#10B981` sobre slate (default)
- **`cipsa`**: Verde corporativo `#008F5D`, logo CIPSA
- **`corporate`**: Azul marino `#1E40AF`, neutral para apps sin marca

---

## Integracion con OpenCode

g360-cli incluye integraciÃ³n con **OpenCode** para desarrollo asistido por IA. Esta integraciÃ³n permite que los agentes de IA tengan acceso a los recursos de g360-cli durante el desarrollo.

### Archivo de Skill

El archivo `G360-CLI-SKILL.md` contiene toda la informaciÃ³n necesaria para que OpenCode:

- **Recomiende skills apropiados** basÃ¡ndose en el tipo de proyecto
- **Sugiera snippets** relevantes para el contexto de desarrollo
- **Aplique convenciones** del ecosistema G360 automÃ¡ticamente
- **Genere cÃ³digo** siguiendo los patrones G360
- **Valide compliance** con los estÃ¡ndares G360

### ConfiguraciÃ³n de OpenCode

El archivo `opencode-config.json` contiene la configuraciÃ³n de integraciÃ³n con OpenCode, incluyendo:

- Rutas a los recursos de g360-cli
- Comandos disponibles para ejecuciÃ³n
- Convenciones de desarrollo del ecosistema
- ConfiguraciÃ³n de colores y formato

### Uso con OpenCode

Para usar g360-cli con OpenCode:

1. **AsegÃºrate de tener el repo local**:
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
   - Snippets de cÃ³digo reutilizables
   - Plantillas de proyecto estandarizadas
   - Componentes G360 predefinidos
   - Convenciones de desarrollo

### Ejemplos de InteracciÃ³n

#### Crear Nuevo Proyecto

```
Usuario: "Quiero crear una app web para un cliente corporativo"
OpenCode: "Te recomiendo usar el skill 'corporativo-movil' con la plantilla 'web-pwa'. 
Â¿Quieres que inicialice el proyecto con g360 init mi-proyecto --skill corporativo-movil --template web-pwa?"
```

#### Agregar Componente

```
Usuario: "Necesito un botÃ³n con estilo G360"
OpenCode: "Puedo usar el snippet 'g360-button' que incluye los estilos G360 estÃ¡ndar. 
AquÃ­ estÃ¡ el cÃ³digo: <button class='g360-btn'>Click</button>"
```

#### Validar Compliance

```
Usuario: "Verifica si este proyecto cumple con los estÃ¡ndares G360"
OpenCode: "EjecutarÃ© g360 audit para verificar compliance y te reportarÃ© cualquier problema encontrado."
```

### Recursos Disponibles

#### Skills de Identidad Visual

- `corporativo` - Proyectos para clientes - estilo corporativo conservador (PC)
- `corporativo-movil` - Proyectos para clientes - estilo corporativo - enfoque mÃ³vil
- `corporativo-g360` - Proyectos para clientes con colores G360 vibrantes (PC)
- `corporativo-g360-movil` - Proyectos para clientes con colores G360 - enfoque mÃ³vil
- `moderno` - Herramientas propias G360 - estilo innovador (PC)
- `moderno-movil` - Herramientas propias G360 - estilo innovador (mÃ³vil)
- `minimalista` - Proyectos minimalistas - scripts, CLI, Python
- `custom` - ConfiguraciÃ³n personalizada - colores ajustables
- `flet-desktop` - Aplicaciones de escritorio Flet - estilo moderno G360 (PC)
- `flet-desktop-corporativo` - Aplicaciones Flet para clientes - estilo corporativo conservador
- `cipsa` - Proyectos con marca CIPSA - favicon CIPSA rojo, logo corporativo
- `cipsa-movil` - Apps mÃ³viles con marca CIPSA - enfoque mÃ³vil

#### Snippets de CÃ³digo

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

### ActualizaciÃ³n del Skill

Para mantener la integraciÃ³n con OpenCode actualizada:

1. **Sincronizar con g360-cli**: Actualizar `G360-CLI-SKILL.md` cuando se agreguen nuevos skills o snippets
2. **Validar comandos**: Verificar que los comandos de g360-cli funcionen correctamente
3. **Documentar cambios**: Agregar nuevas funcionalidades a la documentaciÃ³n
4. **Testing**: Probar las integraciones con OpenCode regularmente

### Referencias

- **G360-CLI-SKILL.md**: DocumentaciÃ³n completa del skill para OpenCode
- **opencode-config.json**: ConfiguraciÃ³n de integraciÃ³n con OpenCode
- **AGENTS.md**: GuÃ­as de desarrollo para agentes en el ecosistema G360

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

| Agente | Rol | OpenCode | Kilo | Cline |
|---|---|---|---|---|
| `orchestrator` | Clasifica nivel A/B/C, invoca agentes, consolida reporte | ✓ primary | ✓ primary | — |
| `architect` | Implementa código según especificación | ✓ subagent | ✓ g360-architect | — |
| `reviewer` | Revisa diff aislado vs criterio de aceptación (Goldfish) | ✓ subagent | ✓ g360-reviewer | goldfish.ps1 |
| `security-auditor` | Busca credenciales, CVEs, rupturas de contrato | ✓ subagent | ✓ g360-security-auditor | — |
| `data-specialist` | Audita schemas, migraciones, contratos de datos | ✓ subagent | ✓ g360-data-specialist | — |
| `qa-specialist` | Ejecuta tests, valida equivalencia y visual | ✓ subagent | ✓ g360-qa-specialist | — |

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
| `~/.config/opencode/opencode.json` | 6 agentes + permisos (shape V2) |
| `~/.config/opencode/agents/*.md` | Prompts de cada agente |
| `~/.config/opencode/skills/orchestrate/SKILL.md` | Flujo A/B/C + handoff |
| `~/.config/kilo/kilo.jsonc` | Agentes g360-* (shape V1) |
| `~/.agents/HANDOFF.md` | Metodología elefante-goldfish |
| `~/.agents/MULTIAGENTE.md` | Documentación del sistema |
| `~/.agents/MIGRACIONES.md` | Protocolo de migraciones |
| `~/.agents/goldfish.ps1` | Revisor emulado para Cline |

---

## Enlaces

- [npm](https://www.npmjs.com/package/g360-cli)
- [GitHub](https://github.com/carloscus/g360-cli)
- [DocumentaciÃ³n](#)
- [Reportar Issue](https://github.com/carloscus/g360-cli/issues)
---

**Marca**: G360 Â· Microherramientas para apoyo CRM y datos en escritorio
**Isotipo**: 3 puntos verticales paralelos (gris-verde-gris) + chevron `>`
**Signature**: G360 by ccusi (`mode: own`, definido en `brand/g360/signature`)
**Powered by**: [g360-signature](https://github.com/carloscus/g360-signature)

> Identidad generada desde `src/assets/brand/brand.json` (Brand System v2.0.0).
> El logo arriba usa `<picture>` con `prefers-color-scheme` para light/dark.

