<!-- g360:agents:begin -->
# AGENTS.md — g360-cli

CLI tool for bootstrapping G360 projects with standardized structure, assets, and identity

> El bloque entre los markers `g360:agents` lo genera `g360 agents` y se
> regenera sin perder lo que escribas afuera.

## Verificación

Un solo comando deja el repo listo y verifica que todo esté en verde:

```bash
npm ci
npm test
```

- Stack: node (npm)
- Tests: Vitest

## Instalación

```bash
npm ci
```


## Estructura

- `src/`
- `scripts/`
- `src/lib`

## Variables de entorno

El código lee estas variables: documentá cada una con su default en `.env.example`.

- `LOG_LEVEL`
- `PYTHON`

## Convenciones

- Los scripts de `package.json` son la interfaz del repo: agregar un comando nuevo es agregar un script.
- Tests con Vitest/Jest junto al módulo (`*.test.js`).
- Comentarios que expliquen el *por qué*, no el *qué*.

## Reglas de este repo

- **Autosuficiente**: `git clone` + el comando de verificación debe dejar la app levantada y los tests en verde, sin red y sin ayuda de una persona.
- **Tests honestos**: nada de `it.skip`, `pytest.mark.skip`, `xfail` ni `assert true` para forzar verde.
- **Entorno declarativo**: toda variable de entorno va en `.env.example` con un default seguro.
- **Sin paths de tu máquina**: nada de rutas absolutas locales ni secretos en el código.
- **Evidencia**: al entregar, reportá el comando que corriste y su salida. Si no pudiste verificar, decilo.
<!-- g360:agents:end -->

## Notas del repo

- Layout: `src/cli.js` (registro de comandos), `src/commands/` (un archivo por
  comando + su test), `src/lib/` (utilidades), `src/assets/` (skills,
  templates, components, snippets, brand), `src/schemas/`.
- Los assets de `src/assets/` se validan con `node scripts/validate-assets.js`:
  cualquier cambio ahí debe pasar ese script.
- Los comandos se registran con lazy-load en `src/cli.js` (el módulo se importa
  solo cuando se invoca) para que `--help` siga siendo rápido.
- `G360-CLI-SKILL.md` es la referencia de uso de la CLI para agentes.
- Si cambiás una opción de un comando, actualizá el `README.md` de la CLI.
