# Decisiones técnicas — g360-cli

Registro de investigación y decisiones sobre tecnología. Una fila por tema.
Estado en inglés (capa máquina), texto en español (capa persona).

## Reglas

1. Solo la persona operadora marca `adopted`, con quién y cuándo. Ningún agente ni asistente lo hace.
2. `discarded` siempre lleva motivo — evita repetir la misma investigación.
3. `adopted` no dispara nada por sí solo: si afecta el catálogo de stacks o el marco de gobierno, sigue su propio camino (Nivel C).
4. `reviewBy` vencido → la entrada se marca para revisar. Las conclusiones sobre DuckDB/Tauri/Flet envejecen rápido.
5. Lo que llega desde `/consult` entra como HYPOTHESIS y se contrasta contra el repo antes de subir de estado.

## Estados

| Estado | Significado |
|---|---|
| `explored` | Se investigó, aún sin evaluar contra el repo |
| `candidate` | Encaja sobre el papel; falta piloto o verificación |
| `adopted` | Decisión de la persona operadora, registrada |
| `discarded` | Descartado, con motivo y fecha |

## Registro

| Fecha | Tema | Estado | Resumen | Fuentes | Motivo / Nota | reviewBy | Decidió |
|---|---|---|---|---|---|---|---|
| 2026-11-07 | DuckDB para `g360 ingest` | `explored` | SQL local sobre CSV/Excel, sin servidor; candidato a cruzar reportes ERP | Consulta externa (2026-11-07), sin verificar contra docs oficiales | Pendiente: evaluar contra ingest actual y política de dependencias | 2027-02-07 | — |
| 2026-11-07 | Piloto Tauri (`g360-day-calculator`) | `explored` | Desktop web-based con instalador <10MB; hereda plantillas web | `STACKS.md` (g360-cli), catalogado `experimental` | Pendiente: ejecutar el piloto y medir vs versión actual | 2027-02-01 | — |
| 2026-11-07 | Rollout Flet 1.0.5 a downstream | `explored` | Tecnología `maintained`; plantillas `python-flet`=deprecated, `python-flet-polished`=maintained | `STACKS.md` (g360-cli) | Pendiente: extender rollout a repos downstream | 2027-05-01 | — |
| 2026-11-10 | Drift modelo+variante entre `.md` y `setup.js` | `candidate` | 4 fuentes de verdad en conflicto: `.md` instalados (glm/deepseek mezclados), `DEFAULT_OPENCODE_CONFIG` en setup.js (deepseek sin variante), `opencode.json.template` (código muerto), e `opencode.json` instalado (deepseek sin variante). Precedencia empírica: `.md` gana sobre JSON. Hallazgos: (H1) drift orchestrator/architect, (H2) username hardcodeado a 'ccusi', (H3) INSTALL_PATHS.template nunca se instala, (H4) keys snake_case duplicadas. Propuesta: unificar en setup.js con variantes `#none/#low/#high/#max`, documentar antes de implementar. | Verificación interna del orquestador 2026-11-10; propuesta externa de allocation de esfuerzo (marcada HYPOTHESIS) | Pendiente aprobación humana para cambiar modelos/variantes (Nivel C); documentación histórica primero, cambio de código después | 2026-12-10 | ccusi (en curso) |
| 2026-11-10 | Variantes de razonamiento por rol | `explored` | Modelo canónico propuesto: reviewer=`#max`, orchestrator=`#high`, security/data=`#low`, architect/qa=`#none`. Baseline conservador: mantener deepseek-v4.1-flash sin saltar a glm-5.3-flash. Sin telemetría estructural (solo reporte en entregable). Cap de iteraciones architect↔reviewer = 3. | Consulta de modelo de agente externo + verificación contra `models` tool y OpenCode docs V2 | Requiere implementación en setup.js y `.md`; versionar como cambio de package npm semver minor | 2027-02-10 | — |
| 2026-11-10 | Reglas de autonomía y límites | `adopted` | 3 reglas condensadas de 5 sugerencias externas: (1) autonomía intra-repo objetivo, (2) autorización explícita para writes fuera del repo (otros repos en projects/, archivos globales, backups no automáticos), (3) re-autorizar si cambia scope; backups de g360 setup autorizados por defecto. Se descartaron duplicados de reglas existentes (fail-closed, prohibición publish/push ya cubiertas por permisos JSON). | Recomendación de agente orquestador tras análisis comparativo con MULTIAGENTE.md existente; aprobación de ccusi en esta sesión | Entra en vigor inmediatamente tras merge; afecta comportamiento de todos los agentes | 2027-02-10 | ccusi |
