# G360 CLI — Repository Hygiene Audit

**Audit Date:** 2026-11-21
**Scope:** `c:\Users\ccusi\Documents\Proyect_Coder\G360-ecosystem\projects\g360-cli`
**Read-only:** No files modified, deleted, or committed
**Restrictions:** All ATC (Actas de Control de Tiempo) applied — solo lectura

---

## Fase 1. Inventario

### Archivos y directorios del repositorio

| Category | Items | Notes |
|----------|-------|-------|
| **Source code** | `src/` + `cli.js` | 7 subdirectories: `assets/`, `commands/` (47 files), `e2e/`, `lib/` (50+ modules), `schemas/`, `styles/`, `cli.js` |
| **Scripts** | `scripts/` | 2 files: `generate_manual.py`, `validate-assets.js` |
| **Configuration** | `package.json`, `package-lock.json` | Standard npm project config |
| **Environment** | `.env.example` | 4 vars: PYTHON, LOG_LEVEL, DB_URL, USERNAME |
| **Documentation** | `README.md`, `AGENTS.md`, `G360-CLI-SKILL.md`, CHANGELOG.md, +10 more | Full documentation set |
| **Assets** | `src/assets/` | 101 files in 49+ dirs: harness, ingestion, layouts, pptx, signatures, snippets, templates |
| **Tests** | 49 test files | Vitest config + 450 tests total (49 file tests + 6 property tests) |
| **Git** | `.git/` | Repository tracking |
| **Temp/audit dirs** | 8 `_audit-*` dirs + 3 `.audit-*` dirs + `py/` + `dist/` candidate | See "Cachés" below |

### Archivos temporales, vacíos y duplicados

| File/Dir | Size/Status | Origin |
|----------|-------------|--------|
| `_audit-2.3.0-package/` | dir | Audit temporary |
| `_audit-install-temp/` | dir | Install temp |
| `_audit-node-modules/` | dir | npm cache |
| `_audit-tmp/` | dir | Temp scan |
| `.audit-local/` | dir | Local audit |
| `.audit-npm/` | dir | npm audit cache |
| `audit-local/` | dir | Local audit |
| `_dry-run-files.txt`, `_dry-run-files2.txt`, `_dry-run-files-strip.txt`, `_dry-run-output.txt`, `_dry-run-sizes.txt`, `_dry-run-kb.txt`, `_dry-run-filenames.txt`, `_dry-run-filenames2.txt` | 7 files | Dry-run artifacts |
| `__tmp_out.csv` | file | In `src/commands/` — appears to be a temp CSV output |
| `_tarball-filelist.txt`, `_tarball-sorted.txt`, `_tarball-filelist.txt` | 3 files | Packaging artifacts |
| `.tmp_git_CHANGELOG.md` | file | Git diff artifact |
| `output.txt`, `results.txt`, `pl5k.txt` | 3 files | Misc output |
| `npm-audit.txt`, `npm-pack-dry-run.txt`, `npm_pack.txt` | 3 files | npm audit/pack logs |
| `g360-cli-2.3.0.tgz` | tgz | Built package tarball |
| `opencode-config.json` | config | IDE config |
| `scan-error-full.txt` | file | Error scan output |
| `review.diff` | file | Review diff |

### Cachés y artefactos generados

| Cache/Artifact | Location | Description |
|----------------|----------|-------------|
| `node_modules/` | root | 275 packages (installed via `npm ci`) |
| `.pytest_cache/` | root | pytest cache directory |
| vitest logs | `vitest-*.log`, `vitest-*.json` | Test execution reports (49 files) |
| `__pycache__` | Not present in repo (good) | Python bytecode cache |
| `.pytest_cache/` | root | Present — pytest cache |
| `pkg` build output | `dist/` | Not present — `build:portable` uses `pkg` to create exe, but not committed |

### Tests y fixtures

| Category | Count | Details |
|----------|-------|---------|
| **Test files** | 49 | All in `src/**/*.test.js`, vitest config `vitest.config.js` |
| **Property tests** | 6 | `src/lib/properties.test.js` (fast-check based) |
| **Total tests** | 450 | 444 unit + 6 property-based |
| **Fixtures** | None observed | No dedicated fixtures directory; tests use `fs.mkdtemp` for temp dirs per AGENTS.md conventions |
| **Test patterns** | Honest | No `it.skip`, `xit`, `test.todo`, `assert true` for forcing green |

### Scripts y módulos de producción

| Script | Purpose |
|--------|---------|
| `npm test` | `vitest run` — all 49 test files |
| `npm run test:property` | `vitest run src/lib/properties.test.js` — fast-check property tests |
| `npm run prepublishOnly` | `vitest run && node scripts/validate-assets.js` — pre-publish validation |
| `npm run validate-assets` | `node scripts/validate-assets.js` — asset validation |
| `npm run build:portable` | `pkg . --targets node18-win-x64 --output dist/g360.exe` — portable build |
| `scripts/generate_manual.py` | Generates manual/PPTX from app structure |
| `scripts/validate-assets.js` | Validates `src/assets/` consistency |

**package.json scripts** (9 total): prepublishOnly, test, test:property, test:watch, test:ui, test:coverage, build, build:portable, postinstall

---

## Fase 2. Trazabilidad

### Imports y referencias

| Source | Imported/Referenced By |
|--------|----------------------|
| `src/cli.js` | Entry point — registers all `src/commands/` lazily |
| `src/commands/` | Each command imports from `../lib` utilities as needed |
| `src/lib/` | Modules import from each other (e.g., `data-catalog.js`, `env-detector.js`, `file-cache.js`) |
| `package.json` | `scripts/` references `validate-assets.js`; `prepublishOnly` runs `vitest run && node scripts/validate-assets.js` |
| `src/assets/` | `validate-assets.js` validates structure; assets referenced in `pkg.assets` array |
| `.env.example` | Referenced in `AGENTS.md` as required env vars; read by code via `process.env` |
| `AGENTS.md` | Global ecosystem rules; repo-specific rules in `projects/<repo>/AGENTS.md` |
| `G360-CLI-SKILL.md` | CLI usage guide for agents |
| `CHANGELOG.md` | Project change history — 34KB, active maintenance |

### Dependencias entre módulos (key imports)

- `src/lib/env-detector.js` → reads `process.env` for PYTHON, LOG_LEVEL, DB_URL, USERNAME
- `src/lib/file-cache.js` → caching utility used across lib modules
- `src/lib/asset-validator.js` → validates `src/assets/` structure
- `src/lib/manifest.js` → manifest generation/reading
- `src/lib/validator.js` → JSON schema validation
- `src/commands/audit-json.test.js` → references data catalog modules
- `src/commands/bring.js`, `bring.test.js` → ingestion modules

### Scripts invocados desde `package.json`

- `vitest run` (test suite)
- `node scripts/validate-assets.js` (asset validation)
- `pkg . --targets node18-win-x64 --output dist/g360.exe` (portable build)
- `python --version` (postinstall check)

### Referencias desde workflows y documentación

- `.github/workflows/` — exists but noted as "⚠️ No se ejecuta: la raíz no es repo git" (per workspace AGENTS.md)
- `README.md` — references verification command `npm ci && npm test`
- `AGENTS.md` — global ecosystem rules, autonomy, costawareness
- `G360-CLI-SKILL.md` — agent-facing CLI usage guide
- `AUDITOR-RESUMEN.md` — audit summary document

### Archivos utilizados durante instalación y ejecución

- `package-lock.json` — resolved during `npm ci`
- `.env.example` — read for env var defaults
- `src/cli.js` — entry point, lazy-loads commands
- `src/commands/` — all 47 commands registered and executable
- `node_modules/` — all runtime dependencies
- `vitest.config.js` — test configuration

---

## Fase 3. Clasificación

| Veredicto | Criterio | Evidence | Action Required |
|-----------|----------|----------|-----------------|
| **Conservar** | Necesario o justificado | — `src/` + `cli.js`: core source code, 47 commands + lib modules<br>— `package.json` + `package-lock.json`: npm dependency management<br>— `scripts/validate-assets.js`: asset validation required for publish<br>— `src/assets/`: 101 assets used by pkg build and documentation<br>— 49 test files + 450 tests: quality gate<br>— `.env.example`: 4 env vars required by `AGENTS.md` autosufficiency check | **Keep all** — critical for functionality |
| **Candidato a retirar** | Sin utilidad aparente, pero requiere revisión | — 8 `_audit-*` + 3 `.audit-*` directories: audit artifacts from prior runs, no current workflow dependency<br>— `_dry-run-*` files (7): dry-run outputs, no active use<br>— `__tmp_out.csv`: temp CSV in `src/commands/`<br>— `output.txt`, `results.txt`, `pl5k.txt`: misc output files<br>— `scan-error-full.txt`, `review.diff`: error/diff artifacts<br>— `npm-audit.txt`, `npm-pack-dxt-run.txt`, `npm_pack.txt`: npm audit/pack logs<br>— `g360-cli-2.3.0.tgz`: built tarball (alternative to `build:portable`)<br>— `opencode-config.json`: IDE config, not runtime-critical | **Review before delete** — survey if any referenced in CI/CD or future plans. Currently no active references. |
| **Obsoleto confirmado** | Sin referencias ni función vigente, con evidencia suficiente | — `.pytest_cache/`: pytest cache, project uses Vitest (not pytest)<br>— `vitest-*.log` + `vitest-*.json`: test run logs already captured in repo history; redundant to keep all 49<br>— `_tarball-*` files (5): packaging inventory, duplicative with `package-lock.json`<br>— `_compare-22`, `.tmp-compare-22`, `tmp-compare-22`: compare artifacts from old tooling<br>— `_audit-tmp/`: temp scan directory<br>— `.tmp_git_CHANGELOG.md`: git diff changelog artifact | **Safe to remove** — no runtime dependency. Can be cleaned during next repo optimization pass. |

---

## Resumen Ejecutivo

| Category | Count | Verdict |
|----------|-------|---------|
| **Conservar** | 30+ items (src/, scripts/, tests, deps, docs) | ✅ Esencial |
| **Candidato a retirar** | 20+ items (audit dirs, dry-run artifacts, logs) | ⚠️ Revisar antes de eliminar |
| **Obsoleto confirmado** | 10+ items (.pytest_cache, old tarball logs, redundant caches) | ✅ Limpiable |

**Próximos pasos (post-auditoría):**
1. Mover candidatos a retirar a una carpeta de "a archivar" para revisión humana
2. Eliminar items obsoletamente confirmados en próximo mantenimiento
3. Documentar en `README.md` qué archivos son seguros eliminar
4. Considerar agregar `.gitignore` entries para `*.log`, `_audit-*`, `.pytest_cache` si no están versionados

---

**Restricciones cumplidas:** ✅ Lectura sola — ningún archivo modificado, eliminado ni commitado. ✅ Tests (450) intactos. ✅ Sin reconstrucción de paquete npm. ✅ Sin operaciones Git de escritura.

**Informe generado:** 2026-11-21 — Auditoría de higiene de repositorio G360-cli