# Spec: Roles Proposer y Evaluator + sincronización del sistema multiagente

- **Rama:** `feat/proposer-evaluator`
- **Nivel:** B (módulos nuevos: 2 agentes + actualización de flujo)
- **Estado:** CONSOLIDADO tras revisión adversarial (ver §7) — listo para arquitectura
- **Fecha:** 2026-11-19

---

## 1. Objetivo

Separar dos responsabilidades que hoy están concentradas:

1. **Proposer**: produce la especificación técnica / propuesta. **No implementa.**
2. **Evaluator**: consolida los reportes de revisión del nivel correspondiente y emite veredicto + recomendación. **No implementa, no decide solo; el orquestador decide.**

Criterio de éxito observable (no medición de "sesgo"): el adversary ataca una spec **sin que su autor participe en la revisión**, y el evaluator emite un veredicto con evidencia citada de cada reporte.

### Fuera de alcance (decisión explícita del usuario 2026-11-19)

- ❌ Protocolo de comunicación JSON estructurado con schema/parser (ajv). Se posterga: el handoff en texto estructurado ya es legible, no hay consumidor CI/dashboard que lo parseé, y el costo estimado (6-10 h) supera el beneficio actual.
- ❌ Token accounting real, presupuestos dinámicos, caché cross-agent, deduplicación por hash, failover runtime de modelos. `model-resolver.js:47-56` sigue resolviendo solo el primer candidato.
- ❌ Modificar `~/.agents/*` globales ni la config global activa del host.
- ❌ Commits, push, publish, bump de versión.

---

## 2. Estado actual verificado (evidencia)

| Hecho | Archivo : línea |
|---|---|
| 7 agentes `.md` en assets; no existen `proposer` ni `evaluator` | `src/assets/harness/opencode/agents/` |
| `architect` propone **y** implementa | `.../agents/architect.md:14-20` |
| La consolidación la hace el orquestador, sin veredicto externo | `.../agents/orchestrator.md:52` |
| Instalación copia **todos** los `.md` del directorio (no hay lista fija) | `src/commands/setup.js:483-492` |
| Mensaje de dry-run tiene lista hardcodeada **desactualizada** (no incluye `adversary`) | `src/commands/setup.js:469` |
| `DEFAULT_OPENCODE_CONFIG.agents` no declara `adversary` | `src/commands/setup.js:230-352` |
| `agents.orchestrator.permissions` no permite invocar `adversary` | `src/commands/setup.js:237-249` |
| `DEFAULT_KILO_CONFIG.agent` tampoco incluye `adversary` ni su `task` allow | `src/commands/setup.js:47-212` |
| `model-fallbacks.json` no tiene entrada `adversary` | `src/assets/config/model-fallbacks.json:1-29` |
| `resolveModel(rol)` devuelve solo el primer elemento; `null` si no hay entrada | `src/lib/model-resolver.js:51-56` |
| `HANDOFF.md` y `MULTIAGENTE.md` (assets compartidos) también enumeran roles/flujos | `src/assets/harness/shared/` |
| Esquema canónico de salida: `VEREDICTO: APROBADO \| CONDICIONAL \| RECHAZADO` | `HANDOFF.md`, `SKILL.md:128-139` |
| `explore` es agente **built-in** del runtime: tiene permiso, no tiene `.md` en assets | `setup.js:240`, catálogo de la sesión |
| `installSharedDocs()` corre siempre, incluso si se elige solo OpenCode/Kilo | `src/commands/setup.js:604-611` |

**Consecuencia:** el N1 (adversary) quedó medially instalado: el `.md` se copia y el prompt del orchestrator lo nombra, pero la config generada no le da permiso ni fallback. Este spec corrige esa sincronización **dentro del alcance**, porque si no los roles nuevos caen en el mismo error.

---

## 3. Cambios propuestos

### 3.1 Archivos nuevos

| Archivo | Contenido |
|---|---|
| `src/assets/harness/opencode/agents/proposer.md` | Rol `proposer`, `mode: subagent`, read-only (sin `edit`/`write`/`patch`, sin shell, sin subagentes). Produce **solo** la especificación: objetivo, contexto mínimo (rutas), restricciones, supuestos (≤3), criterio de aceptación verificable, riesgos y alternativas descartadas. **Prohibido:** implementar, escribir archivos, proponer código concreto. |
| `src/assets/harness/opencode/agents/evaluator.md` | Rol `evaluator`, `mode: subagent`, read-only. Recibe **todos** los reportes generados en el nivel (§3.3), nunca el historial del autor. Compara hallazgos, marca conflictos/duplicados, distingue evidencia ejecutable de especulación. Salida con el esquema canónico de `HANDOFF.md` + un campo de recomendación mapeado (§3.4). |

### 3.2 Archivos modificados

| Archivo | Cambio |
|---|---|
| `.../agents/orchestrator.md` | Agregar `proposer`, `evaluator` y `adversary` a los subagentes autorizados; reemplazar los flujos por los de §3.3; aclarar que el evaluator recomienda y el orquestador decide. |
| `src/commands/setup.js` | (a) `DEFAULT_OPENCODE_CONFIG.agents`: agregar `proposer`, `evaluator` y `adversary`; (b) `agents.orchestrator.permissions`: allow para los 3; (c) `DEFAULT_KILO_CONFIG.agent`: agregar `g360-proposer`, `g360-evaluator`, `g360-adversary` con prompts y permisos read-only; (d) `task` allow del orchestrator de Kilo; (e) mensaje dry-run de línea 469 derivado de `readdir`, **no** hardcodeado. |
| `src/assets/config/model-fallbacks.json` | Agregar cadenas para `adversary`, `proposer`, `evaluator`, manteniendo las existentes. Aclarar con un comentario/no-op que la cadena es **declarativa**: el resolver consume solo `[0]`. |
| `.../skills/orchestrate/SKILL.md` | Actualizar flujos A/B/C y la tabla de subagentes del reporte final con los roles nuevos; documentar cuándo NO invocarlos (Nivel A) para no inflar tokens. |
| `src/assets/harness/shared/HANDOFF.md` | Agregar los roles nuevos al catálogo de roles y al esquema de salida del evaluator. No redefinir el método (sigue siendo la fuente única). |
| `src/assets/harness/shared/MULTIAGENTE.md` | Agregar los roles nuevos al mapa de roles/flujos, en coherencia con `orchestrator.md` y `SKILL.md`. |
| `README.md` | Sección corta: roles disponibles y cuándo se invocan. |

### 3.3 Flujos definitivos (resuelve la ambigüedad del Nivel C)

| Nivel | Flujo |
|---|---|
| **A** | `architect` → `qa-specialist` (opcional). **Sin** proposer, adversary ni evaluator. |
| **B** | `proposer` (spec) → `adversary` (ataca spec) → `architect` (implementa con feedback) → `reviewer` (diff) → `qa-specialist` (tests) → `evaluator` (consolida) → **orquestador decide**. |
| **C** | `data-specialist` (inventario) → `proposer` (spec; **reemplaza** el antiguo "architect (especificación técnica)") → `adversary` (ataca spec) → `reviewer` ×2 → `security-auditor` → `data-specialist` (plan + rollback) → **aprobación humana** → `architect` (implementa en worktree) → `qa-specialist` (equivalencia + visual) → `evaluator` (consolida) → **aprobación humana final**. |

`architect` **no re-escribe la spec**: recibe la spec ya atacada y consolidada, e implementa. Si la spec es ambigua, devuelve la pregunta al orquestador (comportamiento ya definido en `architect.md:38-39`).

**Reportes que recibe el evaluator:** B → adversary + reviewer + qa. C → adversary + reviewer ×2 + security-auditor + data-specialist ×2 + qa. Si un agente no se invocó, se declara explícitamente como `NO INVOCADO` (no se omite en silencio).

### 3.4 Salida del evaluator (reconciliación de vocabulario)

Se usa el esquema canónico de `HANDOFF.md`; `RECOMENDACIÓN` es un mapeo 1:1 del veredicto, **no** un segundo eje de decisión:

```text
VEREDICTO: APROBADO | CONDICIONAL | RECHAZADO
CRÍTICOS:      <n> | ninguno
ADVERTENCIAS:  <n> | ninguna
RECOMENDACIÓN: ADOPTAR | MODIFICAR | RECHAZAR
NO VERIFICADO: <qué no se pudo comprobar y por qué>
```

Mapeo obligatorio: `APROBADO → ADOPTAR`, `CONDICIONAL → MODIFICAR`, `RECHAZADO → RECHAZAR`. El orquestador conserva la decisión final.

### 3.5 Modelos propuestos (IDs verificados en catálogo activo 2026-11-19)

| Rol | Primario | Variantes confirmadas del modelo |
|---|---|---|
| `proposer` | `nvidia/stepfun-ai/step-5-preview#medium` | `none, minimal, low, medium, high, xhigh, max` ✅ |
| `evaluator` | `opencode/qwen3.8-flash#xhigh` | `none, low, medium, xhigh` ✅ — **corregido**: `#high` NO existe (hallazgo ADV-004) |
| `adversary` | `nvidia/minimaxai/minimax-m3.1-flash#none` | `none, thinking` ✅ — ya definido en `orchestrator.md:39`; solo se sincroniza |

Secundario/terciario: proveedores y familias distintas al primario, reutilizando IDs **ya presentes** en el catálogo consultado. **No inventar IDs ni variantes.**

---

## 4. Contrato de verdad (criterio de aceptación)

El cambio se considera correcto **si y solo si**:

1. `npm test` pasa con los **370 tests actuales + los nuevos**, y **0 skips en ninguna forma** (`it.skip`, `xit`, `describe.skip`, `test.skip`, `pytest.mark.skip`, `xfail`, `assert true`). Los tests nuevos verifican las 9 configuraciones y la coherencia entre fuentes — no solo cuentan tests.
2. `node scripts/validate-assets.js` termina con `✅ validate-assets: listo para publicar.`
3. El directorio `src/assets/harness/opencode/agents/` contiene **exactamente 9 `.md`** (7 existentes + `proposer` + `evaluator`). `explore` es built-in, **no se cuenta**. `node src/cli.js setup --platform opencode --dry-run` deriva la lista de `readdir` (sin hardcodear) y la config OpenCode resultante declara 9 entradas con esos mismos nombres.
4. Para cada uno de los 9 roles existe: `.md` en assets + entrada en `DEFAULT_OPENCODE_CONFIG.agents` + `allow` en `agents.orchestrator.permissions` + entrada en `DEFAULT_KILO_CONFIG.agent` (+ `task` allow) + entrada en `model-fallbacks.json` con `resolveModel(rol) !== null`. **Esto verifica declaración, no cuota ni failover runtime** (fuera de alcance).
5. `proposer`, `evaluator` y `adversary` son read-only como `reviewer`: sin `edit`/`write`/`patch`, sin shell salvo `git diff/log/show/status`, sin subagentes.
6. `orchestrator.md`, `SKILL.md`, `HANDOFF.md` y `MULTIAGENTE.md` describen el **mismo** orden y nombres de roles (§3.3), sincronizados.
7. Ningún archivo fuera de la lista de §3.2. En particular: **no** `package.json`, **no** `opencode-config.json`, **no** config global del host.
8. Todos los IDs de modelo y sus variantes existen en el catálogo activo verificado. Ningún ID ni variante inventada.

---

## 5. Supuestos (reformulados tras el ataque adversarial)

1. **S1** — La separación `proposer`/`architect` es una decisión de diseño para desacoplar diseño e implementación. **No se afirma reducción medible de sesgo.** Se considera exitosa si el adversary ataca una spec sin que su autor participe en la revisión. Reversible si en 3 tareas consecutivas añade ≥2 rondas sin ningún hallazgo adoptado.
2. **S2** — El `evaluator` aporta una síntesis con contexto aislado de la implementación. Criterio observable: emite veredicto + recomendación con evidencia citada de cada reporte. **No se afirma superioridad medible** sobre la consolidación del orquestador.
3. **S3** — Compatibilidad definida: `setup` sin `--reset` no sobrescribe una instalación existente; con `--reset` reemplaza la config completa (comportamiento actual conocido). `installSharedDocs()` corre siempre; los cambios en `shared/HANDOFF.md` y `shared/MULTIAGENTE.md` son cambios controlados del repo que se instalan en `~/.agents`.
4. **S4** — El vocabulario de salida ya es canónico (`HANDOFF.md`), y `RECOMENDACIÓN` está mapeado 1:1 al veredicto (§3.4). No se introduce un segundo eje de decisión.
5. **S5** — Los IDs propuestos existen en el catálogo activo (§3.5). **No se afirma disponibilidad de cuota ni failover runtime**: `model-resolver.js` solo resuelve el primer candidato y la verificación de quota está documentada como futura. La cadena JSON es declarativa.

---

## 6. Riesgos conocidos

- **R1 Duplicación de spec:** resuelto en §3.3 — `proposer` reemplaza al `architect` especificador en Nivel C; `architect` solo implementa.
- **R2 Más tokens por tarea:** 2 roles nuevos = ~2 invocaciones extra. Mitigación: solo Nivel B/C; Nivel A excluido explícitamente.
- **R3 Deriva de config:** el sistema tiene 5 fuentes que se desincronizaron en N1. Mitigación: tests de coherencia (criterio 1) y dry-run derivado de `readdir`.
- **R4 Independencia de modelos:** familias distintas verificadas contra catálogo (criterio 8). Esto **no garantiza** independencia cognitiva real; se documenta como limitación.

---

## 7. Findings adversarios consolidados y resolución

Gate ejecutado por `adversary` (`nvidia/minimaxai/minimax-m3.1-flash#none`) el 2026-11-19. El subagente agotó sus 12 pasos antes de emitir el formato formal; entregó 12 hallazgos verificables que el **orquestador consolidó** según su rol de consolidación. No se re-run el gate (la tabla de overrides no autoriza subir esfuerzo por agotamiento de pasos).

| ID | Hallazgo | Resolución en este spec |
|---|---|---|
| ADV-001 | Criterio 3 no verificable: `explore` no tiene `.md` | §4.3 aclara que los 9 son los `.md`; `explore` excluido |
| ADV-002 | Criterio 4 mezcla agente built-in con 9 fuentes | §4.4 define las 5 fuentes concretas, sin `explore` |
| ADV-003 | `resolveModel()` no prueba fallback operativo | §4.4 y S5 reclasifican la cadena como declarativa |
| ADV-004 | Variante `qwen3.8-flash#high` inexistente | §3.5 corregida a `#xhigh` (confirmado en catálogo) |
| ADV-005 | S5 afirma cuota sin evidencia | S5 reformulado; fuera de alcance explícito |
| ADV-006 | Flujo C ambiguo: ¿proposer reemplaza la spec de architect? | §3.3 lo define explícitamente |
| ADV-007 | Evaluator no recibe todos los reportes de Nivel C | §3.3 enumera reportes por nivel y `NO INVOCADO` |
| ADV-008 | Vocabulario choca con esquema canónico | §3.4 mapeo 1:1 al `VEREDICTO` de `HANDOFF.md` |
| ADV-009 | Alcance no incluye `HANDOFF.md`/`MULTIAGENTE.md` | §3.2 los agrega; criterio 6 actualizado |
| ADV-010 | S3 falsa: `--reset` y `installSharedDocs()` | S3 define compatibilidad con precisión |
| ADV-011 | Criterio 1 es conteo, no comportamiento | §4.1 exige tests de las 9 configuraciones y anti-skip |
| ADV-012 | S1/S2 sin métrica ni condición de decisión | S1/S2 reformulados con criterio observable y reversibilidad |

**Confianza en el spec tras consolidación:** MEDIA-ALTA. Las contradicciones verificables quedaron resueltas; permanecen como limitaciones declaradas la independencia cognitiva entre familias de modelo y la ausencia de failover runtime.
