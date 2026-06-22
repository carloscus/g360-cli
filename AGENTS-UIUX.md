# G360 UI/UX - Lineamientos para Agentes

## Indice por Framework

| Framework | Tipo | Archivos clave | Patron UI |
|---|---|---|---|
| **Flet** | Desktop | `src/ui/*.py`, `src/core/g360_theme.py` | Clase App + componentes en files separados |
| **React** | Web/PWA | `src/components/*.jsx`, `src/styles/main.css` | Componentes funcionales + hooks |
| **SolidJS** | Web/PWA | `src/components/*.jsx`, `src/styles/main.css` | Signals + componentes funcionales |
| **Svelte/SvelteKit** | Web/PWA | `src/lib/*.svelte`, `src/routes/*.svelte` | Componentes Svelte + stores |
| **Lit** | Web/PWA | `src/components/*.js`, `src/styles/main.css` | Web Components + lit-html |
| **CustomTkinter** | Desktop | `src/ui/*.py` | Clases por frame/ventana |

---

## 1. Arquitectura UI General

Toda app G360 sigue la regla: **Core sin UI, UI con Core**.

```
src/
├── core/          # Logica de negocio (NO imports de framework UI)
│   ├── processor.py
│   └── skill.json
├── ui/            # Componentes de interfaz (framework imports permitidos)
│   ├── components/
│   └── views/
├── export/        # Generacion de reportes
└── styles/        # CSS / theming
```

### 1.1 Naming Conventions

| Elemento | Convencion | Ejemplo |
|---|---|---|
| Archivos UI | snake_case | `drop_zone.py`, `kpi_card.py` |
| Clases UI | PascalCase | `DropZone`, `KpiCard` |
| Funciones | camelCase | `_buildHeader()`, `_onFileSelected()` |
| CSS classes | kebab-case | `.g360-card`, `.kpi-value` |
| Web Components | kebab-case | `<g360-signature>`, `<g360-card>` |
| Signals/Stores | camelCase | `$isLoading`, `filteredItems` |
| Event handlers | on + PascalCase | `onClick`, `onFileChange` |

### 1.2 Theme Colors (Todos los frameworks)

Definidos en `skill.json` y expuestos como variables CSS o constantes:

```css
/* CSS custom properties (React, Solid, Svelte, Lit) */
:root {
  --g360-bg: #0b1220;
  --g360-surface: #1a2332;
  --g360-accent: #00d084;
  --g360-text: #f0f4f8;
  --g360-muted: #94a3b8;
  --g360-success: #22c55e;
  --g360-warning: #f59e0b;
  --g360-error: #ef4444;
  --g360-radius: 12px;
  --g360-blur: 12px;
}
```

```python
# G360Theme (Flet, CustomTkinter)
theme = G360Theme()
theme.bg      # "#0b1220"
theme.accent  # "#00d084"
```

---

## 2. Flet Desktop (Python)

### 2.1 Patron de Clase App

```python
class MiApp:
    def __init__(self, page: ft.Page):
        self.page = page
        self.theme = G360Theme()
        self._setup_page()
        self._build_ui()

    def _setup_page(self):
        self.page.title = self.theme.build_name()
        self.page.bgcolor = self.theme.bg
        self.page.theme_mode = ft.ThemeMode.DARK
        self.page.window_width = 1350
        self.page.window_height = 900

    def _build_ui(self):
        self.loading = self.theme.loading_overlay()
        self.page.add(ft.Stack([
            ft.Column([self._header(), self._content(), self.theme.footer_signature()]),
            self.loading,
        ], expand=True))
```

### 2.2 Componentes UI en archivos separados

```
src/ui/
├── components/          # Componentes reutilizables
│   ├── kpi_card.py      # KpiCard(page, theme, label, value, delta)
│   ├── drop_zone.py     # DropZone(page, theme, on_file)
│   └── loading.py       # LoadingOverlay(page, theme)
├── views/               # Vistas completas (una por tab/section)
│   ├── dashboard.py     # DashboardView(page, theme, data)
│   └── reportes.py      # ReportesView(page, theme, data)
└── __init__.py
```

### 2.3 Threading (obligatorio para ops bloqueantes)

```python
import threading

def _on_process(self):
    self.show_loading("Procesando datos...")
    def task():
        try:
            result = self.processor.run()
            self.page.run_thread(self._on_result, result)
        except Exception as e:
            self.page.run_thread(self._on_error, str(e))
    threading.Thread(target=task, daemon=True).start()
```

### 2.4 Loading State

Toda operacion bloqueante DEBE mostrar feedback visual usando `self.show_loading()` / `self.hide_loading()`.

---

## 3. React (Web/PWA)

### 3.1 Patron de Componente

```jsx
import { useState, useEffect } from 'react';
import './styles.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(d => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="g360-page">
      <Header />
      {loading ? <LoadingOverlay /> : <Content data={data} />}
      <FooterSignature />
    </div>
  );
}
```

### 3.2 Estructura de Archivos

```
src/
├── components/
│   ├── Header.jsx
│   ├── KpiCard.jsx
│   ├── DropZone.jsx
│   ├── LoadingOverlay.jsx
│   ├── DataTable.jsx
│   └── FooterSignature.jsx
├── hooks/
│   ├── useTheme.js        # Lee skill.json o CSS variables
│   └── useG360Data.js
├── styles/
│   ├── main.css           # Tema G360 global
│   └── components/        # Estilos por componente
├── App.jsx
└── main.jsx
```

### 3.3 G360 Theme Hook

```jsx
// hooks/useTheme.js
export function useTheme() {
  return {
    bg: getComputedStyle(document.documentElement).getPropertyValue('--g360-bg').trim(),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--g360-accent').trim(),
    // ...
  };
}
```

---

## 4. SolidJS (Web/PWA)

### 4.1 Patron de Componente

```jsx
import { createSignal, createMemo, onMount } from 'solid-js';
import { useTheme } from '../hooks/useTheme';

export default function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = createSignal(true);
  const [data, setData] = createSignal([]);

  onMount(async () => {
    setData(await fetchData());
    setLoading(false);
  });

  const totalKpi = createMemo(() =>
    data().reduce((sum, item) => sum + item.valor, 0)
  );

  return (
    <div class="g360-page" style={{ 'background-color': theme.bg }}>
      <Header />
      {loading() && <LoadingOverlay />}
      <KpiCard label="Total" value={totalKpi()} />
    </div>
  );
}
```

### 4.2 Signals vs State

| React | SolidJS |
|---|---|
| `useState` | `createSignal` |
| `useMemo` | `createMemo` |
| `useEffect` | `createEffect` / `onMount` |
| `useContext` | `createContext` |

---

## 5. Svelte / SvelteKit (Web/PWA)

### 5.1 Patron de Componente (.svelte)

```svelte
<script>
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';
  import Header from '$lib/components/Header.svelte';
  import KpiCard from '$lib/components/KpiCard.svelte';
  import FooterSignature from '$lib/components/FooterSignature.svelte';

  let loading = true;
  let data = [];

  onMount(async () => {
    data = await fetchData();
    loading = false;
  });
</script>

<div class="g360-page" style="background-color: {$theme.bg}">
  <Header />
  {#if loading}
    <LoadingOverlay />
  {:else}
    <KpiCard label="Total" value={data.length} />
  {/if}
  <FooterSignature />
</div>
```

### 5.2 Store de Tema

```js
// src/lib/stores/theme.js
import { readable } from 'svelte/store';

export const theme = readable({
  bg: '#0b1220',
  surface: '#1a2332',
  accent: '#00d084',
  // ...
});
```

---

## 6. Lit Web Components (Web/PWA)

### 6.1 Patron de Componente

```js
import { LitElement, html, css } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

export class G360Card extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: Number },
  };

  static styles = css`
    :host { display: block; }
    .card {
      background: var(--g360-surface, #1a2332);
      border-radius: var(--g360-radius, 12px);
      padding: 20px;
    }
  `;

  render() {
    return html`
      <div class="card">
        <span class="label">${this.label}</span>
        <span class="value">${this.value}</span>
      </div>
    `;
  }
}
customElements.define('g360-card', G360Card);
```

### 6.2 CSS Variables Globales

```css
/* src/styles/main.css */
:root {
  --g360-bg: #0b1220;
  --g360-surface: #1a2332;
  --g360-accent: #00d084;
  /* ... */
}
```

---

## 7. CustomTkinter (Python Desktop)

### 7.1 Patron de Clase

```python
import customtkinter as ctk

class MiApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("green")
        self.title("G360 App")
        self.geometry("1350x900")
        self._build_ui()

    def _build_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)
        # Similar a Flet pero con CTkFrame, CTkLabel, etc.
```

---

## 8. Componentes UI Reutilizables (Todos los Frameworks)

| Componente | Flet | React | SolidJS | Svelte | Lit |
|---|---|---|---|---|---|
| **Header** | `_build_header()` | `<Header />` | `<Header />` | `<Header />` | `<g360-header>` |
| **KPI Card** | `KpiCard(theme)` | `<KpiCard />` | `<KpiCard />` | `<KpiCard />` | `<g360-kpi-card>` |
| **Data Table** | `DataTable(theme)` | `<DataTable />` | `<DataTable />` | `<DataTable />` | `<g360-table>` |
| **Drop Zone** | `DropZone(theme)` | `<DropZone />` | `<DropZone />` | `<DropZone />` | `<g360-drop-zone>` |
| **Loading** | `LoadingOverlay()` | `<LoadingOverlay />` | `<LoadingOverlay />` | `<LoadingOverlay />` | `<g360-loading>` |
| **Footer** | `theme.footer_signature()` | `<FooterSignature />` | `<FooterSignature />` | `<FooterSignature />` | `<g360-signature>` |
| **Export Menu** | PopupMenuButton | Dropdown menu | Dropdown menu | Dropdown menu | `<g360-export-menu>` |

---

## 9. Responsive Design

### 9.1 Desktop (Flet, CustomTkinter)
- Window: 1350x900
- Layout responsivo via `ft.ResponsiveRow` o columnas adaptables
- Min width: 1024px

### 9.2 Web (React, Solid, Svelte, Lit)
```css
/* Mobile-first */
.g360-page {
  padding: 16px;
}
@media (min-width: 768px) {
  .g360-page { padding: 24px; }
}
@media (min-width: 1024px) {
  .g360-page { padding: 32px; }
}
```

---

## 10. Checklist UI/UX para Agentes

- [ ] Los colores vienen de `skill.json` / CSS variables, no hardcodeados
- [ ] Operaciones bloqueantes tienen loading state visible
- [ ] Errores se muestran al usuario (no solo en consola)
- [ ] Header tiene logo + titulo de la app
- [ ] Footer tiene signature G360 (logo + "powered by G360")
- [ ] Componentes UI en archivos separados (no todo en un solo file)
- [ ] Core (logica) no importa el framework UI
- [ ] Naming consistente con la tabla de convenciones
- [ ] PWA: manifest.json + service worker + offline support
- [ ] Desktop portable: `run.bat` + `build-portable.bat` + `.python-version`

---

## 11. Web Components G360 - Patron de Unificacion

Cada framework reinventa los mismos componentes. El ecosistema tiene **g360-signature** como unico paquete compartido. Para unificar:

### 11.1 Componentes que deberian ser paquete compartido

| Componente | Funcion | Prioridad |
|---|---|---|
| `<g360-header>` | Header con logo + titulo | ALTA |
| `<g360-kpi-card>` | Card de KPI con valor + label + delta | ALTA |
| `<g360-table>` | Tabla estilizada con sort/pagination | ALTA |
| `<g360-drop-zone>` | Zona de carga de archivos | ALTA |
| `<g360-loading>` | Overlay de carga con spinner | MEDIA |
| `<g360-export-menu>` | Menu desplegable de exportacion | MEDIA |
| `<g360-footer>` | Footer con signature | BAJA |
| `<g360-toast>` | Notificaciones toast/snackbar | BAJA |

### 11.2 Donde deberian vivir

```
g360-signature/           # Ya existe como paquete npm
g360-web-components/      # Nuevo: todos los web components compartidos
├── index.js              # Re-exporta todos
├── package.json
├── src/
│   ├── g360-header.js
│   ├── g360-kpi-card.js
│   ├── g360-table.js
│   ├── g360-drop-zone.js
│   └── g360-loading.js
└── README.md
```

### 11.3 Mientras tanto: patron adapter por framework

```jsx
// React: wrapper que emula el web component
// components/G360Card.jsx
export function G360Card({ label, value, delta }) {
  const theme = useTheme();
  return (
    <div className="g360-card" style={{background: theme.surface}}>
      <span style={{color: theme.muted}}>{label}</span>
      <span style={{color: theme.accent}}>{value}</span>
    </div>
  );
}
```

```svelte
<!-- Svelte: mismo patron, mismo CSS -->
<script>
  export let label;
  export let value;
</script>

<div class="g360-card" style="background: var(--g360-surface)">
  <span class="label">{label}</span>
  <span class="value">{value}</span>
</div>
```

```js
// Lit: nativo web component, reutilizable en todos
// components/g360-kpi-card.js
import { LitElement, html, css } from 'lit';
export class G360KpiCard extends LitElement { ... }
customElements.define('g360-kpi-card', G360KpiCard);
```

---

## 12. Temas Relacionados

- `G360-CLI-SKILL.md` - Skills y snippets disponibles
- `FLET-DESKTOP-FEEDBACK.md` - Lecciones aprendidas de Flet
- `src/assets/snippets/snippets.json` - Todos los snippets
- `src/assets/brand/brand.json` - Assets de marca
