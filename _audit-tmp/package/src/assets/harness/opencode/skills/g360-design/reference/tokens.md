# Tokens G360 — Consulta en Runtime

Este archivo describe cómo obtener los tokens de diseño del proyecto en runtime.
**Nunca hardcodear colores** en el skill; leer desde la fuente de verdad.

## Fuente de verdad

Los tokens residen en `skill.json` del proyecto. Ubicaciones posibles:

| Ubicación | Cuándo aplica |
|---|---|
| `<proyecto>/skill.json` | Proyecto G360 raíz |
| `<proyecto>/src/core/skill.json` | Proyecto con core separado |
| Configuración global de g360-cli | Proyecto sin skill.json local |

## Cómo leer los tokens

### Opción A: Usar la CLI (recomendado)

```powershell
# Ver todos los tokens del proyecto actual
g360 config show

# Ver solo colores
g360 config show --tokens colors

# Ver skill actual
g360 config show --skill
```

### Opción B: Leer skill.json directamente

```powershell
# PowerShell
Get-Content skill.json | ConvertFrom-Json
```

La estructura esperada:

```json
{
  "name": "flet-desktop",
  "colors": {
    "bg": "#0b1220",
    "surface": "#1a2332",
    "accent": "#00d084",
    "accentStrong": "#047857",
    "accentBright": "#34d399",
    "accentSoft": "rgba(0, 208, 132, 0.12)",
    "onAccent": "#06281c",
    "text": "#f0f4f8",
    "muted": "#94a3b8",
    "success": "#22c55e",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "info": "#3b82f6"
  },
  "effects": {
    "glassmorphism": true,
    "blur": "12px",
    "rounded": "12px"
  },
  "signature": {
    "mode": "powered",
    "text": "powered by G360"
  },
  "framework": "flet",
  "accentFamily": "emerald"
}
```

### Opción C: Sin skill.json (proyecto nuevo)

Si no existe skill.json, el agente debe:
1. Preguntar al usuario qué skill quiere aplicar.
2. Ejecutar `g360 init <nombre> --skill <skill>` para generar el archivo.
3. No inventar colores propios.

## Familias de acento

Las familias están definidas en `accent-families.json` del g360-cli:

```
C:\Users\ccusi\Documents\Proyect_Coder\G360-ecosystem\projects\g360-cli\src\assets\config\accent-families.json
```

Familias disponibles: `emerald`, `cyan`, `azure`, `indigo`, `violet`, `amber`, `rose`, `teal`, `blue`, `cipsa`, `navy`.

Para cambiar: `g360 set-accent <familia> --project <ruta>`.

## Semánticos fijos

Estos colores son invariantes en todas las familias y temas:

| Rol | Dark | Light |
|---|---|---|
| success | `#22c55e` | `#15803d` |
| warning | `#f59e0b` | `#b45309` |
| error | `#ef4444` | `#dc2626` |
| info | `#3b82f6` | `#0369a1` |

Nunca sobrescribirlos.

## Reglas de aplicación

1. **Siempre** leer tokens desde skill.json o CLI.
2. **Nunca** escribir un hex de memoria en el código del proyecto.
3. **Si falta un token**, agregarlo al generador (`src/lib/token-generator.js`) y reemitir, no hardcodearlo.
4. **Para cambiar identidad**: `g360 set-accent <familia>` reescribe tokens de todos los stacks.
5. **Un componente debe funcionar en todos los stacks**: si un rol existe en CSS, tiene que existir en Python/Go/Rust con el mismo nombre.
