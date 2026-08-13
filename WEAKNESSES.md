# G360-CLI — Debilidades y Mejoras Futuras

Registry de debilidades detectadas durante el desarrollo de `python-flet-polished` template y actualizaciones de g360-cli v1.14.0.

## Criticas (accion inmediata)

| ID | Debilidad | Prioridad | Owner |
|---|---|---|---|
| W-001 | `python-flet` template legacy sigue siendo seleccionable con `--template python-flet --force` | Media | @ccusi |
| W-002 | `pyproject.toml` del template `python-flet` legacy referencia `g360-core>=0.1.0` que no existe en PyPI | Alta | @ccusi |
| W-003 | `addon.test.js` test falla (preexistente, no relacionado) | Media | @ccusi |

## Versionado

| ID | Debilidad | Prioridad | Owner |
|---|---|---|---|
| V-001 | CHANGELOG en `g360-cli` esta desactualizado 2 versiones | Alta | @ccusi |
| V-002 | Skills en `g360-skills.json` no tienen version semantica | Media | @ccusi |
| V-003 | Template `skill.json` y `g360-skills.json` duplican informacion de version | Baja | @ccusi |

## Arquitectura

| ID | Debilidad | Prioridad | Owner |
|---|---|---|---|
| A-001 | `G360Theme` clase (legacy) vs `theme.py` funciones (polished) = API inconsistente | Alta | @ccusi |
| A-002 | 3 archivos de config cruzados (skills.json, project-types.json, g360-skills.json) = drift riesgo | Alta | @ccusi |
| A-003 | No hay validacion cross-template/skill (ej: `python-flet --skill cipsa`) | Media | @ccusi |
| A-004 | `TEMPLATE_DEFAULTS` mapping hardcoded en `init.js` — deberia leerse de config | Media | @ccusi |

## Testing

| ID | Debilidad | Prioridad | Owner |
|---|---|---|---|
| T-001 | `init.test.js` no testea auto-resolucion de template segun skill | Alta | @ccusi |
| T-002 | No hay tests para `TEMPLATE_DEFAULTS` mapping | Media | @ccusi |
| T-003 | No hay e2e test de `g360 init <name> --template python-flet-polished` | Baja | @ccusi |

## Cross-Platform

| ID | Debilidad | Prioridad | Owner |
|---|---|---|---|
| P-001 | `run.bat`, `launch.vbs`, `build-portable.bat` asumen Windows | Alta | @ccusi |
| P-002 | CRLF/LF inconsistent en archivos template (.bat necesita CRLF) | Alta | @ccusi |
| P-003 | Python 3.11 hardcoded en `run.bat` — deberia ser 3.12+ para futuro Flet | Media | @ccusi |

## Documentacion

| ID | Debilidad | Prioridad | Owner |
|---|---|---|---|
| D-001 | `skills.json` (config) y `g360-skills.json` (registry) docs confunden | Media | @ccusi |
| D-002 | No existe migration guide de `python-flet` → `python-flet-polished` | Baja | @ccusi |
| D-003 | AGENTS-UIUX.md no menciona el nuevo template como estandar | Baja | @ccusi |

## Notas

- Creado: 2026-08-13
- Relacionado: g360-cli v1.14.0, template python-flet-polished
- Ver tambien: G360-CLI-SKILL.md seccion "Plantilla python-flet-polished"
