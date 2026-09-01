# G360 Flet Naming Conventions

Sistema estandarizado de nomenclatura para aplicaciones Flet en el ecosistema G360.

## Regla Fundamental

> **Todo nombre debe ser auto-documentado**. Un developer debe entender que hace el codigo solo con leer los nombres.

---

## 1. Patrones de Clases UI

| Patrón | Convencion | Ejemplo | Uso |
|--------|------------|---------|-----|
| **App principal** | `{NombreProyecto}App` o `G360App` | `StockMonitorApp`, `G360App` | Clase que orquesta toda la app |
| **Dashboard/Views** | `{Area}Dashboard` | `SalesDashboard`, `InventoryDashboard` | Vista principal con KPIs |
| **Cards/KPIs** | `{Metrica}Card` | `KpiCard`, `WarehouseCard`, `LineCard` | Componente de tarjeta reutilizable |
| **Modals/Dialogs** | `{Accion}Modal` o `{Estado}Dialog` | `ExportModal`, `ConfirmDialog`, `SearchOverlay` | Ventanas modales |
| **Sidebar/Nav** | `{Type}Sidebar`, `{Type}Nav` | `AppSidebar`, `MainNav` | Navegacion lateral |
| **Tables** | `{Entity}Table` | `ProductTable`, `TransferTable` | Tablas de datos |
| **Headers** | `{Section}Header` | `DashboardHeader`, `PageHeader` | Cabeceras de seccion |
| **Footers** | `{Section}Footer` | `AppFooter`, `PageFooter` | Pie de pagina |
| **Overlays** | `{Func}Overlay` | `SearchOverlay`, `LoadingOverlay` | Capas flotantes |
| **Badges** | `{Estado}Badge` | `HealthBadge`, `StatusBadge` | Indicadores pequenos |
| **Chips** | `{Filtro}Chip` | `WarehouseChip`, `FilterChip` | Tags seleccionables |
| **Tabs** | `{View}Tab` | `OverviewTab`, `DetailsTab` | Pestañas |

### Prefijos de Identificacion por Capa

| Capa | Prefijo | Ejemplo | Archivo |
|------|---------|---------|---------|
| **Core/Processor** | Ninguno | `Processor`, `DataHandler` | `processor.py` |
| **UI Components** | `Componente` | `KpiCard`, `SearchOverlay` | `kpi_card.py` |
| **App Orchestration** | `App` o `Monitor` | `StockMonitorApp`, `G360App` | `app.py` |
| **Config** | `Theme` o `Config` | `ThemeManager`, `ConfigLoader` | `theme.py` |
| **Utils/Helpers** | `Util` o `Helper` | `StringUtils`, `FormatHelper` | `utils.py` |

---

## 2. Patrones de Funciones Metodos

| Patroón | Convencion | Prefijo | Ejemplo | Contexto |
|---------|------------|---------|---------|----------|
| **Setup inicial** | `_setup_` | setup | `_setup_page()`, `_setup_theme()` | Inicializacion |
| **Construccion UI** | `_build_` | build | `_build_header()`, `_build_content()` | Creacion de componentes |
| **Event handlers** | `_on_` | on | `_on_click()`, `_on_refresh()`, `_on_theme_toggle()` | Eventos de usuario |
| **Fetch/Download** | `_fetch_` o `_download_` | fetch/download | `_fetch_data()`, `_download_s1()` | Obtencion de datos |
| **Load/Save** | `_load_` / `_save_` | load/save | `_load_cache()`, `_save_data()` | Persistencia |
| **Update/Refresh** | `_update_` / `_refresh_` | update/refresh | `_update_ui()`, `_refresh_data()` | Actualizacion |
| **Show/Hide UI** | `_show_` / `_hide_` | show/hide | `_show_loading()`, `_hide_overlay()` | Visibilidad |
| **Toggle state** | `_toggle_` | toggle | `_toggle_theme()`, `_toggle_filter()` | Cambio de estado |
| **Validate** | `_validate_` | validate | `_validate_input()`, `_validate_data()` | Validaciones |
| **Format/Transform** | `_format_` / `_transform_` | format/transform | `_format_date()`, `_transform_data()` | Transformaciones |
| **Cleanup** | `_cleanup_` / `_reset_` | cleanup/reset | `_cleanup_temp()`, `_reset_form()` | Limpieza |
| **Confirm/Alert** | `_confirm_` / `_alert_` | confirm/alert | `_confirm_exit()`, `_alert_error()` | Confirmaciones |

### Sin prefijo (publicos)

| Patroón | Uso | Ejemplo |
|---------|-----|---------|
| `main()` | Entry point | `def main(page: ft.Page):` |
| `shutdown()` | Cleanup al cerrar | `def shutdown(self):` |
| `register_` | Registro de listeners | `def register_overlay(self):` |

---

## 3. Patrones de Variables

| Tipo | Convencion | Ejemplo | Contexto |
|------|------------|---------|----------|
| **Instancia UI refs** | `_nombre_componente` | `_kpi_row`, `_sidebar`, `_status_text` | Referencias a widgets |
| **State interno** | `_nombre_estado` | `_raw_data`, `_loading`, `_theme_mode` | Estado de la app |
| **Callback refs** | `_on_accion` | `_on_refresh`, `_on_theme_toggle` | Callbacks registrados |
| **Constants** | UPPER_SNAKE_CASE | `WINDOW_WIDTH`, `CACHE_FILE`, `AUTO_REFRESH` | Constantes globales |
| **Private helpers** | `_nombre_funcion` | `_hash_data`, `_log`, `_safe_get` | Funciones internas |

---

## 4. Patrones de Archivos

| Capa | Convencion | Ejemplos |
|------|------------|----------|
| **Entry point** | `main.py` | `main.py` |
| **App orchestration** | `app.py` | `app.py`, `monitor.py` |
| **Config/Theme** | `config/*.py` | `theme.py`, `constants.py` |
| **Core business** | `core/*.py` | `processor.py`, `downloader.py`, `models.py` |
| **UI components** | `ui/*.py` | `dashboard.py`, `kpi_card.py`, `search_overlay.py` |
| **UI modals** | `ui/modals/*.py` | `export_modal.py`, `detail_dialog.py` |
| **Exports/Reports** | `export/*.py` | `excel_report.py`, `pdf_generator.py` |
| **Utils** | `utils/*.py` | `helpers.py`, `formatters.py` |
| **Tests** | `test_*.py` o `*_test.py` | `test_app.py`, `test_processor.py` |

---

## 5. Patrones de Signatures UI (Identificacion G360)

Toda app G360 debe incluir al menos uno de estos componentes en su UI:

| Componente | Ubicacion | Identificacion |
|------------|-----------|----------------|
| **Footer signature** | Parte inferior | `powered by G360` o isotipo |
| **App icon/logo** | Header/sidebar | Logo SVG embebido |
| **Color scheme** | Todo el theme | Esmeralda `#10B981` como accent |
| **Fonts** | Global | Inter + JetBrains Mono |

---

## 6. Ejemplo de Estructura Normalizada

```
mi-app-g360/
├── main.py                      # Entry point: ft.app(main)
├── src/
│   ├── app.py                   # StockMonitorApp (orquestador)
│   ├── config/
│   │   ├── __init__.py
│   │   └── theme.py             # Paleta dual dark/light
│   ├── core/
│   │   ├── __init__.py
│   │   ├── constants.py         # CONSTANTES UPPER_SNAKE_CASE
│   │   ├── processor.py         # Logica de negocio
│   │   └── downloader.py        # Fetch de datos
│   └── ui/
│       ├── __init__.py
│       ├── dashboard.py         # Vista principal
│       ├── kpi_card.py          # Tarjetas de indicadores
│       ├── warehouse_card.py    # Cards especificas
│       ├── search_overlay.py    # Buscador flotante
│       └── modals/
│           ├── __init__.py
│           ├── export_modal.py  # Dialogo de exportacion
│           └── detail_dialog.py # Dialogo de detalles
├── assets/
│   ├── fonts/                   # Inter + JetBrains Mono
│   ├── images/                  # Logos, iconos
│   └── data/                    # Datos de muestra
├── g360_flet/
│   └── g360_signature.py        # Widget branding G360
├── skill.json                   # Identidad del proyecto
├── run.bat                      # Launcher 5 pasos
└── pyproject.toml               # Dependencias
```

---

## 7. Checklist de Compliance G360

Para que una app Flet sea reconocida como "G360 estándar":

- [ ] `main.py` con entry point `ft.app(main)`
- [ ] Clase App con patron `_setup_page()`, `_build_ui()`, `shutdown()`
- [ ] Theme dual (dark/light) en `src/config/theme.py`
- [ ] Widgets UI en `src/ui/` con nombres `PascalCase`
- [ ] Modals en `src/ui/modals/`
- [ ] Footer con signature G360
- [ ] Fonts: Inter + JetBrains Mono
- [ ] Colores: Esmeralda `#10B981` como accent
- [ ] Logging con RotatingFileHandler
- [ ] README con estructura del proyecto
- [ ] `skill.json` con identidad del proyecto

---

## 8. Identificacion Rápida entre Apps

| Caracteristica | Stock-Monitor | Stock-Consolidator | Nueva App |
|----------------|---------------|-------------------|-----------|
| **Clase App** | `StockMonitorApp` | `StockConsolidatorApp` | `{Dominio}App` |
| **Core pattern** | Hash cache + auto-refresh | Browser automation | Segun necesidad |
| **UI pattern** | Dashboard + Cards | Dashboard + Tablas | Segun necesidad |
| **Skill** | `cipsa` | `cipsa` | Definir skill |
| **Branding** | Logo CIPSA | Logo CIPSA | Logo definido |

---

**Version**: 1.0.0  
**Aplica a**: Todas las apps Flet en ecosistema G360  
**Autor**: g360-cli
