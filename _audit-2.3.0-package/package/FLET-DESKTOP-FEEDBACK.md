# G360-CLI - Retroalimentacion: Lineamientos para Flet Desktop

## Contexto
Este documento surge del desarrollo de **g360-insight-lens**, la primera aplicacion Flet Desktop completa del ecosistema G360. Contiene lecciones aprendidas, gaps identificados y recomendaciones para mejorar g360-cli y sus lineamientos para proyectos Flet Desktop.

---

## 1. Skills Flet Desktop - Mejoras Necesarias

### 1.1 Skill `flet-desktop` actual
**Estado actual:** Define colores, efectos y signature. Es funcional pero basico.

**Lo que falta:**
- **Lineamientos de arquitectura**: No hay guia sobre como estructurar un proyecto Flet (src/core, src/ui, src/export)
- **Convenciones de nombres**: No se especifica naming para clases Flet (PascalCase para componentes, camelCase para metodos)
- **Patrones de diseno**: No hay guia sobre patrones recomendados (MVC, MVVM, state management)
- **Manejo de threading**: Flet requiere threading para operaciones bloqueantes - no hay snippet ni guia
- **Configuracion de ventana**: No hay snippet para configuracion estandar de ventana (tamaño, resizable, icon)

**Recomendacion:** Agregar seccion `guidelines` al skill `flet-desktop`:
```json
{
  "guidelines": {
    "architecture": "src/core (logica), src/ui (componentes), src/export (reportes)",
    "naming": "PascalCase para clases UI, camelCase para metodos y variables",
    "state_management": "Usar atributos de clase para estado, evitar globales",
    "threading": "Usar threading.Thread + page.run_thread para operaciones bloqueantes",
    "window_config": "width=1350, height=900, resizable=True, theme_mode=DARK"
  }
}
```

### 1.2 Nuevo skill recomendado: `flet-desktop-analytics`
**Justificacion:** Las apps de analisis de datos (como Insight Lens) tienen necesidades especificas:
- Integracion con Pandas/NumPy
- Generacion de reportes Excel
- Visualizacion de datos (charts)
- Carga de archivos grandes
- Modo supervisor vs asistente

**Configuracion sugerida:**
```json
{
  "name": "flet-desktop-analytics",
  "description": "Apps Flet para analisis de datos ERP con Pandas",
  "device": "pc",
  "framework": "flet",
  "dependencies": ["flet", "pandas", "openpyxl", "numpy", "matplotlib"],
  "portable": true,
  "capabilities": ["data-processing", "excel-export", "charts", "file-upload"]
}
```

---

## 2. Snippets Flet - Gaps Identificados

### 2.1 Snippets existentes (7)
Los snippets actuales cubren lo basico: page, card, button, nav-rail, datatable, dialog, chart-bar.

### 2.2 Snippets faltantes (identificados en desarrollo real)

| Snippet | Descripcion | Prioridad |
|---|---|---|
| `flet-chart-line` | LineChart para series temporales | ALTA |
| `flet-kpi-card` | Card reutilizable para dashboards | ALTA |
| `flet-drop-zone` | Zona de carga con FilePicker | ALTA |
| `flet-progress-bar` | Barra de progreso estilizada | MEDIA |
| `flet-search-field` | Campo de busqueda con icono | MEDIA |
| `flet-tabs` | Tabs para vistas multiples | MEDIA |
| `flet-tooltip` | Tooltip enriquecido | BAJA |
| `flet-pagination` | Paginacion para tablas grandes | ALTA |
| `flet-export-menu` | Menu de export con PopupMenuButton | ALTA |

### 2.3 Snippets de Pandas/Data Processing (CRITICO)
No existen snippets para el motor de datos. Esto es fundamental para apps analytics:

| Snippet | Descripcion |
|---|---|
| `pandas-groupby-agg` | Agregacion con groupby y agg |
| `pandas-nc-normalize` | Normalizacion de Notas de Credito |
| `pandas-calculate-kpi` | Calculo de KPIs derivados |
| `pandas-date-range` | Filtrado por rango de fechas |
| `pandas-gap-analysis` | Analisis de gap (catalogo vs compras) |
| `pandas-temporal-compare` | Comparador temporal A vs B |
| `pandas-hhi-index` | Calculo de indice HHI |

### 2.4 Snippets de Export Excel (CRITICO)
| Snippet | Descripcion |
|---|---|
| `openpyxl-workbook` | Crear workbook con formato G360 |
| `openpyxl-styled-table` | Tabla con headers estilizados |
| `openpyxl-kpi-sheet` | Sheet de KPIs con formato |
| `openpyxl-multi-sheet` | Workbook con multiples sheets |

---

## 3. Lineamientos de Arquitectura Flet Desktop

### 3.1 Estructura de Proyecto Estandar
```
proyecto-flet/
├── main.py                    # Entry point: ft.app(target=main)
├── pyproject.toml             # Dependencias con uv
├── .python-version            # Version de Python
├── skill.json                 # Skill G360 aplicado
├── src/
│   ├── __init__.py
│   ├── core/                  # Motor de datos (sin dependencias de UI)
│   │   ├── __init__.py
│   │   ├── processor.py       # Clase principal de procesamiento
│   │   ├── match_engine.py    # Motores de cruce/match
│   │   └── utils.py           # Funciones utilitarias
│   ├── ui/                    # Componentes de interfaz
│   │   ├── __init__.py
│   │   ├── main_app.py        # Clase principal de la app
│   │   ├── sidebar.py         # NavigationRail
│   │   ├── drop_zone.py       # Componente de carga
│   │   └── preview_table.py   # Tabla de vista previa
│   └── export/                # Generacion de reportes
│       ├── __init__.py
│       └── generator.py       # Clase de generacion Excel
├── assets/
│   ├── images/                # Logos, iconos, favicons
│   └── templates/             # Plantillas Excel
└── g360/                      # Configuracion G360
    ├── skills/
    ├── snippets/
    └── config/
```

### 3.2 Convenciones de Nombres
| Elemento | Convencion | Ejemplo |
|---|---|---|
| Clases UI | PascalCase | `InsightLensApp`, `DropZone` |
| Clases Core | PascalCase | `InsightProcessor`, `MatchEngine` |
| Metodos | camelCase | `_process()`, `get_resumen_por_linea()` |
| Variables | snake_case | `venta_bruta`, `df_processed` |
| Archivos | snake_case | `main_app.py`, `processor.py` |
| Constantes | UPPER_SNAKE_CASE | `G360_ACCENT`, `DEVOLUCION_THRESHOLD` |

### 3.3 Patrones de Diseno Recomendados

**Pattern 1: Clase App con inicializacion en 3 pasos**
```python
class MiApp:
    def __init__(self, page: ft.Page):
        self.page = page
        self.colors = {...}  # Definir colores primero
        self._setup_page()   # Configurar ventana
        self._init_components()  # Crear componentes
        self._build_ui()     # Construir layout
```

**Pattern 2: Threading para operaciones bloqueantes**
```python
def _on_file_loaded(self, path: str, name: str):
    self.progress.visible = True
    self.page.update()

    def load_task():
        try:
            df = pd.read_excel(path, dtype=str)
            self.processor = InsightProcessor(df)
            self.page.run_thread(self._update_ui_after_load, name)
        except Exception as ex:
            self.page.run_thread(self._show_error, str(ex))

    threading.Thread(target=load_task, daemon=True).start()
```

**Pattern 3: Separacion Core/UI**
- `src/core/`: NO importa flet. Solo Pandas, logica de negocio
- `src/ui/`: Importa flet y core. Solo presentacion
- `src/export/`: Importa openpyxl y core. Solo generacion de archivos

### 3.4 Configuracion Estandar de Ventana
```python
def _setup_page(self):
    self.page.title = "G360 App Name"
    self.page.window_width = 1350
    self.page.window_height = 900
    self.page.theme_mode = ft.ThemeMode.DARK
    self.page.bgcolor = self.colors["bg"]  # #0b1220
    self.page.padding = 0
    self.page.window_resizable = True
```

### 3.5 Paleta de Colores Estandar (skill flet-desktop)
```python
colors = {
    "accent": "#00d084",    # G360 primary
    "success": "#22c55e",   # Verde para exitos
    "warning": "#fbbf24",   # Amarillo para alertas
    "error": "#f87171",     # Rojo para errores
    "surface": "#1a2333",   # Fondo de cards
    "bg_dark": "#0b1220",   # Fondo principal
    "border": "white12",    # Bordes sutiles
    "text_muted": "white38",# Texto secundario
    "text_primary": "white70", # Texto principal
}
```

---

## 4. Agentes de g360-cli - Implementaciones Faltantes

### 4.1 Skill `python-calculations`
**Estado:** Definido en skills.json pero sin archivos de implementacion.

**Deberia incluir:**
- Guia de calculos con Pandas para datos ERP
- Snippets de agregacion, groupby, KPIs
- Validacion de resultados numericos
- Comparacion de periodos

### 4.2 Skill `python-desktop`
**Estado:** Definido con capacidades pero sin archivos.

**Deberia incluir:**
- Guia de arquitectura Flet Desktop
- Snippets de componentes UI
- Patrones de threading
- Configuracion de version portable (PyInstaller/Nuitka)

### 4.3 Nuevo skill recomendado: `flet-validation`
Para validar que una app Flet cumple con los estandares G360:
- Verifica estructura de directorios
- Verifica uso de colores G360
- Verifica separacion Core/UI
- Verifica manejo de errores
- Verifica threading en operaciones bloqueantes

---

## 5. Comandos g360-cli - Mejoras para Flet

### 5.1 `g360 init` con template `python-flet`
**Problema actual:** El template `python-flet` no existe en `src/assets/templates/`.

**Recomendacion:** Crear template basico con:
- main.py con estructura estandar
- pyproject.toml con dependencias
- Estructura src/core, src/ui, src/export
- skill.json pre-configurado

### 5.2 Nuevo comando: `g360 flet-run`
```bash
g360 flet-run [--portable]
```
- Ejecuta la app Flet con el virtual environment correcto
- Si `--portable`, genera ejecutable con PyInstaller

### 5.3 Nuevo comando: `g360 flet-audit`
```bash
g360 flet-audit [ruta]
```
- Verifica que la app sigue lineamientos G360 para Flet
- Reporta problemas de arquitectura, colores, naming

### 5.4 Nuevo comando: `g360 bring flet-snippets`
```bash
g360 bring flet-snippets
```
- Copia snippets de Flet al directorio g360/snippets del proyecto

---

## 6. Version Portable - Lineamientos

### 6.1 Herramientas Recomendadas
| Herramienta | Ventajas | Desventajas |
|---|---|---|
| **PyInstaller** | Facil de usar, soporta Flet | Ejecutable grande (~100MB) |
| **Nuitka** | Mas rapido, mejor optimizacion | Compilacion mas lenta |
| **cx_Freeze** | Bueno para Windows | Menos documentado |

### 6.2 Script de Build Estandar (`build-portable.bat`)
```batch
@echo off
echo Building G360 Portable App...
pyinstaller --onefile --windowed --name "G360-App" ^
    --add-data "assets;assets" ^
    --add-data "g360;g360" ^
    --icon "assets/images/favicon.ico" ^
    main.py
echo Build complete! Check dist/ folder.
pause
```

### 6.3 Consideraciones para Portable
- Usar `sys.executable` para rutas en modo ejecutable
- Incluir `sys.frozen` check para detectar modo portable
- Empaquetar assets y templates dentro del ejecutable
- Configurar `BASE_DIR` correctamente para ambos modos

---

## 7. Checklist de Calidad para Apps Flet G360

### 7.1 Arquitectura
- [ ] Separacion clara entre Core (logica) y UI (presentacion)
- [ ] No hay imports de flet en src/core/
- [ ] No hay imports de pandas en src/ui/ (solo en core)
- [ ] Estructura de directorios sigue estandar G360

### 7.2 UI/UX
- [ ] Usa colores del skill.json (no hardcodeados)
- [ ] Tema oscuro con bg #0b1220
- [ ] Logo G360 en top bar y/o sidebar
- [ ] Firma G360 en footer
- [ ] Operaciones bloqueantes usan threading
- [ ] Feedback visual durante carga (progress bar)
- [ ] Manejo de errores con mensajes al usuario

### 7.3 Datos
- [ ] Processor tiene docstrings detallados
- [ ] Calculos de KPIs verificados con tests
- [ ] Manejo de valores nulos/NaN en Pandas
- [ ] Proteccion contra division por cero
- [ ] Normalizacion de NC implementada

### 7.4 Export
- [ ] Reportes Excel con formato G360 (headers verdes)
- [ ] Nombre de archivo automatico con timestamp
- [ ] Export a Desktop por defecto
- [ ] Apertura automatica del archivo generado

---

## 8. Resumen de Acciones para g360-cli

### Prioridad ALTA
1. Crear template `python-flet` en `src/assets/templates/`
2. Implementar skill `python-calculations` con archivos de guia
3. Agregar snippets de Pandas y Openpyxl
4. Agregar snippets Flet faltantes (line chart, KPI card, drop zone)
5. Crear comando `g360 flet-audit`

### Prioridad MEDIA
6. Crear skill `flet-desktop-analytics`
7. Implementar skill `python-desktop` con archivos de guia
8. Crear comando `g360 flet-run`
9. Agregar script `build-portable.bat` al template
10. Crear skill `flet-validation`

### Prioridad BAJA
11. Agregar snippets de paginacion y tooltips
12. Crear comando `g360 bring flet-snippets`
13. Documentar patrones de migracion tkinter -> Flet

---

## 9. Referencias

- **Proyecto de referencia:** `g360-insight-lens` (este proyecto)
- **Proyecto similar:** `g360-nc-sustentor` (app Flet existente)
- **Skill definition:** `g360-cli/src/assets/config/g360-skills.json`
- **Snippets:** `g360-cli/src/assets/snippets/snippets.json`
- **AGENTS.md:** Lineamientos generales del ecosistema

---

*Documento creado el 2026-05-15 durante el desarrollo de g360-insight-lens*
*Autor: Agente G360 + @carloscus*
*Version: 1.0*
