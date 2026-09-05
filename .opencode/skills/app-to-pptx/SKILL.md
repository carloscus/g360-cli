---
name: app-to-pptx
description: Generate PowerPoint presentations and user manuals from G360 applications. Automatically analyzes app structure, extracts features and workflows, and generates branded PPTX files.
version: 1.0.0
---

# App to PPTX — Skill

Genera presentaciones y manuales en PowerPoint (.pptx) a partir de aplicaciones G360.

## Uso

### Comandos CLI

```bash
# Modo manual (A4, orientado a impresion)
g360 pptx ./mi-app --mode manual --out manual.pdf

# Modo demo/presentacion (16:9, orientado a proyector)
g360 pptx ./mi-app --mode demo

# Modificar marca (cipsa por defecto si skill.json lo indica)
g360 pptx . --theme cipsa

# Preview sin generar
g360 pptx . --dry-run
```

### Opciones

| Opcion | Valor | Default |
|--------|-------|---------|
| `--mode` | `manual`, `demo`, `onboarding` | `manual` |
| `--theme` | `g360`, `cipsa` | auto-detected from skill.json |
| `--out` | ruta del archivo de salida | `{app-name}-manual.pptx` |
| `--dry-run` | solo muestra outline | false |

## Flujo de trabajo

1. **Analizar app** — `analyze-app.js` lee skill.json, src/ui/, src/app.py
2. **Detectar features** — clases UI conocidas (KpiCard, Dashboard, etc.)
3. **Detectar modals** — flujos de usuario desde src/ui/modals/
4. **Detectar screenshots** — assets/screenshots/ si existen
5. **Generar slides** — template A4 con layouts reutilizables
6. **Agregar branding** — colores y logo desde skill.json

## Estructura generada (modo manual, A4)

| # | Slide | Contenido |
|---|-------|-----------|
| 1 | Portada | Nombre + descripcion + tagline + version + logo |
| 2 | ¿Que es? | Descripcion + tarjetas usuario/tecnico + capacidades |
| 3 | Modulos | Tabla de modulos + capturas laterales |
| 4 | Flujo de trabajo | Pasos numerados + capturas |
| 5-N | Features | Una por modulo UI detectado |
| N+1 | Flujos | Modals y workflows (PWA, busqueda en web) |
| N+2 | Arquitectura | Diagrama por capas |
| N+3 | Buenas practicas | Checklist |
| N+4 | Limites conocidos | Solo si el proyecto define `limits` |
| N+5 | Resumen | Sintesis final |

Formato: 16:9 widescreen (13.333x7.5in). Output por defecto: dentro del repo de la app.

## Deteccion automatica de frameworks

| Framework | Modulos UI | Capacidades |
|-----------|-----------|-------------|
| Flet | `src/ui/*.py` + `src/ui/modals/` | desde `src/app.py` |
| SvelteKit | `src/routes/**/+page.svelte` (subrutas dinamicas incluidas) | desde `package.json` |
| Lit/React/Vue | `src/components/*.{js,ts}` | desde `package.json` (supabase, PWA, exceljs, charts) |

## Screenshots

Para incluir screenshots reales:
1. Colocar imagenes en `assets/screenshots/`
2. Nombres sugeridos: `dashboard.png`, `kpi-card.png`, `modal-export.png`
3. El generator las detecta automaticamente por nombre y las incrusta con encaje proporcional (contain-fit, nunca distorsiona)

Si no hay screenshots, se generan placeholders-guia ("CAPTURA PENDIENTE") que indican que capturar y donde guardarlo.

## Temas disponibles (design-tokens.js)

- **g360** (default): Esmeralda #10B981 sobre slate
- **cipsa**: Verde corporativo #008F5D, logo CIPSA
- **corporate**: Azul marino #1E40AF, neutral para apps sin marca

## Integracion con agents

Cuando un agent detecta que el usuario necesita documentar una app G360:

1. Verificar que el proyecto tenga `skill.json` (indica que es G360)
2. Ejecutar `g360 pptx <path> --mode manual --dry-run` para ver el outline
3. Si hay screenshots disponibles, ejecutar sin `--dry-run`
4. Si no hay screenshots, sugerir al usuario que los capture
5. Re-generar con screenshots reales

## Dependencias

- `pptxgenjs` ^4.0.1 (agregado a package.json)
- `fs-extra` (ya existente)
- `ora` (ya existente)
