# G360 Python CustomTkinter App

## Estructura

```
mi-proyecto/
├── src/
│   ├── main.py              # Entry point
│   └── core/
│       ├── skill.json       # Configuracion G360
│       └── g360_theme.py    # Theme engine
├── assets/images/
├── skill.json
├── pyproject.toml
├── run.bat                  # Ejecutar app
├── build.bat                # Build EXE (PyInstaller)
└── README.md
```

## Requisitos

- **Python**: 3.11+ (instalado automaticamente por uv)
- **uv**: https://docs.astral.sh/uv/

## Ejecucion

```bash
run.bat
```

## Build Windows

```bash
build.bat
```

Genera `dist/G360-App.exe` usando PyInstaller.

## Theme

Colores definidos en `src/core/skill.json`, cargados via `G360Theme`.

| Token | Color |
|---|---|
| `bg` | `#0b1220` |
| `surface` | `#1a2332` |
| `accent` | `#00d084` |
| `text` | `#f0f4f8` |
