---
name: Orquestar flujo multiagente
description: Guía el flujo de trabajo orquestador → architect → reviewer → security-auditor → data-specialist → qa-specialist según la complejidad de la tarea. Usa este skill cuando el usuario pida cambios que requieran revisión estructural o coordinación de múltiples agentes.
metadata:
  opencode/autoinvoke: false
---

# Skill: Orquestar Flujo Multiagente G360

Este skill guía el flujo de coordinación entre agentes especializados del ecosistema G360.

## Cuándo usar este skill

Úsalo cuando:
- El usuario pida un cambio estructural (migración, nueva arquitectura, cambio de schema).
- El usuario pida agregar una funcionalidad nueva no trivial.
- El usuario pida revisar oAuditar un cambio existente.
- Se requiera aprobación escalonada antes de implementar.

NO lo uses para correcciones menores (typos, ajuste de estilos, una sola línea).

## Niveles de complejidad

### Nivel A — Mantenimiento ligero
Correcciones puntuales, typos, ajuste de estilos, dependencia menor.
- **Flujo:** orquestador directo → (qa opcional)
- **Duración estimada:** 1-2 rondas

### Nivel B — Desarrollo de módulos
Nuevas funcionalidades, pantallas, componentes, APIs.
- **Flujo:** orquestador → `architect` → reviewer → qa
- **Duración estimada:** 3-6 rondas

### Nivel C — Cambios estructurales
Migraciones, modificación de arquitectura, bases de datos, contratos de datos.
- **Flujo:** orquestador → data-specialist (inventario) → `architect` (spec) → reviewer ×2 → security-auditor → data-specialist (plan migración + rollback) → **aprobación humana** → `architect` (implementa en worktree) → qa-specialist (funcional + visual) → **aprobación humana final**
- **Duración estimada:** 8-20 rondas
- **Protocolo detallado:** `~/.agents/MIGRACIONES.md`

## Pasos del flujo

### Paso 1: Clasificar nivel
Lee `AGENTS.md` del repo activo. Determina el stack y el comando de verificación. Clasifica la tarea en A, B o C.

### Paso 2: Planificar invocaciones
Según el nivel, define qué subagentes se necesitan.

### Paso 3: Ejecutar o presentar plan
- **Nivel A/B:** invoca los subagentes correspondientes y consolida resultados.
- **Nivel C:** presenta el plan detallado al usuario primero. Espera aprobación explícita antes de invocar al `architect`.

### Paso 4: Validar
Ejecuta el comando de verificación del repo (declarado en `AGENTS.md`).

### Paso 5: Reportar
Consolida los entregables en formato markdown con estado final.

## Formato de reporte final

```markdown
## Resumen
[qué se hizo y por qué]

## Nivel
[A / B / C]

## Cambios
- [archivo]: [qué cambió y por qué]

## Subagentes invocados
| Agente | Rol | Resultado |
|---|---|---|
| architect | [implementó] | [qué hizo] |
| reviewer | [revitó] | [hallazgos críticos / advertencias / notas] |
| security-auditor | [auditoría] | [checklist completado] |
| data-specialist | [impacto datos] | [plan de migración] |
| qa-specialist | [tests] | [X passed / Y failed] |

## Verificación
```bash
[comando exacto]
```
```
[resultado]

## Estado
APROBADO / RECHAZADO / NECESITA-REVISION
```

## Contrato de handoff (comunicación entre agentes)

El único canal entre agentes es **el prompt de invocación** (un string) y **la
respuesta final** (texto). No hay memoria compartida ni caché compartida: cada
subagente arranca con contexto vacío. Por eso la calidad del flujo depende de
lo que el orquestador escriba, no de lo que "recuerde".

Reglas del contrato:

1. **El prompt debe ser autosuficiente.** Si el subagente no lo puede resolver
   leyendo el repo, el prompt está incompleto.
2. **Pasar punteros, no volcados.** Rutas de archivo + número de línea en vez de
   pegar el archivo; el subagente tiene `read`/`grep`.
3. **Nunca pegar el historial de la conversación.** Se pasa la especificación y
   el diff, no la charla (esto es lo que hace útil al revisor aislado).
4. **Una pregunta por invocación.** "Revisá X" — no "revisá, arreglá y
   documentá".
5. **Salida acotada y con forma fija.** Pedir siempre el mismo esquema y un
   límite duro de líneas; sin eso el reporte crece y contamina al siguiente
   agente.
6. **No re-resumir de más.** Al pasar de un agente a otro, trasladar solo los
   hallazgos y las rutas; cada resumen extra es pérdida de información.
7. **Decir lo prohibido explícitamente.** "No commitees, no instales
   dependencias, no toques otros repos" va en el prompt, no solo en el `md`
   del agente.

### Plantilla de invocación

```text
REPO: <ruta absoluta del worktree>   RAMA: <rama>
OBJETIVO: <una sola frase verificable>
CONTEXTO MÍNIMO: <archivos/rutas relevantes, no su contenido>
RESTRICCIONES: <qué NO hacer>
CRITERIO DE ACEPTACIÓN: <cómo se comprueba>
SALIDA ESPERADA: <esquema + límite de líneas>
```

### Esquema de salida de los revisores (fijo)

```text
VEREDICTO: APROBADO | CONDICIONAL | RECHAZADO
CRÍTICOS:      <n> | ninguno
  - [archivo:línea] <hallazgo> — <evidencia de por qué es real>
ADVERTENCIAS:  <n> | ninguna
NO VERIFICADO: <qué no pudiste comprobar y por qué>
```

Sin `NO VERIFICADO` el revisor tiende a rellenar con falsos positivos; con ese
campo declarado, el silencio se vuelve explícito.

## Reglas importantes

1. **El reviewer siempre recibe contexto aislado:** la especificación + el diff. NO el historial de conversación.
2. **Un cambio estructural (nivel C) siempre necesita aprobación humana antes de implementar y después del QA.**
3. **Nunca ejecutes `npm publish`, `git push`, o operaciones de deploy sin aprobación explícita.**
4. **Cada cambio va en branch propio.** Si hay worktree existente, úsalo.
5. **Si el reviewer marca un hallazgo CRÍTICO, el architect debe revisar antes de continuar.**
6. **El comando de verificación declarado en `AGENTS.md` es la fuente de verdad** para validar que el repo sigue funcionando.
