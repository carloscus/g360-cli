# G360-CLI Skill para OpenCode

Este skill proporciona acceso a los recursos de g360-cli para desarrollo asistido por IA en OpenCode.

## Descripción

El skill G360-CLI permite a OpenCode acceder a:
- Skills de identidad visual G360
- Snippets de código reutilizables
- Plantillas de proyecto estandarizadas
- Componentes G360 predefinidos
- Convenciones de desarrollo del ecosistema G360

## Recursos Disponibles

### Skills de Identidad Visual

Los skills definen el estilo visual, dispositivo y signature del proyecto:

- **corporativo** - Proyectos para clientes - estilo corporativo conservador (PC)
- **corporativo-movil** - Proyectos para clientes - estilo corporativo - enfoque móvil
- **corporativo-g360** - Proyectos para clientes con colores G360 vibrantes (PC)
- **corporativo-g360-movil** - Proyectos para clientes con colores G360 - enfoque móvil
- **moderno** - Herramientas propias G360 - estilo innovador (PC)
- **moderno-movil** - Herramientas propias G360 - estilo innovador (móvil)
- **minimalista** - Proyectos minimalistas - scripts, CLI, Python
- **custom** - Configuración personalizada - colores ajustables
- **flet-desktop** - Aplicaciones de escritorio Flet - estilo moderno G360 (PC)
- **flet-desktop-corporativo** - Aplicaciones Flet para clientes - estilo corporativo conservador

### Snippets de Código

#### Python CLI
- `cli-argparse-basic` - Basic argparse CLI structure
- `cli-subcommands` - CLI with subcommands (git-style)
- `cli-logging` - Logging setup for CLI
- `cli-config-json` - Load JSON config file
- `cli-progress-bar` - Progress bar with tqdm
- `cli-env-config` - Environment-based configuration
- `cli-exit-codes` - Exit codes constants

#### Web Components
- `g360-header` - Standard G360 header
- `g360-button` - G360 styled button
- `g360-card` - G360 card component
- `g360-badge` - G360 status badge

#### Flet Components
- `flet-page` - Flet page setup with G360 theme
- `flet-card` - G360 styled Flet Card
- `flet-button` - G360 styled Flet Button
- `flet-nav-rail` - Flet navigation rail for desktop
- `flet-datatable` - Flet DataTable with G360 styling
- `flet-dialog` - Flet modal dialog
- `flet-chart-bar` - Flet bar chart for data visualization
- `flet-chart-line` - LineChart for time series data
- `flet-kpi-card` - Reusable KPI card for dashboards
- `flet-drop-zone` - File upload zone with FilePicker
- `flet-progress-bar` - Styled progress bar for loading states
- `flet-search-field` - Search field with icon
- `flet-tabs` - Tabs for multi-view layouts
- `flet-tooltip` - Rich tooltip on hover
- `flet-pagination` - Pagination control for large tables
- `flet-export-menu` - Export dropdown with PopupMenuButton

#### Pandas / Data Processing
- `pandas-groupby-agg` - Data aggregation with groupby and agg
- `pandas-nc-normalize` - Normalize Notas de Credito from ERP data
- `pandas-calculate-kpi` - Calculate derived KPIs from data
- `pandas-date-range` - Filter DataFrame by date range
- `pandas-gap-analysis` - Gap analysis between catalog and purchases
- `pandas-temporal-compare` - Temporal comparison A vs B period
- `pandas-hhi-index` - Calculate Herfindahl-Hirschman Index

#### Excel / Openpyxl
- `openpyxl-workbook` - Create Excel workbook with G360 styling
- `openpyxl-styled-table` - Write styled table to Excel sheet
- `openpyxl-kpi-sheet` - Create KPI summary sheet with formatting
- `openpyxl-multi-sheet` - Create multi-sheet Excel report

### Plantillas de Proyecto

- **web-pwa** - Progressive Web App with offline support
- **svelte-web** - Svelte web application
- **solid-web** - SolidJS web application
- **lit-web** - Lit web application
- **python-cli** - Python command-line tool
- **python-flet** - Python desktop app with Flet framework
- **python-flet-migrate** - Migrate tkinter/ctkinter app to Flet
- **python-customtkinter** - Python desktop app with CustomTkinter

### Componentes G360

- **g360-signature** - Firma G360 para proyectos web (Web Component)
- **G360DragModal** - Modal draggable para interfaces

## Convenciones de Desarrollo

### Frameworks y Tecnologías

- **SolidJS**: Usa signals y memos en lugar de React hooks
- **File Extensions**: `.jsx` para componentes, `.js` para utilities
- **Imports**: ES6 modules, relative paths preferidos
- **Naming**: camelCase para funciones/variables, PascalCase para componentes, kebab-case para CSS classes
- **Exports**: Both named y default exports para componentes

### Flet Desktop

#### Arquitectura Estandar
```
proyecto-flet/
├── src/
│   ├── core/          # Motor de datos (sin imports de flet)
│   │   ├── g360_theme.py  # Tema G360 (lee de skill.json)
│   │   └── processor.py   # Logica de negocio
│   ├── ui/            # Componentes de interfaz Flet
│   │   └── main_app.py    # Clase principal
│   └── export/        # Generacion de reportes (openpyxl)
│       └── generator.py
├── assets/            # Imagenes, iconos, templates Excel
├── skill.json         # Skill G360 aplicado
├── run.bat            # Ejecutar con uv (crea .venv auto)
├── build-portable.bat # Build EXE standalone con PyInstaller
└── requirements.txt   # Dependencias
```

#### Convenciones de Nombres
| Elemento | Convencion | Ejemplo |
|---|---|---|
| Clases UI | PascalCase | `G360App`, `DropZone` |
| Clases Core | PascalCase | `G360Theme`, `Processor` |
| Metodos | camelCase | `_setup_page()`, `_build_ui()` |
| Variables | snake_case | `venta_bruta`, `df_processed` |
| Archivos | snake_case | `main_app.py`, `g360_theme.py` |
| Constantes | UPPER_SNAKE_CASE | `G360_ACCENT`, `DEVOLUCION_THRESHOLD` |

#### Theme Colors (skill flet-desktop)
| Token | Color | Uso |
|---|---|---|
| `bg` | `#0b1220` | Fondo principal |
| `surface` | `#1a2332` | Cards, contenedores |
| `accent` | `#00d084` | Verde G360 primary |
| `text` | `#f0f4f8` | Texto principal |
| `muted` | `#94a3b8` | Texto secundario |
| `success` | `#22c55e` | Exito/positivo |
| `warning` | `#f59e0b` | Advertencia |
| `error` | `#ef4444` | Error/peligro |

Los colores se leen desde `skill.json` via `G360Theme` - **nunca hardcodear**.

Ver `AGENTS-UIUX.md` para:
- Patrones de componente por framework (Flet, React, Solid, Svelte, Lit)
- Convenciones de nomenclatura y estructura de archivos
- Threading, loading states, responsive design
- Checklist de calidad UI/UX

#### Build Portable
- **Herramienta**: PyInstaller (onefile, windowed)
- **Requisito**: VC++ Redistributable en PC destino
- **Script**: `build-portable.bat` (auto-detecta/instala uv, Python, VC++ Redist)
- **Output**: `dist/G360-App.exe` (~50-80 MB)
- **PC limpias**: `run.bat` instala uv → Python 3.12 → .venv → dependencias automaticamente

### Formato y Estilo

- **Indentation**: 2 espacios
- **Line Length**: 100 caracteres máximo
- **Quotes**: Single quotes para JavaScript, double para JSX attributes
- **Semicolons**: Requeridos
- **Trailing Commas**: Requeridos en multi-line objects/arrays

### Organización de Imports

```javascript
// 1. SolidJS imports
import { createSignal, createMemo, onMount } from 'solid-js';

// 2. External libraries
import { utils, writeFile } from 'xlsx';

// 3. Internal modules (relative imports)
import { formatCurrency } from '../utils/formatters';
import ProductTable from '../components/ProductTable';

// 4. Styles (at bottom)
import './App.css';
```

### Manejo de Errores

- Usa try-catch para operaciones async
- Proporciona mensajes de error significativos
- Log errores con contexto
- Fallbacks graciosos para errores visibles al usuario

### Performance

- Usa `createMemo` para computaciones costosas
- Evita re-renders innecesarios con proper dependency tracking
- Usa `For` component para listas en lugar de map
- Lazy load componentes pesados cuando sea posible

### Formato de Moneda y Números

- **Locale**: es-PE (Peruvian Spanish)
- **Currency**: S/ para Peruvian Soles
- **Numbers**: Thousands separator comma, decimal point

### Codificación de Colores

- **Stock Status**: Red para agotado, Yellow para bajo stock, Green para disponible
- **G360 Theme**: #00d084 primary, glassmorphism effects

### Nombres de Archivos

- Components: PascalCase (ProductTable.jsx)
- Utilities: camelCase (formatCurrency.js)
- Tests: mismo nombre con extensión .test.js
- Styles: kebab-case (.btn-primary)

## Comandos g360-cli Disponibles

### Inicialización de Proyectos

```bash
# Inicializar nuevo proyecto
g360 init <nombre> [opciones]

# Opciones:
# -t, --template <tipo>     Tipo de plantilla (default: web-pwa)
# -s, --skill <skill>       Skill a usar (default: corporativo-movil)
# -d, --dir <ruta>          Directorio destino (default: .)
# --dry-run                 Previsualizar sin crear
# --force                   Sobrescribir existente
```

### Gestión de Skills

```bash
# Cambiar skill del proyecto actual
g360 set-skill <skill> [opciones]

# Opciones:
# --verbose    Mostrar detalles
# --force      Sobrescribir skill existente
```

### Gestión de Assets

```bash
# Traer assets G360 al proyecto actual
g360 bring [asset] [opciones]

# Opciones:
# -p, --path <ruta>    Ruta destino
# --dry-run            Previsualizar
# --force              Sobrescribir

# Assets disponibles:
#   brand               Assets de marca (SVGs, logos, iconos)
#   brand/cipsa         Aplica marca CIPSA + actualiza skill.json
#   brand/g360          Aplica marca G360 + actualiza skill.json
#   components          Componentes UI reutilizables
#   templates           Plantillas de proyecto
#   skills              Skills de identidad visual
#   all                 Todo

# Ejemplo: aplicar marca CIPSA a proyecto existente
#   g360 bring brand/cipsa
#   -> Copia assets a g360/brand/cipsa/
#   -> Actualiza skill.json con logo, signature y colores
```

### Listado de Recursos

```bash
# Listar assets disponibles
g360 list [tipo] [opciones]

# Tipos:
# templates    Lista de plantillas
# components   Lista de componentes
# skills       Lista de skills
# snippets     Lista de snippets
# all          Todo (por defecto)

# Opciones:
# --json       Salida JSON
```

### Auditoría y Limpieza

```bash
# Auditar proyecto para compliance G360
g360 audit [ruta] [opciones]

# Opciones:
# --fix        Auto-corregir problemas
# --verbose    Salida detallada

# Limpiar código muerto, duplicados y archivos huérfanos
g360 clean [ruta] [opciones]

# Opciones:
# --dry-run        Previsualizar archivos
# --force          Omitir confirmación
# --dead           Eliminar archivos muertos/descontinuados
# --duplicates     Eliminar archivos duplicados
# --orphans        Eliminar archivos huérfanos
# --organize       Mostrar archivos descolocados
# --all            Ejecutar todas las verificaciones
```

### Conversión de Proyectos

```bash
# Convertir proyecto existente a identidad G360
g360 convert [ruta] [opciones]

# Opciones:
# -s, --skill <skill>    Skill a aplicar (default: corporativo-movil)
# --dry-run              Previsualizar sin aplicar
# --restructure          Reestructurar archivos
# --force                Forzar cambios peligrosos
# --backup               Crear backup antes
```

### Firma G360

```bash
# Instalar componente de firma oficial G360
g360 signature install [opciones]

# Opciones:
# -p, --path <ruta>    Ruta al index.html (default: .)
# --force              Reinstalar si ya existe
```

## Integración con OpenCode

### Uso del Skill

Cuando este skill está activo en OpenCode, el asistente de IA puede:

1. **Recomendar skills apropiados** basándose en el tipo de proyecto
2. **Sugerir snippets** relevantes para el contexto de desarrollo
3. **Aplicar convenciones** del ecosistema G360 automáticamente
4. **Generar código** siguiendo los patrones G360
5. **Validar compliance** con los estándares G360

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

#### Aplicar Skill

```
Usuario: "Este proyecto necesita identidad G360"
OpenCode: "Puedo convertir el proyecto actual usando g360 convert con el skill apropiado. 
¿Qué skill prefieres: corporativo, moderno, o flet-desktop?"
```

#### Validar Compliance

```
Usuario: "Verifica si este proyecto cumple con los estándares G360"
OpenCode: "Ejecutaré g360 audit para verificar compliance y te reportaré cualquier problema encontrado."
```

## Configuración del Skill

### Ruta de Recursos

Los recursos de g360-cli se encuentran en:

```
C:\Users\ccusi\Documents\Proyect_Coder\G360-ecosystem\projects\g360-cli\src\assets\
├── config/
│   ├── g360-skills.json    # Skills disponibles
│   ├── skills.json          # Skills base
│   └── project-types.json   # Tipos de proyecto
├── snippets/
│   └── snippets.json       # Snippets de código
├── templates/               # Plantillas de proyecto
├── components/              # Componentes reutilizables
└── engine/                  # Motor de procesamiento
```

### Comandos de Ejecución

```bash
# Desde el directorio del repo g360-cli
cd "C:\Users\ccusi\Documents\Proyect_Coder\G360-ecosystem\projects\g360-cli"

# Ejecutar comandos g360
node src/cli.js <comando> [opciones]
```

## Actualización del Skill

Para mantener este skill actualizado:

1. **Sincronizar con g360-cli**: Actualizar este archivo cuando se agreguen nuevos skills o snippets
2. **Validar comandos**: Verificar que los comandos de g360-cli funcionen correctamente
3. **Documentar cambios**: Agregar nuevas funcionalidades a la documentación
4. **Testing**: Probar las integraciones con OpenCode regularmente

## Referencias

- **g360-cli README**: Documentación completa de g360-cli
- **AGENTS.md**: Guías de desarrollo para agentes en el ecosistema G360
- **AGENTS-UIUX.md**: Lineamientos UI/UX por framework (Flet, React, Solid, Svelte, Lit)
- **FLET-DESKTOP-FEEDBACK.md**: Lecciones aprendidas de apps Flet reales
- **G360 Ecosystem**: Documentación del ecosistema G360

## Notas

- Este skill está diseñado para funcionar con OpenCode y proporcionar contexto sobre el ecosistema G360
- Los recursos de g360-cli están disponibles localmente en el repo del proyecto
- Para usar los comandos de g360-cli, asegúrate de estar en el directorio correcto
- Los skills y snippets pueden ser personalizados según las necesidades del proyecto