# Stacks G360

> **Fuente de verdad:** `src/assets/config/stacks.json` — editar solo ahí.
> Este archivo se genera automáticamente con `node scripts/gen-stacks-md.js`.

- Versión del catálogo: **1.0.0**
- Última revisión: **2026-11-07**

---

## Resumen

- Recomendados: 4
- Mantenidos: 3
- Experimentales: 1
- Obsoletos: 1

---

| Stack | Status | Dominio | Cuándo usar | Cuándo no usar |
|---|---|---|---|---|
| `api-hono` | ✅ recommended | api | API REST/edge-compatible con TypeScript | Tool de escritorio o CLI |
| `cli-node` | ✅ recommended | cli | Herramienta de línea de comandos Node.js | App con GUI o procesamiento pesado |
| `cli-python` | ✅ recommended | cli | CLI Python con procesamiento de datos | App con GUI o tool simple |
| `web-react-vite` | ✅ recommended | web | App web interactiva con estado complejo | Script simple, CLI, o app de escritorio |
| `desktop-flet` | 🟢 maintained | desktop | App de escritorio Python con UI rica | Web app, CLI, o rendimiento nativo |
| `web-solid-vite` | 🟢 maintained | web | App web ligera, buen rendimiento sin virtual DOM | Cuando el equipo domina React |
| `desktop-tauri` | 🧪 experimental | desktop | App de escritorio web-based con instalador pequeño | Requiere lógica Python compleja (pandas) |
| `web-svelte-vite` | 🟢 maintained | web | App web ligera, buen rendimiento, proyectos pequeños | Cuando el equipo domina React |
| `web-lit-vite` | ⚠️ deprecated | web | — | Usar React |

---

## API Hono (`api-hono`)

- **Status:** recommended
- **Dominio:** api
- **Versiones objetivo:** `{"node":">=22","hono":"4.x"}`
- **When to use:** API REST/edge-compatible con TypeScript, testing sin servidor (app.request())
- **When not to use:** Tool de escritorio, CLI, o app monolítica sin necesidad de API separada

---

## Node CLI (`cli-node`)

- **Status:** recommended
- **Dominio:** cli
- **Versiones objetivo:** `{"node":">=22"}`
- **When to use:** Herramienta de línea de comandos Node.js, scripts de automatización
- **When not to use:** App con GUI (usar Flet/Tauri) o procesamiento pesado de datos (usar Python)

---

## Python CLI (`cli-python`)

- **Status:** recommended
- **Dominio:** cli
- **Versiones objetivo:** `{"python":">=3.11","uv":">=0.4"}`
- **When to use:** CLI Python con procesamiento de datos, integración con pandas/DuckDB
- **When not to use:** App con GUI (usar Flet) o tool simple (usar Node CLI)

---

## React + Vite (`web-react-vite`)

- **Status:** recommended
- **Dominio:** web
- **Versiones objetivo:** `{"node":">=22","vite":"5.x","react":"18.x"}`
- **When to use:** App web interactiva con estado complejo, requiere routing y componentes reutilizables
- **When not to use:** Script simple, CLI, o app de escritorio (usar Flet o Tauri)
- **Verificación visual:** Playwright por componente, matriz claro/oscuro × ancho/estrecho

---

## Flet Desktop (`desktop-flet`)

- **Status:** maintained
- **Dominio:** desktop
- **Versiones objetivo:** `{"python":">=3.11","flet":"1.0.5","pip":">=24.0"}`
- **When to use:** App de escritorio Python con UI rica, procesamiento de archivos locales, integración ERP
- **When not to use:** Web app, CLI tool, o cuando se necesita rendimiento nativo (usar Tauri/Rust)
- **Verificación visual:** Playwright en modo web Flet + screenshot manual en desktop

---

## SolidJS + Vite (`web-solid-vite`)

- **Status:** maintained
- **Dominio:** web
- **Versiones objetivo:** `{"node":">=22","vite":"5.x","solid":"1.x"}`
- **When to use:** App web de alto rendimiento con reactividad fine-grained
- **When not to use:** Proyectos que necesitan grandes ecosystems de componentes (React tiene más)
- **Verificación visual:** Playwright por componente

---

## Tauri 2 (`desktop-tauri`)

- **Status:** experimental
- **ReviewBy:** 2027-02-01
- **Dominio:** desktop
- **Versiones objetivo:** `{"node":">=22","tauri":"2.x","rust":"1.75+"}`
- **When to use:** App de escritorio web-based con instalador pequeño (<10MB), distribución sin Python
- **When not to use:** Requiere lógica Python compleja (pandas, procesadores ERP); usar Flet en ese caso
- **Verificación visual:** Playwright + Tauri WebDriver por componente, matriz tema × resolución
- **Excepción:** Piloto en g360-day-calculator

---

## Svelte + Vite (`web-svelte-vite`)

- **Status:** maintained
- **Dominio:** web
- **Versiones objetivo:** `{"node":">=22","vite":"5.x","svelte":"4.x"}`
- **When to use:** App web ligera, buen rendimiento sin virtual DOM, proyectos pequeños
- **When not to use:** Cuando el equipo domina React; Svelte tiene menor ecosistema de componentes
- **Verificación visual:** Playwright por componente, matriz claro/oscuro

---

## Lit + Vite (`web-lit-vite`)

- **Status:** deprecated
- **Successor:** `web-react-vite`
- **Dominio:** web
- **Versiones objetivo:** `{"lit":"3.x"}`
- **When not to use:** Nuevo proyecto: usar React+Vite. Solo mantener existencias.
- **Excepción:** g360-stock-reporter-lit — migrar en próximo rollout
