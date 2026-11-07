/**
 * Catálogo canónico de campos para datos ERP del ecosistema G360.
 *
 * Fuente única de verdad para:
 * - Nombres canónicos de campos (español, MAYÚSCULAS — contrato actual)
 * - Aliases de mapeo desde reportes ERP (SKU, Código, COD_ART, etc.)
 * - Tipo semántico (string, number, money, date, boolean)
 * - Reglas de formato y validación
 *
 * `g360 ingest` lee este catálogo para normalizar encabezados.
 * Los generadores de validadores (Python/TypeScript) producen código
 * a partir de él; no se editan a mano.
 */
export const DATA_CATALOG = {
  version: '1.0.0',
  lastReview: '2026-11-07',

  /**
   * Campos canónicos organizados por dominio.
   * Cada campo tiene: aliases, type, format, required.
   */
  fields: {
    // ── Producto ──────────────────────────────────────────────
    PRODUCT_CODE: {
      alias: ['CODIGO', 'COD_ART', 'SKU', 'ARTICULO', 'ITEM', 'REFERENCIA'],
      type: 'string',
      format: 'text',
      required: true,
      description: 'Identificador único del producto. Preservar ceros a la izquierda.',
    },
    PRODUCT_NAME: {
      alias: ['DESCRIPCION', 'NOMBRE', 'DETALLE', 'DESC'],
      type: 'string',
      format: 'text',
      required: false,
      description: 'Descripción legible del producto.',
    },

    // ── Precio ────────────────────────────────────────────────
    PRECIO_BASE: {
      alias: ['PRECIO', 'PVENTA', 'VALOR', 'MONTO', 'TOTAL'],
      type: 'money',
      format: 'PEN',
      required: true,
      description: 'Precio base en soles (S/). Sin IGV.',
    },
    RECARGO_UNITARIO: {
      alias: ['RECARGO', 'AJUSTE', 'DIFERENCIA'],
      type: 'money',
      format: 'PEN',
      required: false,
      description: 'Diferencia entre precio facturado y precio base.',
    },
    CANTIDAD: {
      alias: ['CANT', 'CANTIDAD_FAE', 'CANT_SAP'],
      type: 'number',
      format: 'decimal',
      required: true,
      description: 'Cantidad facturada. Puede ser negativa (devoluciones).',
    },

    // ── Documento ─────────────────────────────────────────────
    TPO_DOC: {
      alias: ['TPO_DOC', 'TIPO_DOC', 'DOCUMENTO', 'FORMATO'],
      type: 'string',
      format: 'enum:F01,F03,F20,F21,NC,NDB,BDI,NE',
      required: true,
      description: 'Tipo de documento: F01=Factura, NC=Nota de crédito, etc.',
    },
    SERIE_DOC: {
      alias: ['SERIE', 'SERIE_DOC'],
      type: 'string',
      format: 'text',
      required: true,
      description: 'Serie del documento (F01, F20, etc.).',
    },
    NRO_DOC: {
      alias: ['NRO', 'NUMERO', 'NRO_DOC', 'SECUENCIAL'],
      type: 'string',
      format: 'text',
      required: true,
      description: 'Número secuencial del documento.',
    },

    // ── Cliente ───────────────────────────────────────────────
    CLIENTE_RUC: {
      alias: ['RUC', 'RUC_CLIENTE', 'DOC_IDENTIDAD'],
      type: 'string',
      format: 'text',
      required: true,
      description: 'RUC o DNI del cliente (11 o 8 dígitos).',
    },
    CLIENTE_NOMBRE: {
      alias: ['CLIENTE', 'RAZON_SOCIAL', 'NOMBRE_CLIENTE'],
      type: 'string',
      format: 'text',
      required: false,
      description: 'Razón social o nombre del cliente.',
    },

    // ── Fecha ─────────────────────────────────────────────────
    FECHA_EMISION: {
      alias: ['FECHA', 'FECHA_EMISION', 'FEMIS', 'FECHA_DOC'],
      type: 'date',
      format: 'iso8601',
      required: true,
      description: 'Fecha de emisión del documento. Almacenar como ISO 8601.',
    },

    // ── Sucursal ──────────────────────────────────────────────
    SUCURSAL: {
      alias: ['SUCURSAL', 'CENTRO_COSTO', 'DELEGACION'],
      type: 'string',
      format: 'text',
      required: false,
      description: 'Sucursal o centro de costo donde se origina el documento.',
    },

    // ── Vendedor ──────────────────────────────────────────────
    VENDEDOR: {
      alias: ['VENDEDOR', 'AGENTE', 'COMERCIAL'],
      type: 'string',
      format: 'text',
      required: false,
      description: 'Vendedor responsible de la operación.',
    },
  },

  /**
   * Tipos semánticos soportados con sus reglas de formato.
   */
  types: {
    string: { validator: 'isString', coerce: 'trim' },
    number: { validator: 'isNumber', coerce: 'parseFloat' },
    money: {
      validator: 'isDecimal',
      coerce: 'toDecimal',
      precision: 2,
      // Los valores vienen como texto desde Excel (comas/puntos intercambiados)
      parseRules: ['remove-thousands-dot', 'replace-comma-decimal'],
    },
    date: {
      validator: 'isValidDate',
      coerce: 'toDateISO',
      formats: ['dd/mm/yyyy', 'yyyy-mm-dd', 'excel-serial'],
    },
  },
};

/**
 * Genera un validador Python a partir del catálogo.
 * Retorna código fuente listo para usar en `core/validators.py`.
 */
export function generatePythonValidator(catalog = DATA_CATALOG) {
  const lines = [
    '# Auto-generado desde data-catalog.json — NO EDITAR',
    'from decimal import Decimal, InvalidOperation',
    'from datetime import datetime',
    '',
    '',
  ];

  for (const [fieldName, field] of Object.entries(catalog.fields)) {
    if (field.type === 'money') {
      lines.push(`def validate_${fieldName.toLowerCase()}(raw: str) -> Decimal:`);
      lines.push(`    """Valida y convierte ${fieldName} a Decimal."""`);
      lines.push(`    if not raw:`);
      lines.push(`        return Decimal("0.00") if not ${field.required} else None`);
      lines.push(`    # Normalizar: SAP usa punto como miles, coma como decimal`);
      lines.push(`    s = str(raw).strip().replace(".", "").replace(",", ".")`);
      lines.push(`    try:`);
      lines.push(`        return Decimal(s)`);
      lines.push(`    except InvalidOperation:`);
      lines.push(`        raise ValueError(f"${fieldName}: valor inválido '{raw}'")`);
      lines.push('');
    } else if (field.type === 'date') {
      lines.push(`def validate_${fieldName.toLowerCase()}(raw) -> str | None:`);
      lines.push(`    """Normaliza ${fieldName} a ISO 8601."""`);
      lines.push(`    if raw is None:`);
      lines.push(`        return None`);
      lines.push(`    # Intentar múltiples formatos`);
      lines.push(`    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):`);
      lines.push(`        try:`);
      lines.push(`            return datetime.strptime(str(raw), fmt).strftime("%Y-%m-%d")`);
      lines.push(`        except ValueError:`);
      lines.push(`            pass`);
      lines.push(`    raise ValueError(f"${fieldName}: fecha inválida '{raw}'")`);
      lines.push('');
    } else {
      lines.push(`def validate_${fieldName.toLowerCase()}(raw):`);
      lines.push(`    """Valida ${fieldName} (tipo ${field.type})."""`);
      lines.push(`    if not raw and not ${field.required}:`);
      lines.push(`        return None`);
      lines.push(`    return str(raw).strip()`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Genera un diccionario de mapeo de aliases → canónico.
 * Útil para `ingestion.py`: `{alias_lower: CANONICAL_FIELD}`
 */
export function buildAliasMap(catalog = DATA_CATALOG) {
  const map = {};
  for (const [canonical, field] of Object.entries(catalog.fields)) {
    for (const alias of field.alias) {
      map[alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = canonical;
    }
  }
  return map;
}
