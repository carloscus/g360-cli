# G360 Python Flet Desktop App

## Estructura del Proyecto

```
mi-proyecto/
├── src/
│   ├── main.py              # Entry point: ft.run(main)
│   ├── core/
│   │   ├── skill.json       # Configuracion del skill G360
│   │   └── g360_theme.py    # Theme engine (lee colores de skill.json)
│   ├── ui/
│   │   └── __init__.py      # Componentes Flet (PascalCase)
│   └── export/
│       └── __init__.py      # Reportes Excel (openpyxl)
├── assets/
│   └── images/
│       └── app.ico          # Icono de la app
├── skill.json               # Skill G360 aplicado
├── pyproject.toml           # Dependencias (uv sync)
├── run.bat                  # Ejecutar app
├── build.bat                # Build EXE standalone
└── README.md
```

## Requisitos

- **Python**: 3.11+ (instalado automaticamente por uv)
- **uv**: Gestor de paquetes Python (https://docs.astral.sh/uv/)
- **Windows**: 10/11 x64

## Ejecucion

### Con uv (recomendado)
```bash
run.bat
```

### Manual
```bash
uv run python src/main.py
```

`uv run` detecta/instala Python y dependencias automaticamente.

## Build Windows (EXE standalone)

```bash
build.bat
```

Genera ejecutable en `build/windows/` usando `flet build`.

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

## Snippets Flet

- `flet-page` - Configuracion de pagina con tema
- `flet-card` - Tarjetas con estilo G360
- `flet-button` - Botones G360
- `flet-kpi-card` - Card de KPI para dashboards
- `flet-drop-zone` - Zona de carga de archivos
- `flet-datatable` - Tablas de datos
- `flet-dialog` - Dialogos modales
- `flet-loading-overlay` - Overlay de carga
- `flet-footer-signature` - Footer con branding G360

## Lineamientos de Arquitectura

1. **src/core/**: NO importa `flet`. Solo logica de negocio
2. **src/ui/**: Importa `flet` y `core`. Solo presentacion
3. **src/export/**: Importa `openpyxl` y `core`. Solo reportes
4. **Threading**: Usar `threading.Thread` para operaciones bloqueantes
5. **Estado**: Atributos de clase. Evitar variables globales
6. **Colores**: Siempre via `G360Theme`. Nunca hardcodear
