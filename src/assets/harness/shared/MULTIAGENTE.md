# Sistema Multiagente G360 — Documentación de Operación

## Visión general

Sistema de coordinación multiagente basado en el método **Elefante–Goldfish**, desplegado en tres plataformas (OpenCode, Kilo, Cline). El método está documentado en `~/.agents/HANDOFF.md` y se implementa de forma distinta en cada herramienta.

---

## Modelo conceptual

| Rol | Qué hace | No puede |
|---|---|---|
| `orchestrator` | Clasifica nivel A/B/C, invoca agentes, consolida reporte | Escribir código |
| `architect` | Implementa código según especificación | Publicar, pushear, migrar destructivo |
| `reviewer` (Goldfish) | Revisa diff aislado vs criterio de aceptación | Editar archivos |
| `security-auditor` | Busca credenciales, CVEs, rupturas de contrato | Editar archivos |
| `data-specialist` | Audita schemas, migraciones, contratos de datos | Migrar/borrar datos |
| `qa-specialist` | Corre la suite de tests y reporta | Editar código |

### Niveles de complejidad

| Nivel | Qué es | Flujo | Gate |
|---|---|---|---|
| **A** | Mantenimiento ligero (typo, estilo, dep menor) | implementa → (qa opcional) | Ninguno |
| **B** | Módulo o funcionalidad nueva | architect → reviewer → qa | Reviewer puede bloquear |
| **C** | Estructural (schema, migración, contratos de datos) | data-specialist → architect (spec) → reviewer ×2 → security-auditor → data-specialist (plan migración) → architect (implementa) → qa → **aprobación humana** | Aprobación obligatoria antes de implementar |

> Un cambio que toca contratos de datos es **C por definición**, aunque sean 3 líneas.

---

## Contrato de handoff

El único canal entre agentes es **el prompt de invocación**. Cada subagente arranca con contexto vacío — no hay memoria compartida.

```
REPO: <ruta absoluta del worktree>   RAMA: <rama>
OBJETIVO: <una sola frase verificable>
CONTEXTO MÍNIMO: <rutas de archivo, no su contenido>
RESTRICCIONES: <qué NO hacer>
CRITERIO DE ACEPTACIÓN: <cómo se comprueba>
SALIDA ESPERADA: <esquema + límite de líneas>
```

**Reglas del contrato:**

1. Autosuficiente: si no se resuelve leyendo el repo, falta contexto.
2. Punteros, no volcados: ruta + línea, no el archivo pegado.
3. Nunca pegar el historial de la conversación.
4. Una pregunta por invocación.
5. Restricciones explícitas en el prompt, no solo en el `md` del agente.
6. Al pasar de un agente a otro, trasladar solo hallazgos y rutas.

### Regla crítica (aprendida en producción)

**El orquestador debe pasar el criterio de aceptación COMPLETO al reviewer.** Sin él, hallazgos reales pueden calificarse como "ningún crítico". En la práctica se verificó que un reviewer aislado sin el valor de verdad (fórmula canónica, spec exacta) falla silenciosamente.

---

## Esquema de salida del reviewer

```
VEREDICTO: APROBADO | CONDICIONAL | RECHAZADO
CRÍTICOS: <n> | ninguno
  - [archivo:línea] <hallazgo> — <evidencia de por qué es real>
ADVERTENCIAS: <n> | ninguna
NO VERIFICADO: <qué no se pudo comprobar y por qué>
```

`NO VERIFICADO` es obligatorio: convierte el silencio en una afirmación explícita y corta la costumbre de rellenar con falsos positivos.

### Qué exige un hallazgo para ser crítico

- **Evidencia ejecutable**: el revisor lo comprobó (corrió el test, evaluó el regex, leyó la línea exacta), no lo intuyó.
- **Reproducible por el autor** con el criterio de aceptación.
- **Ubicable**: archivo + línea.

Un crítico sin evidencia es una advertencia, no un crítico.

---

## Despliegue por plataforma

### OpenCode (V2 nativo)

Agentes definidos en `~/.config/opencode/`:

- `opencode.json` — orquestador, reviewer, security-auditor, data-specialist, qa-specialist
- `agents/architect.md` — subagente implementador (requerido: un agente `primary` no puede lanzarse como subagente, `build` es `primary`)
- `agents/orchestrator.md` — reglas de handoff, flujo A/B/C
- `skills/orchestrate/SKILL.md` — guía de operación

Shape V2: `permissions` con `{action, resource, effect}`.

### Kilo (V1 nativo, fork OpenCode)

Agentes definidos en `~/.config/kilo/kilo.jsonc`.

Diferencias clave respecto a OpenCode:

- Clave `agent` singular (no `agents`).
- Shape V1 de permisos: `permission` con mapa de patrón → acción.
- `write` no existe como acción; se bloquea con `edit: deny`.
- Comandos compuestos no matchean patrones → una invocación por comando.
- Modelos con prefijo `kilo/` (ej: `kilo/nvidia/nemotron-3.5-lightning:free`).
- Invocación de subagentes con `task: g360-<rol>: allow`.

> Nota: el modelo free `kilo/kilo-auto/free` alucina escritura de archivos. Usar `nemotron-3.5-lightning:free` para el arquitecto.

### Cline (emulado, proceso aislado)

Cline no tiene primitivo de subagente. El revisor se emula con aislamiento de proceso:

```powershell
pwsh ~/.agents/goldfish.ps1 -Repo C:\ruta\repo -Spec "criterio de aceptación"
```

- Modo plan (`--plan`) + sin auto-approve = read-only por petición, no enforced.
- Un rol por invocación.
- Limitación: el "read-only" no se enforza; un revisor que puede escribir no es un goldfish.
- Valor: útil para auditorías léxicas, no para enforcement.

---

## Antipatrones documentados

- Revisor que ve el plan del autor "para entender el contexto".
- Orquestador que resume el diff él mismo y le pasa el resumen al revisor.
- **Orquestador que no pasa el criterio de aceptación completo**: el reviewer puede fallar silenciosamente y calificar hallazgos reales como "ninguno".
- Pedirle a un agente "revisá, arreglá y documentá".
- Aceptar un veredicto sin `CRÍTICOS: 0 | ninguno` y sin `NO VERIFICADO`.
- Compartir el historial completo entre agentes para "ahorrar tokens": sale más caro que pasar bien el contexto.

---

## Historial de cambios y lecciones aprendidas

| Fecha | Hallazgo | Corrección |
|---|---|---|
| 2026-11-01 | `architect` inexistente como ID de agente | Crear `~/.config/opencode/agents/architect.md` |
| 2026-11-01 | Reviewer calificaba hallazgo real como "ningún crítico" | Regla de handoff: pasar criterio completo explícitamente |
| 2026-11-01 | Reviewer se estancaba intentando `git diff` (deny total) | Allowlist git read-only para reviewer y security-auditor |
| 2026-11-01 | Modelo free de Kilo alucinaba escritura de archivos | Cambiar modelo del architect a `nemotron-3.5-lightning:free` |
| 2026-11-02 | Kilo rechazaba shape V2 de permisos | Usar shape V1: `agent` singular, `permission` con mapa bash |
| 2026-11-02 | Comandos `git diff` sin argumentos no matcheaban `*` | Allowlist explícita: `git diff`, `git status`, etc. |

---

## Ecosistema G360

### Rollout tokens 1.20.2

- Fix en `g360-cli` (generador emitía `light-dark(oscuro, claro)` invertido).
- Regeneración en 8 repos downstream (2 quirúrgicos, 6 regenerados).
- Ecosistema: **25 ok · 0 warn · 0 fail** (`g360 audit --ecosystem`).
- Commits: 7403f6f, 6e4aa50 (fix + test guard), b741f21, 2751082, 0aa74bc, e1589c8, 03f3772, b9801a4, 398bd46, e6348f1.

### Worktrees activos

| Worktree | Rama | Estado |
|---|---|---|
| `projects/.trees/g360-price-audit/feat-vite8-pilot` | `feat/vite8-pilot` | 3 commits, limpio — listo para mergear |
| `projects/.trees/g360-erp-price-manager/feat-readme-fix` | `feat-readme-fix` | 7 archivos modificados sin commitear |
| `projects/.trees/g360-erp-nc-sustentor/feat-flet105-*` (dialogos/snackbar/tabs) | ramas separadas | Limpias |

---

## Uso desde repos locales

Abrir el repo en OpenCode o Kilo e invocar:

```
Usá el agente orchestrator.
Tarea: <descripción concreta>
Repo: <ruta absoluta>
Criterio de aceptación: <criterio verificable>
```

El orquestador:
1. Clasifica el nivel (A/B/C).
2. Invoca a los agentes correspondientes.
3. Presenta reporte consolidado antes de cambios estructurales.
4. **Nunca commitea, pushea ni publica sin aprobación explícita.**

---

## Archivos de referencia

- `~/.agents/AGENTS.md` — reglas personales + metodología multiagente
- `~/.agents/HANDOFF.md` — metodología completa (niveles, contrato, esquema salida)
- `~/.config/opencode/opencode.json` — configuración OpenCode
- `~/.config/opencode/agents/*.md` — definiciones de agentes
- `~/.config/opencode/skills/orchestrate/SKILL.md` — guía de operación
- `~/.config/kilo/kilo.jsonc` — configuración Kilo
- `~/.agents/goldfish.ps1` — revisor emulado para Cline
