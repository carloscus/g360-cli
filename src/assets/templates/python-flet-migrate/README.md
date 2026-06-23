# G360 Python Flet Migration App

Template para migrar aplicaciones de **tkinter/CustomTkinter a Flet** con el ecosistema G360.

## Estructura del Proyecto

```
mi-proyecto/
├── src/
│   ├── main.py              # Entry point: ft.run(main)
│   ├── migrate_tkinter.py   # Asistente de migracion
│   ├── core/
│   │   ├── __init__.py
│   │   ├── skill.json       # Configuracion del skill G360
│   │   └── g360_theme.py    # Theme engine (lee colores de skill.json)
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

## Migracion de tkinter/CustomTkinter

### Paso 1: Reemplazar imports
```python
# Antes (tkinter)
import tkinter as tk
from tkinter import ttk, messagebox

# Despues (Flet)
import flet as ft
```

### Paso 2: Convertir widgets
| tkinter | Flet | Descripcion |
|---------|------|-------------|
| `tk.Button` | `ft.ElevatedButton` | Boton con estilo |
| `tk.Entry` | `ft.TextField` | Campo de texto |
| `tk.Label` | `ft.Text` | Texto |
| `tk.Frame` | `ft.Container` | Contenedor |
| `ttk.Treeview` | `ft.DataTable` | Tabla de datos |
| `tkinter.messagebox` | `ft.AlertDialog` | Dialogos |

### Paso 3: Aplicar tema G360
```python
class MigratedApp:
    def __init__(self, page: ft.Page):
        self.theme = G360Theme()
        self.page = page
        self._setup_page()
        self._build_ui()
    
    def _setup_page(self):
        self.page.title = self.theme.build_name()
        self.page.theme_mode = ft.ThemeMode.DARK
        self.page.bgcolor = self.theme.bg
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

### Manual
```bash
uv venv --python 3.11
uv sync
uv run python src/main.py
```

## Build Portable (EXE standalone)

```bash
build-portable.bat
```

Genera `dist/G360-App.exe` que funciona en cualquier PC sin Python.

## Theme y Colores

Los colores se definen en `src/core/skill.json` y se cargan via `G360Theme`.

### Paleta G360
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

## Snippets Flet Disponibles

- `flet-page` - Configuracion de pagina con tema
- `flet-card` - Tarjetas con estilo G360
- `flet-button` - Botones G360
- `flet-datatable` - Tablas de datos
- `flet-dialog` - Dialogos modales
- `flet-kpi-card` - Card de KPI para dashboards
- `flet-drop-zone` - Zona de carga de archivos
- `flet-loading-overlay` - Overlay de carga
- `flet-footer-signature` - Footer con branding G360

## Lineamientos de Arquitectura

1. **src/core/**: NO importa `flet`. Solo logica de negocio
2. **Threading**: Usar `threading.Thread` para operaciones bloqueantes
3. **Estado**: Atributos de clase. Evitar variables globales
4. **Colores**: Siempre via `G360Theme`. Nunca hardcodear
