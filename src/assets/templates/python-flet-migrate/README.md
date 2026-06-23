# G360 Python Flet Migration App

Template para migrar aplicaciones de **tkinter/CustomTkinter a Flet** con el ecosistema G360.

## Estructura del Proyecto

```
mi-proyecto/
├── src/
│   ├── main.py              # Entry point: ft.run(main)
│   ├── migrate_tkinter.py   # Asistente de migracion
│   ├── core/
│   │   ├── skill.json       # Configuracion del skill G360
│   │   └── g360_theme.py    # Theme engine
├── assets/
│   └── images/
├── skill.json               # Skill G360 aplicado
├── pyproject.toml           # Dependencias
├── run.bat                  # Ejecutar app
├── build.bat                # Build EXE standalone
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
| tkinter | Flet |
|---------|------|
| `tk.Button` | `ft.ElevatedButton` |
| `tk.Entry` | `ft.TextField` |
| `tk.Label` | `ft.Text` |
| `tk.Frame` | `ft.Container` |
| `ttk.Treeview` | `ft.DataTable` |
| `messagebox` | `ft.AlertDialog` |

### Paso 3: Aplicar tema G360
```python
class MigratedApp:
    def __init__(self, page: ft.Page):
        self.theme = G360Theme()
        self.page = page
        self._setup_page()
    
    def _setup_page(self):
        self.page.title = self.theme.build_name()
        self.page.theme_mode = ft.ThemeMode.DARK
        self.page.bgcolor = self.theme.bg
```

## Ejecucion

```bash
run.bat
```

## Build Windows

```bash
build.bat
```
