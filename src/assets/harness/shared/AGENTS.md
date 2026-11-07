# AGENTS.md global — reglas compartidas (canónico)

Este archivo es la **fuente única** de reglas personales y de autosuficiencia.
Se consume desde:

- OpenCode → `~/.config/opencode/opencode.json` (clave `instructions`)
- Kilo Code → `~/.config/kilo/kilo.jsonc` (clave `instructions`)
- Cline → `~/.agents/AGENTS.md` (global) + copias en
  `~/.cline/rules/10-autonomia.md` y `Documents\Cline\Rules\10-autonomia.md`

Al modificarlo, actualizá las copias de Cline con `~/.agents/sync-rules.ps1`.

## Reglas personales (global, todo proyecto)

- Responde en español. Sé conciso y directo.
- Entorno: Windows + PowerShell (pwsh). Rutas absolutas con unidad
  (`C:\...`), comandos compatibles con pwsh 7. No asumir bash/Linux.
- Antes de algo destructivo (`rm/del`, `git push --force`, `git reset --hard`,
  `npm publish`, `docker`, `curl/wget`), muestra qué hará y pide confirmación.
  Sin confirmación no se ejecuta.
- No commitear, pushear ni crear PRs sin pedido explícito. No crear archivos
  salvo que la tarea lo exija; preferir editar lo existente.
- Flujo: tarea chica → directo a Build; ambigua o grande → Plan primero, luego
  Build, luego Review del diff. Cada iteración: cambio → test/lint → revisar
  diff → siguiente.
- Ecosistema G360 (`Documents/Proyect_Coder/G360-ecosystem/projects/`): usar la
  CLI global `g360` (skill `g360` + comando `/g360`); `init/convert/clean`
  siempre con `--dry-run` primero. En UI, obedecer la política Less is More de
  `G360-CLI-SKILL.md`. Una sesión = un worktree (`projects/.trees/<repo>/<rama>`,
  ver `WORKTREES.md` en la raíz del ecosistema).
- **Funciones pequeñas**: cuando una función o archivo se extienda (p. ej.
  supera ~80 líneas o acumula más de una responsabilidad), dividirlo en
  funciones más pequeñas con nombres que expliquen la intención, antes de
  seguir agregando lógica.

## Autosuficiencia del código (obligatorio)

El repositorio debe funcionar **sin el asistente**. Si algo depende de contexto
que solo existe en esta conversación (un comando copiado en el chat, una
credencial o una ruta de tu máquina), el trabajo está incompleto.

1. **Un comando de verificación** — debe existir un único comando (ej.
   `npm test`) que corra build + lint + tests, sin pasos manuales, sin prompts
   y sin red.
2. **Offline-first** — tests, scripts y builds no dependen de internet. Si una
   dependencia externa es inevitable, aislala detrás de un mock/fixture local y
   documentá cómo forzarla offline (flag `--offline` o `CI=1`).
3. **Entorno declarativo** — todas las variables de entorno están en
   `.env.example` con defaults seguros. La app arranca sin configuración o
   falla con un error claro y accionable (nunca `undefined is not an object`).
4. **Dependencias declaradas y fijadas** — todo lo importado figura en
   `package.json` / `requirements.txt` / `pyproject.toml` con lockfile
   versionado. Prohibido "instalá X a mano" o "agregá este paquete".
5. **Scripts reproducibles** — todo paso de setup, migración o mantenimiento va
   versionado (`scripts/setup.ps1`, `npm run setup`). Nada de pasos sueltos que
   solo existen en el chat.
6. **Tests honestos** — prohibido `it.skip`, `xit`, `test.todo`, `assert true`,
   tests borrados o comentados, mocks que devuelven siempre el valor esperado,
   y snapshots regenerados a mano para forzar verde. Si un test no se puede
   verificar, documentá el porqué en vez de silenciarlo.
7. **Sin dependencias del entorno del asistente** — nada de rutas absolutas de
   tu máquina (`C:\Users\...`), secretos embebidos ni scripts fuera del repo.
8. **Evidencia al entregar** — reportá el comando exacto que corriste y su
   salida. Si no pudiste ejecutar la verificación, decilo explícitamente;
   nunca digas "listo" sin verificar.
9. **Fallo ruidoso** — si algo falla por falta de red, el error debe explicar
   cómo seguir trabajando offline.

**Criterio de aceptación**: `git clone <repo>` + 1 comando ⇒ la app levanta y
los tests pasan, sin red y sin intervención humana.

## Metodología multiagente (Elefante–Goldfish)

El método vive una sola vez en `~/.agents/HANDOFF.md`: niveles A/B/C, gates de
aprobación, contrato de handoff y esquema de salida de los revisores. Es
agnóstico de plataforma; cada herramienta solo implementa el mecanismo.

Regla dura: **el revisor nunca recibe el historial de la conversación.** Ve la
especificación y el diff, nada más. Si comparte el razonamiento del autor,
hereda sus puntos ciegos.

- OpenCode: `~/.config/opencode/` (agentes V2 + skill `orchestrate`).
- Kilo: `~/.config/kilo/kilo.jsonc` (agentes `g360-*`, shape V1).
- Cline: sin subagentes; el revisor es `~/.agents/goldfish.ps1`.

Protocolo especializado de migraciones: `~/.agents/MIGRACIONES.md`.

## Transferencia de conocimiento

- En cada respuesta o Pull Request, resumí la decisión de diseño tomada para
  que el desarrollador entienda el cambio al 100%.
