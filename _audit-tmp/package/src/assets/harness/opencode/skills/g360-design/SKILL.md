---
name: g360-design
description: Hub orquestador de diseño G360. Determina el modo (corporativo G360 vs creativo), carga las políticas correctas y delega según el contexto. Trigger cuando el usuario pida estilos, colores, tema, UI, o al trabajar en proyectos del ecosistema G360.
version: 2.0.0
---

# G360 Design — Hub Orquestador

Este skill es el punto de entrada para todo trabajo de diseño en el ecosistema G360. No hardcodea valores visuales; los lee del proyecto en runtime. Delega según el contexto detectado.

## Detección de modo

El agente determina el modo en este orden de prioridad:

1. **Declaración explícita en AGENTS.md** — si el proyecto declara `design-mode: corporate` o `design-mode: creative` en su AGENTS.md, usar ese modo.
2. **Configuración G360 detectada** — si existe `skill.json` en la raíz o `src/core/skill.json`, modo corporativo.
3. **Modo creativo como predeterminado** — si no hay señales G360, delegar a `impeccable`.

```powershell
# Detectar skill.json (marca modo corporativo)
Test-Path "skill.json" -or Test-Path "src/core/skill.json"
```

## Precedencia de conflictos

Cuando las instrucciones corporativas y creativas chocan:

| Conflicto | Gana | Razón |
|---|---|---|
| Paleta de colores | Corporativo | Tokens del proyecto son la fuente de verdad |
| Jerarquía tipográfica | Corporativo | Regla de 6 pasos es invariant del ecosistema |
| Anti-patterns de IA | Creativo | Craft floor de impeccable es más restrictivo |
| Verificación final | Corporativo | `g360 review` es el gate de calidad G360 |
| Motion / animación | Creativo | No hay regla G360 al respecto |

Regla general: **lo que tiene una regla explícita G360 gana; lo que no tiene, delega a impeccable**.

## Rutas de ejecución

### Modo Corporativo (G360 project)

1. Cargar `reference/g360-corporate.md` → políticas Less is More + 8 esenciales + verificación.
2. Cargar `reference/tokens.md` → leer tokens de `skill.json` o CLI en runtime.
3. Implementar UI siguiendo las políticas.
4. Verificar con `g360 review` hasta >= 90.

### Modo Creativo (proyecto externo)

1. Delegar directamente a `impeccable`.
2. Si `impeccable` no está instalado, informar al usuario y proceder con sentido común de diseño sin el skill.

### Sin modo declarado (ambigüedad)

1. Preguntar al usuario qué modo prefiere antes de decidir.
2. No asumir corporativo en proyectos que no son G360.

## Comandos rápidos

```powershell
# Ver tokens activos del proyecto
g360 config show

# Cambiar familia de acento
g360 set-accent <familia>

# Cambiar skill del proyecto
g360 set-skill <skill>

# Verificar UI (corporativo)
g360 review --project .

# Generar DESIGN.md (creativo, requiere impeccable)
impeccable document
```

## Dependencias

- **Opcional**: `impeccable` — solo se usa en modo creativo. El hub funciona sin él.
- **Requerido**: `g360` CLI — presente en todo proyecto G360.
