# MIGRACIONES.md — Protocolo de actualización y migración de frameworks

Protocolo especializado para migraciones de frameworks (Flet, React, Svelte, etc.) y cambios de versión mayor que introducen breaking changes.

**Fuente canónica:** este documento. Los demás documentos del sistema multiagente (`HANDOFF.md`, `MULTIAGENTE.md`, `orchestrator.md`, `SKILL.md`) referencian este protocolo en lugar de replicarlo.

---

## Alcance

Aplica cuando:

- Se actualiza un framework principal a versión mayor (ej: Flet 0.28 → 1.0.5).
- Hay cambios de API incompatibles entre versiones.
- Se migra componentes antiguos a nuevas API.
- Se requiere capa de compatibilidad (shims/adapters) para transición gradual.

---

## Flujo de migración

```
1. Diagnóstico           → data-specialist
2. Compatibilidad        → architect + reviewer
3. Estrategia            → data-specialist
4. Plan por componentes  → architect
5. APROBACIÓN HUMANA     → gate
6. Implementación incremental → architect (worktree aislado)
7. QA por componente     → qa-specialist (funcional + visual)
8. APROBACIÓN HUMANA FINAL → gate
```

---

## Paso 1: Diagnóstico

El data-specialist recolecta:

- Versión actual del framework.
- Versión destino (changelog, docs oficiales).
- Breaking changes documentados.
- Dependencias transitivas afectadas.
- Estado actual de tests y coverage.

**Entregable:** inventario de riesgo con tabla de breaking changes por módulo.

---

## Paso 2: Compatibilidad

El architect propone estrategia de compatibilidad:

- **¿Shim necesario?** Solo si el framework rompe API sin alternativa inmediata.
- **¿Adapter pattern?** Para desacoplar llamadas antiguas de nuevas signatures.
- **¿Migration path oficial?** Priorizar rutas documentadas por el maintainer.
- **No introducir shims automáticamente.** Evaluar primero si el coste de mantener código de compatibilidad justifica el beneficio.

El reviewer verifica que la lógica de negocio no cambie semánticamente.

---

## Paso 3: Estrategia

El data-specialist determina:

- **Migración completa:** si el proyecto es pequeño o los breaking changes son aislados.
- **Migración incremental:** si el proyecto es grande o hay múltiples módulos interdependientes.
- **Hitos de aprobación:** puntos donde se requiere revisión humana antes de continuar.

---

## Paso 4: Plan por componentes

El architect divide el trabajo:

1. Listar componentes/módulos que usan APIs afectadas.
2. Ordenar por dependencia (de abajo hacia arriba).
3. Definir tarea por componente: qué cambia, cómo se verifica.
4. Estimar riesgo por componente (alto/medio/bajo).

---

## Paso 5: APROBACIÓN HUMANA (pre-implementación)

Presentar al usuario:

- Inventario de riesgo (paso 1).
- Estrategia elegida (paso 3).
- Plan por componentes (paso 4).
- Impacto estimado (tiempo, riesgo de regresión).

**Sin aprobación explícita, no se implementa nada.**

---

## Paso 6: Implementación incremental

- Cada componente se implementa en su propia rama o worktree.
- Se commitea por componente para aislamiento de errores.
- Se ejecutan tests después de cada componente.
- Si un componente falla, se rollbackea y sedocumenta el problema.

---

## Paso 7: QA por componente

El qa-specialist valida:

- **Funcional:** suite de tests del repo pasa.
- **Equivalencia:** mismo comportamiento que antes del cambio.
- **Visual (si aplica):** screenshots comparativos, dimensiones, consistencia UI.

Las diferencias visuales se clasifican como:
- **Error:** ruptura de diseño que afecta UX.
- **Advertencia:** diferencia menor que no afecta funcionalidad.
- **Nota:** cambio intencional documentado.

---

## Paso 8: APROBACIÓN HUMANA FINAL

Antes de mergear o publicar:

- Revisar reporte de QA por componente.
- Confirmar que no hay diferencias visuales no documentadas.
- Verificar que el rollback plan funciona (branch original accesible).

---

## Rollback

Si algo falla durante la migración:

1. Deshacer el último componente commiteado.
2. Ejecutar tests para confirmar retroceso.
3. Documentar el fallo y re-evaluar estrategia.
4. Re-aprobar antes de reintentar.

---

## Reglas importantes

- **No migrar todo junto.** Incremental siempre.
- **No introducir shims sin evaluar alternativa.** Código de compatibilidad es deuda.
- **QA visual es complementaria, no substituta.** Los tests funcionales son la fuente de verdad.
- **Sin aprobación humana no hay implementación ni mergear.**
