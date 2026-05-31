# G360 Python Flet Desktop App

## Estructura del Proyecto

```
mi-proyecto/
├── src/
│   ├── main.py              # Entry point: ft.run(main)
│   ├── test_app.py          # Tests con pytest
│   ├── core/
│   │   ├── __init__.py
│   │   ├── skill.json       # Configuracion del skill G360
│   │   └── g360_theme.py    # Theme engine (lee colores de skill.json)
│   ├── ui/
│   │   └── __init__.py      # Componentes Flet (PascalCase)
│   └── export/
│       └── __init__.py      # Reportes Excel (openpyxl)
├── assets/
│   └── images/
│       └── app.ico          # Icono de la app
├── skill.json               # Skill G360 aplicado (copia en raiz)
├── requirements.txt
├── run.bat                  # Ejecutar con uv (crea .venv auto)
├── build-portable.bat       # Build EXE standalone (PyInstaller)
├── create_shortcut.vbs      # Crear acceso directo en escritorio
└── README.md
```

## Requisitos Minimos

- **PC destino**: Windows 10/11 x64
- **Recomendado**: Tener [uv](https://github.com/astral-sh/uv) instalado
- **Si no tiene Python**: `run.bat` lo instala automaticamente via uv
- **VC++ Redist**: Necesario para Flet en Windows (auto-detectado por `run.bat`)

## Ejecucion

### Con uv (recomendado)
```bash
run.bat
```

Esto:
1. Detecta/instala uv
2. Detecta/instala Python 3.11 via uv
3. Crea `.venv` con dependencias
4. Crea acceso directo en escritorio
5. Ejecuta la app

### Manual
```bash
uv venv --python 3.11
uv sync
uv run python src/main.py
```

## Build Portable (EXE standalone)

### Para PCs SIN Python
```bash
build-portable.bat
```

Esto genera `dist/G360-App.exe` que funciona en cualquier PC con Windows
sin necesidad de Python. Solo requiere VC++ Redist (lo detecta/instala).

## Theme y Colores

Los colores se definen en `src/core/skill.json` y se cargan via `G360Theme`.
**Nunca hardcodear colores** - usar siempre `self.theme.accent`, `self.theme.surface`, etc.

### Paleta G360 (flet-desktop)
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

## Tests

```bash
pytest src/test_app.py -v
pytest src/test_app.py --cov=src --cov-report=html
```

## Skills Disponibles

- `flet-desktop` - Estilo G360 moderno para desktop
- `flet-desktop-corporativo` - Estilo corporativo para clientes

## Snippets Flet

Usa los snippets de G360 para componentes rapidos:
- `flet-page` - Configuracion de pagina con tema
- `flet-card` - Tarjetas con estilo G360
- `flet-button` - Botones G360
- `flet-kpi-card` - Card de KPI para dashboards
- `flet-drop-zone` - Zona de carga de archivos
- `flet-datatable` - Tablas de datos
- `flet-chart-bar` - Graficos de barras
- `flet-chart-line` - Graficos de lineas (series temporales)
- `flet-dialog` - Dialogos modales
- `flet-progress-bar` - Barra de progreso
- `flet-search-field` - Campo de busqueda
- `flet-tabs` - Tabs para vistas multiples
- `flet-export-menu` - Menu de exportacion

## Notas del Build Portable

- Ejecutable generado con **PyInstaller** (onefile, windowed)
- Incluye runtime de Python completo
- Tamano aproximado: 50-80 MB
- Funciona en Windows 10/11 sin dependencias de Python
- Requiere **VC++ Redistributable** en PC destino (instalado por `build-portable.bat` si es necesario)
- El icono se personaliza en `assets/images/app.ico`

## Distribucion a Clientes

### Opcion 1: EXE standalone (PC sin Python)
Entregar solo `dist/G360-App.exe`

### Opcion 2: Con run.bat (PC con uv)
Entregar todo el proyecto. El usuario ejecuta `run.bat`.

### Opcion 3: híbrido
Carpeta portable con `run.bat` + `dist/G360-App.exe` + `create_shortcut.vbs`

## Lineamientos de Arquitectura

1. **src/core/**: NO importa `flet`. Solo logica de negocio (Pandas, calculos)
2. **src/ui/**: Importa `flet` y `core`. Solo presentacion
3. **src/export/**: Importa `openpyxl` y `core`. Solo generacion de archivos
4. **Threading**: Usar `threading.Thread` + `page.run_thread()` para operaciones bloqueantes
5. **Estado**: Atributos de clase. Evitar variables globales
6. **Colores**: Siempre via `G360Theme`. Nunca hardcodear