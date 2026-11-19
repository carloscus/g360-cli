# Spec: Adversarial Review Mode (N1)
## Evolución del Handoff — Ataque a Suposiciones Pre-Implementación

**Fecha:** 2026-11-19
**Estado:** DISEÑO (requiere aprobación humana)
**Nivel:** C (toque reglas/prompts/modelos)

---

## Problema Actual

El `reviewer` actual (`src/assets/harness/opencode/agents/reviewer.md`) solo revisa **diffs post-implementación**. No existe mecanismo para:
- Atacar suposiciones en specs/plans ANTES de codificar
- Red-teaming de prompts o arquitecturas
- Múltiples ejecuciones del MISMO modelo para diversité de perspectivas

Esto genera que bugs de diseño pasen desapercibidos hasta que el código está escrito.

---

## Propuesta: Modo Adversarial del Reviewer

### Cambio 1: Nuevo rol "adversary" (no reemplaza al reviewer)

**Archivo nuevo:** `src/assets/harness/opencode/agents/adversary.md`

```markdown
---
description: Revisor adversarial — ataca suposiciones de specs/plans ANTES de implementación
mode: subagent
model: opencode/glm-5.3-flash#max  # Mismafamilia que reviewer, pero ejecución independiente
steps: 10
---

# Revisor Adversarial

Eres un crítico implacable. Tu trabajo es finding fallacias, suposiciones no validadas, y riesgos ocultos EN DOCUMENTOS DE ESPECIFICACIÓN, plans, o arquitectura propuestos.

## Principio fundamental

**NO implementás.** Solo atacás. Si encontrás un fallo crítico, lo reportás con evidencia concreta (file:line, quoted passage).

## Input recibido

1. Documento/especificación a revisar (texto completo)
2. Archivos de contexto referenciados (rutas, no contenido completo)
3. Restricciones del proyecto (stack, reglas de negocio)

## Qué atacar

- **Suposiciones no justificadas:** "Asumimos que X es verdadero porque..."
- **Falsas dicotomías:** Presentar solo 2 opciones cuando hay más
- **Slippery slope sin base:** "Si hacemos A, entonces必然 B y C"
- **Circularidad:** Usar la conclusión como premisa
- **Gap de evidencia:** Afirmaciones sin datos que las sustenten
- **Riesgos ignorados:** Scenarios edge-case no considerados

## Output requerido

Para cada hallazgo:
```
ID: ADV-001
Severidad: CRÍTICO | MAYOR | MENOR
Ubicación: archivo:linea or "sección X del doc"
Afirmación cuestionada: "texto citando"
Problema: por qué es problemático
Consecuencia si se ignora: qué pasa si se construye sobre esto
Sugerencia: alternativa o validación necesaria
```

## Reglas

- NUNCA proponés la solución (eso es trabajo del architect)
- NUNCA suavizás un hallazgo ("quizás", "tal vez")
- Si varias ejecuciones del mismo modelo convergen en el mismo hallazgo → subir severidad
- Si ninguna ejecución encuentra problema en un área → signal de confianza alta

---

## Cambio 2: Extender orchestrator para invocar adversary

**Archivo:** `src/assets/harness/opencode/agents/orchestrator.md`

Agregar al flujo Nivel B/C:

```markdown
## Flujo con revisión adversarial (recomendado para Nivel B+)

1. `architect` produce especificación técnica
2. `adversary` revisa LA ESPECIFICACIÓN (no el código)
3. `orchestrator` consolida findings + spec
4. Si hay hallazgos CRÍTICOS → rollback a architect con feedback
5. Si solo MAYORES/MENORES → architect decide cómo abordar
6. `architect` implementa
7. `reviewer` revisa diff post-implementación
```

### Condición de activación

El modo adversarial se activa cuando:
- La tarea es Nivel B o C (estructural)
- El architect reporta "especificación generada"
- O el usuario pide explícitamente `--adversarial`

---

## Cambio 3: Múltiples ejecuciones del mismo modelo

**En orch5estrator.md**, agregar:

```markdown
## Diversidad de perspectives

Para tareas complejas (>500 líneas de spec), ejecutar el adversary 2-3 veces con:
- Variación en el order de lectura (primero errores, después estructura)
- Variation en el focus (uno ataca lógica, otro UX, otro seguridad)
- Same model, different prompt seeds (si el provider lo soporta)

Los findings se mergean por grouping (misma ID = mismos problemas).
NUNCA bajar severidad por consenso — cada hallazgo se evalúa individualmente.
```

---

## Cambio 4: Metrica de adopción (relacionado con N7)

**Reporte post-ejecución:**
```json
{
  "adversarial_review": {
    "findings_total": 12,
    "critical": 2,
    "major": 5,
    "minor": 5,
    "adopted": 8,
    "rejected_with_reason": 4,
    "adoption_rate": 0.67
  }
}
```

**Umbral de alarma:**
- Adoption rate < 0.3 → reviewer demasiado permisivo (ajustar prompt)
- Adoption rate > 0.9 con few findings → reviewer demasiado agresivo (relajar)
- Thresholds basados en baseline histórico, no números fijos

---

## Archivo a crear

| Archivo | Acción |
|---|---|
| `src/assets/harness/opencode/agents/adversary.md` | Crear nuevo |
| `src/assets/harness/opencode/agents/orchestrator.md` | Modificar (agregar flujo adversarial) |
| `src/lib/adversary-reporter.js` (opcional) | Helper para formatear output |

---

## Validación Requerida

Antes de implementar, confirmar:
1. **¿Hay segunda familia de modelos disponible?** El adversary debe ser de familia distinta al architect para independencia real.
   - Architect actual: `nvidia/nemotron-3.5-super-vl-120b`
   - Reviewer actual: `opencode/glm-5.3-flash`
   - ¿Otro candidato? `agnes/agnes-3.0-flash` o `opencode/minimax-m3.1-flash-free`

2. **¿Costo aceptable?** Cada ejecución adversarial añade ~2-3 min y ~50K tokens. ¿El valor justifica el costo?

3. **¿Dónde se registran aprobaciones?** ¿En el repo (AGENTS.md?), logs, o manualmente?

---

## Próximo Paso

Esperar aprobación humana para:
1. Definir modelo del adversary (¿misma familia que reviewer o distinta?)
2. Confirmar thresholds de adoption rate
3. Decidir si el feature vaEnabled por defecto o solo con flag `--adversarial`
