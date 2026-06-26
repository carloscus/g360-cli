# g360-cli

> CLI tool for bootstrapping G360 projects with standardized structure, assets, and identity

[![npm version](https://img.shields.io/npm/v/g360-cli)](https://www.npmjs.com/package/g360-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
- [Configuración](#configuración)
- [API](#api)
- [Estructura](#estructura)
- [Scripts](#scripts)
- [Testing](#testing)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Ecosistema G360](#ecosistema-g360)
- [Integración con OpenCode](#integración-con-opencode)

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
- **Limpieza** - Elimina assets embebidos antes de deployment
- **Multi-plantilla** - Web (Lit, Solid, Svelte, React), Python (CLI, Flet, CustomTkinter), VBA Excel
- **Modo portable** - Proyectos Python con ejecución directa (sin PyInstaller)
- **Modo offline** - Funciona sin conexión usando assets cacheados
- **Preview** - Dry-run para previsualizar cambios

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
g360 health
```

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
| `-t, --template <tipo>` | Tipo de plantilla | `web-pwa` |
| `-s, --skill <skill>` | Skill a usar | `corporativo-movil` |
| `-d, --dir <ruta>` | Directorio destino | `.` |
| `--dry-run` | Previsualizar sin crear | `false` |
| `--force` | Sobrescribir existente | `false` |

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
```

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

**Importación (auto-detects pip → local):**
```python
# Si g360-core está instalado via pip → from g360_core.ingestion import ...
# Si no → from core.ingestion import ...
from ui.ingestion_panel import IngestionPanel
```

El paquete pip acompañante `g360-core` se publica en PyPI:
```bash
pip install g360-core
```

### `g360-core` — Módulos principales

#### `commercial_engine.py`

Motor de lógica de negocio para clasificación documental. Única fuente de verdad para reglas comerciales.

| Función | Propósito |
|---------|-----------|
| `classify_base()` | Clasificación primaria: VENTA, DEVOLUCION, AJUSTE |
| `build_invoice_index()` | Índice de facturas para cruce de referencias |
| `resolve_document_relationships()` | Asigna SUBTIPO_AJUSTE (PRECIO_LINEA, CARGO_FIJO, SIN_BASE) |
| `calculate_prices()` | PRECIO_BASE, RECARGO_UNITARIO, PRECIO_EFECTIVO |
| `parse_referencia()` | Descompone REFERENCIA "F01/204-56287" en tipo/serie/número |

**Clasificación de documentos:**
```
TPO_DOC  CANTIDAD  CANTIDAD_FAE  → CATEGORIA_OP  SUBTIPO_AJUSTE
F01/BDI     ≠0         =           VENTA            —
NCR         ≠0         =           DEVOLUCION       —
NCR          0         ≠0          AJUSTE           PRECIO_LINEA / SIN_BASE
NDB          0         ≠0          AJUSTE           CARGO_FIJO / SIN_BASE
```

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

Audita el proyecto para compliance G360.

```bash
g360 audit [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--fix` | Auto-corregir problemas |
| `--verbose` | Salida detallada |

**Ejemplo:**

```bash
g360 audit
g360 audit ./mi-proyecto --verbose
```

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

## Plantillas

### lit-web

Plantilla Web Components con Lit.

```
mi-proyecto/
├── index.html
├── src/
│   ├── index.js
│   ├── components/
│   │   └── app-root.js
│   └── styles/
│       └── main.css
├── vite.config.js
├── package.json
└── skill.json
```

### solid-web

Plantilla con SolidJS.

```
mi-proyecto/
├── index.html
├── src/
│   ├── index.jsx
│   ├── components/
│   │   └── App.jsx
│   └── styles/
│       └── main.css
├── vite.config.js
├── package.json
└── skill.json
```

### svelte-web

Plantilla con SvelteKit.

```
mi-proyecto/
├── src/
│   ├── app.html
│   ├── app.css
│   ├── routes/
│   │   └── +page.svelte
│   └── core/
│       └── skill.json
├── svelte.config.js
├── package.json
└── skill.json
```

### web-pwa (React)

Plantilla React + Vite con PWA.

```
mi-proyecto/
├── index.html
├── app.js
├── styles.css
├── manifest.json
└── package.json
```

### python-cli

Plantilla CLI de Python con estructura argparse completa.

```
mi-cli/
├── src/
│   ├── main.py
│   └── core/
│       └── skill.json
├── requirements.txt
├── run.bat
├── build-portable.bat
└── skill.json
```

### python-flet

Plantilla GUI de escritorio con **Flet** para apps de contexto ERP.

```
mi-app/
├── src/
│   ├── main.py                  ← Punto de entrada con IngestionPanel integrado
│   ├── core/
│   │   ├── ingestion.py         ← Normalizador de datos ERP
│   │   ├── g360_theme.py        ← Tema visual G360
│   │   └── skill.json
│   ├── ui/
│   │   └── ingestion_panel.py   ← Panel Flet para carga .xls/.xlsx
│   └── export/
│       └── __init__.py
├── pyproject.toml                ← Dependencias: flet, pandas, g360-core
├── run.bat
├── build.bat
└── skill.json
```

**Normalización de datos:** La ingesta aplica transformaciones automáticas:
- Parseo de referencias (`F01/201-243065` → tipo, serie, periodo, número)
- Separación de sucursales (nombre + dirección)
- Clasificación de documentos (RUC 11 dígitos / DNI 8 dígitos)
- Normalización monetaria con auto-detección de formato SAP/Spring
- Cantidad + Cantidad FAE → cantidad_total + tipo_transaccion
- **Clasificación comercial**: VENTA / DEVOLUCION / AJUSTE con subtipos PRECIO_LINEA, CARGO_FIJO, SIN_BASE
- **Precio efectivo**: PRECIO_BASE (físico) y RECARGO_UNITARIO (financiero) separados
- Cruce de NC/NDB contra facturas referenciadas para determinar ajustes de precio por línea
- Purga de filas total/general/acumulado

### python-flet-migrate

Plantilla para migrar aplicaciones Tkinter/CTkinter a Flet.

```
mi-app/
├── src/
│   ├── main.py
│   └── migrate_tkinter.py
├── requirements.txt
└── skill.json
```

### python-customtkinter

Plantilla GUI de escritorio con **CustomTkinter** (tema oscuro moderno).

```
mi-app/
├── src/
│   ├── main.py
│   └── core/
│       └── skill.json
├── requirements.txt
├── run.bat
└── build-portable.bat
```

### vba-excel

Plantilla VBA para Excel.

```
mi-excel/
├── src/
│   ├── Module_Main.bas
│   ├── g360-datamap.bas
│   └── skill.json
└── skill.json
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

### Ejemplos de uso

```bash
# Al crear proyecto
g360 init mi-proyecto --skill corporativo-movil

# Cambiar skill después
g360 set-skill moderno

# Ver skills disponibles
g360 list skills
```

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
├── src/
│   ├── cli.js           # Entrada principal CLI
│   ├── commands/         # Comandos (init, bring, audit, etc.)
│   ├── lib/             # Utilidades (assets, auditor, config)
│   └── assets/          # Assets embebidos
│       ├── templates/    # Plantillas de proyecto
│       ├── components/   # Componentes G360
│       ├── ingestion/    # Módulo de ingesta ERP (bring)
│       ├── engine/      # G360 Engine
│       └── config/      # Configuraciones
├── py/                  # Paquete Python publicable en PyPI
│   ├── pyproject.toml   # g360-core
│   └── src/g360_core/   # commercial_engine.py, pipeline.py, processor.py, batch_processor.py, utils.py
├── package.json
├── README.md
└── LICENSE
```

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Build portable con pkg (g360.exe) |
| `npm run build:portable` | Especificar target node18-win-x64 |
| `npm test` | Ejecutar tests con Vitest (51 tests, 7 suites) |
| `npm run prepublishOnly` | Validación antes de publicar en npm |

---

## Testing

```bash
npm test            # Vitest — 51 tests, 8 suites
npm run test:watch  # Modo watch
npm run test:ui     # UI interactiva
npm run test:coverage
```

**Cobertura actual (v1.9.0):**
- `commands/`: init, bring, list, audit, set-skill
- `lib/`: manifest, validator, asset-validator
- **51 passing / 1 timeout** (init.test.js requiere import pesado de inquirer)

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

## Integración con OpenCode

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

## Enlaces

- [npm](https://www.npmjs.com/package/g360-cli)
- [GitHub](https://github.com/carloscus/g360-cli)
- [Documentación](#)
- [Reportar Issue](https://github.com/carloscus/g360-cli/issues)

---
**Marca**: G360
**Isotipo**: 3 puntos verticales paralelos (gris-verde-gris) + chevron `>`
**Autor**: Carlos Cusi
**Desarrollo**: Con asistencia de herramientas de código IA (Vibe Code)
**Powered by**: [g360-signature](https://github.com/carloscus/g360-signature)
