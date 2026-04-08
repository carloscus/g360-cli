# g360-cli

> CLI tool for bootstrapping G360 ecosystem projects with standardized structure, assets, and best practices.

[![npm version](https://img.shields.io/npm/v/g360-cli)](https://www.npmjs.com/package/g360-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Inicio Rápido](#inicio-rápido)
- [Comandos](#comandos)
- [Plantillas](#plantillas)
- [Componentes](#componentes)
- [Skills](#skills)
- [Configuración](#configuración)
- [API](#api)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## Características

- **Inicialización rápida** - Crea proyectos G360 con estructura estándar
- **Gestión de assets** - Trae componentes, skills y plantillas embebidas
- **Auditoría** - Verifica compliance de proyectos G360
- **Limpieza** - Elimina assets embebidos antes de deployment
- **Multi-plantilla** - Web PWA, Python CLI, VBA Excel
- **Modo offline** - Funciona sin conexión usando assets cacheados
- **Preview** - Dry-run para previsualizar cambios

---

## Instalación

### Requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0

### Instalación global

```bash
npm install -g g360-cli
```

### Verificar instalación

```bash
g360 --version
g360 health
```

---

## Inicio Rápido

```bash
# 1. Inicializar nuevo proyecto
g360 init mi-proyecto

# 2. Entrar al proyecto
cd mi-proyecto

# 3. Traer assets G360
g360 bring

# 4. Ver estructura
g360 present

# 5. Auditar proyecto
g360 audit

# 6. Limpiar antes de deploy
g360 clean
```

---

## Comandos

### `g360 init`

Inicializa un nuevo proyecto G360.

```bash
g360 init <nombre> [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-t, --template <tipo>` | Tipo de plantilla | `web-pwa` |
| `-s, --skill <skill>` | Skill a usar | `corporativo-movil` |
| `-d, --dir <ruta>` | Directorio destino | `.` |
| `--dry-run` | Previsualizar sin crear | `false` |
| `--force` | Sobrescribir existente | `false` |

**Ejemplos:**

```bash
# Proyecto Lit para cliente móvil
g360 init mi-proyecto --template lit-web --skill corporativo-movil

# Proyecto Solid para herramienta propia
g360 init mi-herramienta --template solid-web --skill moderno-movil

# Proyecto SvelteKit minimalista
g360 init mi-script --template svelte-web --skill minimalista

# Preview sin crear
g360 init mi-proyecto --dry-run
```

---

### `g360 set-skill`

Cambia el skill del proyecto actual.

```bash
g360 set-skill <skill> [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--verbose` | Mostrar detalles |
| `--force` | Sobrescribir skill existente |

**Ejemplos:**

```bash
# Cambiar a skill corporativo para PC
g360 set-skill corporativo

# Cambiar a skill moderno para móvil
g360 set-skill moderno-movil

# Ver detalles del skill
g360 set-skill corporativo-g360 --verbose
```

---

### `g360 convert`

Convierte un proyecto existente a identidad G360.

```bash
g360 convert [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `-s, --skill <skill>` | Skill a aplicar | `corporativo-movil` |
| `--dry-run` | Previsualizar sin aplicar | `false` |
| `--restructure` | Reestructurar archivos | `false` |
| `--force` | Forzar cambios peligrosos | `false` |
| `--backup` | Crear backup antes | `false` |

**Ejemplos:**

```bash
# Preview de cambios
g360 convert . --dry-run

# Convertir proyecto existente
g360 convert ./mi-proyecto --skill corporativo

# Con backup automático
g360 convert . --skill moderno --backup

# Forzar cambios peligrosos
g360 convert . --skill corporativo-movil --force
```

---

### `g360 bring`

Trae assets G360 al proyecto actual.

```bash
g360 bring [asset] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `-p, --path <ruta>` | Ruta destino |
| `--dry-run` | Previsualizar |
| `--force` | Sobrescribir |

**Ejemplos:**

```bash
# Traer todos los assets
g360 bring

# Traer solo componentes
g360 bring components

# Traer solo skills
g360 bring skills

# Traer engine específico
g360 bring engine/g360-skill-audit
```

---

### `g360 list`

Lista assets disponibles.

```bash
g360 list [tipo] [opciones]
```

**Tipos:**

| Tipo | Descripción |
|------|-------------|
| `templates` | Lista de plantillas |
| `components` | Lista de componentes |
| `skills` | Lista de skills |
| `all` | Todo (por defecto) |

**Ejemplos:**

```bash
# Listar todo
g360 list

# Solo plantillas
g360 list templates

# Solo componentes
g360 list components

# Salida JSON
g360 list --json
```

---

### `g360 present`

Presenta la estructura del proyecto.

```bash
g360 present [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| `--depth <n>` | Profundidad máxima | `3` |

**Ejemplo:**

```bash
g360 present
g360 present ./mi-proyecto --depth 2
```

---

### `g360 audit`

Audita el proyecto para compliance G360.

```bash
g360 audit [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--fix` | Auto-corregir problemas |
| `--verbose` | Salida detallada |

**Ejemplo:**

```bash
g360 audit
g360 audit ./mi-proyecto --verbose
```

---

### `g360 clean`

Limpia código muerto, duplicados y archivos huérfanos del proyecto.

```bash
g360 clean [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--dry-run` | Previsualizar archivos |
| `--force` | Omitir confirmación |
| `--dead` | Eliminar archivos muertos/descontinuados |
| `--duplicates` | Eliminar archivos duplicados |
| `--orphans` | Eliminar archivos huérfanos (sin referencias) |
| `--organize` | Mostrar archivos descolocados |
| `--all` | Ejecutar todas las verificaciones |

**Ejemplos:**

```bash
# Preview de limpieza completa
g360 clean --dry-run --all

# Solo archivos muertos
g360 clean --dead --force

# Solo duplicados
g360 clean --duplicates --force

# Verificar huérfanos (sin eliminar)
g360 clean --orphans --dry-run
```

---

### `g360 health`

Verifica el estado del sistema.

```bash
g360 health [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--verbose` | Info detallada |

**Ejemplo:**

```bash
g360 health
g360 health --verbose
```

---

### `g360 update`

Actualiza g360-cli a la última versión.

```bash
g360 update [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--check` | Solo verificar sin actualizar |

**Ejemplo:**

```bash
# Verificar nueva versión
g360 update --check

# Actualizar
g360 update
```

---

## Plantillas

### lit-web

Plantilla Web Components con Lit.

```
mi-proyecto/
├── index.html
├── src/
│   ├── index.js
│   ├── components/
│   │   └── app-root.js
│   └── styles/
│       └── main.css
├── vite.config.js
├── package.json
└── skill.json
```

### solid-web

Plantilla con SolidJS.

```
mi-proyecto/
├── index.html
├── src/
│   ├── index.jsx
│   ├── components/
│   │   └── App.jsx
│   └── styles/
│       └── main.css
├── vite.config.js
├── package.json
└── skill.json
```

### svelte-web

Plantilla con SvelteKit.

```
mi-proyecto/
├── src/
│   ├── app.html
│   ├── app.css
│   ├── routes/
│   │   └── +page.svelte
│   └── core/
│       └── skill.json
├── svelte.config.js
├── package.json
└── skill.json
```

### web-pwa (React)

Plantilla React + Vite con PWA.

```
mi-proyecto/
├── index.html
├── app.js
├── styles.css
├── manifest.json
└── package.json
```

### python-cli

Plantilla CLI de Python.

```
mi-cli/
├── src/
│   ├── main.py
│   └── core/
│       └── skill.json
├── requirements.txt
└── skill.json
```

### vba-excel

Plantilla VBA para Excel.

```
mi-excel/
├── src/
│   ├── Module_Main.bas
│   ├── g360-datamap.bas
│   └── skill.json
└── skill.json
```

---

## Componentes

### g360-signature

Firma G360 para proyectos web (Web Component).

```html
<!-- Modo para clientes -->
<g360-signature mode="powered"></g360-signature>

<!-- Modo propio -->
<g360-signature mode="own"></g360-signature>

<!-- Con versión -->
<g360-signature mode="powered" version="1.0.0"></g360-signature>
```

**Atributos:**
- `mode`: "own" (G360 by ccusi) o "powered" (powered by G360)
- `version`: Número de versión opcional

**Características:**
- Isotipo: 3 puntos verticales + chevron >
- Colores: #00d084 (verde), #94a3b8 (gris)
- Opacidad: 0.4 por defecto, 1.0 en hover
- Tema: auto-detecta prefers-color-scheme

### G360DragModal

Modal draggable para interfaces.

```jsx
import G360DragModal from './g360/components/G360DragModal.jsx';

G360DragModal({
  isOpen: true,
  title: 'Configuración',
  onClose: () => setOpen(false),
  children: '<p>Contenido del modal</p>'
});
```

---

## Skills

Los skills definen el estilo visual, dispositivo y signature del proyecto.

### corporativo

Proyectos para clientes - estilo corporativo conservador (PC).

### corporativo-movil

Proyectos para clientes - estilo corporativo - enfoque móvil.

### corporativo-g360

Proyectos para clientes con colores G360 vibrantes (PC).

### corporativo-g360-movil

Proyectos para clientes con colores G360 - enfoque móvil.

### moderno

Herramientas propias G360 - estilo innovador (PC).

### moderno-movil

Herramientas propias G360 - estilo innovador (móvil).

### minimalista

Proyectos minimalistas - scripts, CLI, Python.

### custom

Configuración personalizada - colores ajustables.

### Ejemplos de uso

```bash
# Al crear proyecto
g360 init mi-proyecto --skill corporativo-movil

# Cambiar skill después
g360 set-skill moderno

# Ver skills disponibles
g360 list skills
```

---

## Configuración

### g360-manifest.json

Archivo de manifiesto del proyecto.

```json
{
  "name": "mi-proyecto",
  "template": "web-pwa",
  "version": "1.0.0",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "assets": [
    {
      "name": "components",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Configuración Global

```bash
# Directorio de configuración
~/.g360/

# Assets cacheados
~/.g360/cache/
```

---

## API

### Módulo Principal

```javascript
import { g360 } from 'g360-cli';

await g360.init({ name: 'proyecto', template: 'web-pwa' });
await g360.bring('components');
await g360.audit({ path: '.', verbose: true });
await g360.clean({ path: '.', force: true });
```

---

## Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

---

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## Enlaces

- [npm](https://www.npmjs.com/package/g360-cli)
- [GitHub](https://github.com/carloscus/g360-cli)
- [Documentación](#)
- [Reportar Issue](https://github.com/carloscus/g360-cli/issues)
