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
| `-d, --dir <ruta>` | Directorio destino | `.` |
| `--dry-run` | Previsualizar sin crear | `false` |
| `--force` | Sobrescribir existente | `false` |

**Ejemplos:**

```bash
# Proyecto web PWA
g360 init mi-webapp

# Proyecto Python CLI
g360 init mi-cli --template python-cli

# Preview sin crear
g360 init mi-proyecto --dry-run
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

Limpia assets G360 embebidos.

```bash
g360 clean [ruta] [opciones]
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--dry-run` | Previsualizar archivos |
| `--force` | Omitir confirmación |

**Ejemplo:**

```bash
# Preview de archivos a eliminar
g360 clean --dry-run

# Eliminar (requiere --force)
g360 clean --force
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

### web-pwa

Plantilla PWA con soporte offline.

```
mi-proyecto/
├── index.html
├── styles.css
├── app.js
├── manifest.json
└── g360-manifest.json
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
└── g360-manifest.json
```

### vba-excel

Plantilla VBA para Excel.

```
mi-excel/
├── src/
│   ├── Module_Main.bas
│   ├── g360-datamap.bas
│   └── skill.json
└── g360-manifest.json
```

---

## Componentes

### G360Signature

Firma HTML para emails y documentos.

```jsx
import G360Signature from './g360/components/G360Signature.jsx';

const firma = G360Signature({
  name: 'Carlos Cusi',
  role: 'Developer',
  company: 'G360',
  email: 'carlos@g360.dev',
  phone: '+51 999 123 456'
});
```

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

### g360-skill-audit

Audita código fuente.

```javascript
import { audit } from './g360/engine/g360-skill-audit.mjs';

const results = await audit(codeString, { verbose: true });
console.log(results.score, results.issues);
```

### g360-skill-meta-evaluator

Evalúa meta tags SEO.

```javascript
import { evaluateMetaTags } from './g360/engine/g360-skill-meta-evaluator.mjs';

const results = await evaluateMetaTags(htmlString);
console.log(results.score, results.tags);
```

### g360-field-mapper

Mapea campos entre sistemas.

```javascript
import { mapField, validateMapping } from './g360/engine/g360-field-mapper.js';

const mapping = mapField('cliente_nombre', fieldMap);
const validation = validateMapping(data, fieldMap);
```

### g360-data-validator

Valida datos contra reglas.

```javascript
import { validate } from './g360/engine/g360-data-validator.js';

const rules = {
  email: { required: true, type: 'string' },
  edad: { type: 'number', min: 18, max: 99 }
};

const results = validate(data, rules);
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
