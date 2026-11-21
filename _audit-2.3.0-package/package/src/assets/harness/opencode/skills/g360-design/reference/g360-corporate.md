# G360 Corporate — Políticas y Verificación

Este archivo contiene las reglas corporativas del ecosistema G360. Se carga cuando el agente detecta modo corporativo (skill.json presente).

## Less is More — Políticas obligatorias

Leer siempre antes de implementar o corregir UI.

- NO hardcodear colores. Todo color sale de `skill.json` → `theme` / `var(--g360-*)`.
- NO lógica de negocio en UI. `core/` nunca importa el framework UI.
- NO más de 3 niveles de nesting visual (Column > Row > Card, basta).
- SIEMPRE loading visible en operaciones bloqueantes (fetch, threads, exports).
- SIEMPRE error visible al usuario (toast/SnackBar). Nunca `except: pass` ni `catch {}`.
- NO duplicar componentes. Reusar desde `src/assets/snippets/snippets.json`.
- Un componente por archivo. Archivos UI de máximo 400 líneas.
- Una vista = un solo `<h1>`. Nunca saltar niveles (H1 → H3 prohibido).
- Máximo 6 pasos tipográficos (H1, H2, H3, body, caption, mono).
- Toda app incluye los 8 esenciales: header, KPI card, tabla, drop-zone, loading, firma G360, menú export, búsqueda.

## 8 Esenciales por framework

| Esencial | Flet | Web (React/Solid/Svelte/Lit) |
|---|---|---|
| Header | `_build_header()` | `<Header />` / `<g360-header>` |
| KPI Card | `KpiCard` + glow | `<KpiCard />` |
| Tabla | `DataTable` | `<DataTable />` |
| Drop Zone | `FilePicker` | `<input type="file">` / drop-zone |
| Loading | `ProgressRing` + overlay | `<LoadingOverlay />` |
| Firma | `g360_signature` widget | `<g360-signature>` |
| Export | `PopupMenuButton` | dropdown export (xlsx/csv) |
| Búsqueda | search + debounce 250ms | search + debounce 250ms |

## Verificación — flujo obligatorio

Correr siempre antes de presentar cualquier cambio UI.

```bash
g360 review            # tokens + jerarquía + componentes, objetivo >= 90/100
g360 review tokens     # solo paleta vs skill.json
g360 review hierarchy  # solo H1-H6 y escala tipográfica
g360 review components # solo esenciales + antipatrones
g360 lint              # naming y duplicados
g360 audit             # compliance G360
```

Corregir por severidad: críticos primero, luego importantes, luego menores.
Re-ejecutar `g360 review` hasta alcanzar el puntaje.

## Referencias del repo

- `AGENTS-UIUX.md` — patrones por framework, threading, responsive, checklist.
- `FLET-NAMING-CONVENTIONS.md` — sufijos `App/Dashboard/Card/Modal/Overlay/Badge/Chip/Table`.
- `src/assets/snippets/snippets.json` — 40+ snippets listos (flet-*, pandas-*, openpyxl-*).
- `src/assets/config/g360-skills.json` — paletas por skill (corporativo, moderno, cipsa, flet...).
