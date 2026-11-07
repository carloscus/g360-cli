# GLOSARIO.md — nomenclatura del ecosistema G360

Regla de idioma aplicada a **todos** los repos, comandos, nombres de agente y metadata visible.

**Fuente canónica:** este archivo. `g360 init` lo consulta para nombrar repos nuevos. Los agentes lo leen para mantener consistencia.

---

## Regla de capas

| Capa | Idioma | Ejemplo |
|---|---|---|
| Nombre de repo y carpeta | Inglés, kebab-case | `g360-overtime-hours` |
| Nombre de paquete (`package.json`) | Inglés | `"name": "g360-overtime-hours"` |
| Funciones, variables, archivos, claves JSON | Inglés, camelCase/snake_case | `calculateOvertime()` |
| Comandos CLI | Inglés | `g360 ingest`, `g360 audit` |
| Título de app / ventana / PPTX | Español | "Horas Extras" |
| Textos de UI, mensajes de error | Español | "No se encontró el archivo" |
| README y documentación para usuarios | Español | — |
| Documentación técnica y comentarios de código | Inglés | `// normalize headers before processing` |

Slug ≠ nombre visible. El nombre visible es metadato, nunca se deriva del slug.

---

## Tabla de repositorios

| Slug (inglés, kebab-case) | Display name (es) | Dominio |
|---|---|---|
| `g360-cli` | g360 CLI | infraestructura |
| `g360-master-data` | Datos maestros | datos |
| `g360-ventas-pulse` | Pulse Ventas | ventas |
| `g360-price-audit` | Auditoría de Precios | finanzas |
| `g360-stock-monitor` | Monitor de Stock | logística |
| `g360-stock-reporter-lit` | Reporte de Stock | logística |
| `g360-stock-api` | API de Stock | infraestructura |
| `g360-order-form` | Formulario de Pedidos | ventas |
| `g360-order-xlsx` | Procesador de Pedidos Excel | ventas |
| `g360-return-form` | Formulario de Devoluciones | ventas |
| `g360-discount-calculator` | Calculadora de Descuentos | finanzas |
| `g360-day-calculator` | Calculadora de Días Laborables | rrhh |
| `g360-erp-nc-sustentor` | Sustentación de NC | ERP |
| `g360-erp-price-manager` | Gestor de Precios ERP | ERP |
| `g360-erp-pedido-vigencias` | Pedidos y Vigencias | ERP |
| `g360-erp-preorder-allocator` | Allocador de Preventa | ERP |
| `g360-erp-stock-consolidator` | Consolidador de Stock | ERP |
| `g360-Horas_Extras` | Horas Extras | rrhh ⚠️ *renombrar* |
| `g360-outlook-extractor` | Extractor de Outlook | productividad |
| `g360-signature` | Firma G360 | branding |
| `g360-signature-creator` | Creador de Firmas | branding |
| `g360-textofix` | Fix de Texto | utilidad |
| `g360-ventas-api` | API de Ventas | infraestructura |
| `g360-ventas-db` | Base de Datos de Ventas | datos |

⚠️ `g360-Horas_Extras` viola la regla de kebab-case minúscula. Ver Fase 3.

---

## Términos de dominio

| Español | Slug inglés | Nota |
|---|---|---|
| Horas extras | `overtime-hours` | — |
| Nota de crédito | `credit-note` | Jerga interna: "NC" |
| Documento de ingreso | `income-document` | — |
| Pedido | `order` | — |
| Vigencia | `validity` | Matiz comercial, no traducir literal |
| Sustentación | `justification` | Contexto NC |
| Preventa | `preorder` | — |
| Allocador | `allocator` | — |

Términos sin traducción limpia se registran con justificación en la columna Nota.

---

## Uso desde `g360 init`

```bash
g360 init horas-extras --domain rrhh
# → crea carpeta g360-overtime-hours/
# → package.json: "name": "g360-overtime-hours"
# → README H1: "Horas Extras"
```

El domain determina el skill default (rrhh → minimalista). El displayName se lee del GLOSARIO si existe; si no, el agente pregunta.

---

## Mantenimiento

Agregar un repo nuevo → editar esta tabla. Agregar un término nuevo → agregar a la tabla de dominio. El GLOSARIO es fuente de verdad; si un nombre no está registrado, no existe.
