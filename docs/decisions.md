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
