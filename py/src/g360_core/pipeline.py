"""
Pipeline de Ingesta para CRM Auxiliar — Plan Maestro 4 Fases.

Transforma el CSV plano de dgvVentas del ERP en un DataFrame maestro
de 12 columnas listo para dashboarding, IA y alimentar la UI de Flet.

Fases:
    1. Saneamiento de la Ingesta (elimina duplicados, unifica moneda, crea FECHA_PROCESO)
    2. Resolución de Jerarquía de Clientes (EMP_RUC, SUCURSAL_ID, CLIENTE_UI)
    3. Tipificación Comercial y Trazabilidad (CATEGORIA_OP, STOCK_DORMIDO)
    4. Exportación del Molde Inmutable (12 columnas destino exactas)
"""

from pathlib import Path
from typing import Optional

import pandas as pd
import numpy as np

from .logger import get_logger
from .commercial_engine import (
    classify_base,
    parse_referencia,
    resolve_document_relationships,
    calculate_prices,
)

log = get_logger("ingestion")

# ─── Constantes ──────────────────────────────────────────────────────────────

MESES_ESP = {
    "ENERO": "01", "FEBRERO": "02", "MARZO": "03", "ABRIL": "04",
    "MAYO": "05", "JUNIO": "06", "JULIO": "07", "AGOSTO": "08",
    "SETIEMBRE": "09", "OCTUBRE": "10", "NOVIEMBRE": "11", "DICIEMBRE": "12",
}

MOLDE_INMUTABLE = [
    "FECHA_PROCESO",
    "EMPRESA_RUC",       # RUC o DNI del cliente
    "CLIENTE_TIPO_DOC",  # "RUC" o "DNI"
    "EMPRESA_NOM",       # Nombre legal del cliente
    "SUCURSAL_ID",       # ID único de sucursal
    "CLIENTE_UI",        # Nombre display con sucursal
    "PRODUCTO_NOM",      # Nombre del artículo
    "VENDEDOR_NOM",      # Nombre del vendedor
    "TIPO_DOC",          # Tipo de comprobante (F01, BDI, NCR, NDB, etc.)
    "CATEGORIA_OP",      # VENTA, DEVOLUCION, AJUSTE
    "SUBTIPO_AJUSTE",    # PRECIO_LINEA, PRECIO_PARCIAL, CARGO_FIJO, SIN_BASE
    "CANT_FISICA",       # Cantidad física (positiva o negativa)
    "NETO_SOLES",        # Monto en soles
    "CANTIDAD_FAE",      # Cantidad financiera FAE (para ajustes de precio)
    "PRECIO_BASE",       # Precio unitario base (solo movimientos físicos)
    "PRECIO_EFECTIVO",   # Precio base + recargo unitario
    "STOCK_DORMIDO",     # 1 si stock dormido (>90 días), 0 si no
]

COLUMNAS_ORIGEN_REQUERIDAS = {
    "ANHO", "MES", "DOC_CLIENTE", "NOM_CLIENTE", "COD_SUCURSAL",
    "NOM_SUCURSAL", "ID_ARTICULO", "NOM_ARTICULO", "ID_VENDEDOR",
    "NOM_VENDEDOR", "TPO_DOC", "REFERENCIA", "FECHA_ORIG", "FECHA_REF",
    "CANTIDAD", "SOLES",
}


# ═══════════════════════════════════════════════════════════════════════════════
# FASE 1: SANEAMIENTO DE LA INGESTA
# ═══════════════════════════════════════════════════════════════════════════════

def clean_duplicate_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Elimina columnas duplicadas por nombre.

    El ERP exporta DOC_CLIENTE dos veces (cols 3 y 42).
    La segunda aparicion (DOC_CLIENTE.1) se descarta.

    Returns:
        DataFrame sin columnas repetidas.
    """
    cols = df.columns.tolist()
    vistos = {}
    keep = []
    for i, c in enumerate(cols):
        key = c.strip().lower()
        if key in vistos:
            log.info("Columna duplicada eliminada: '%s' (idx %d)", c, i)
        else:
            vistos[key] = i
            keep.append(c)
    return df[keep]


def unify_currency(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fuerza la columna SOLES a float64 y descarta DOLARES.

    - Ignora la columna DOLARES (la operacion es estrictamente en Soles).
    - Convierte SOLES a float, reemplaza NaN/vacios con 0.0.
    """
    if "DOLARES" in df.columns:
        df = df.drop(columns=["DOLARES"])

    if "SOLES" in df.columns:
        df["SOLES"] = (
            pd.to_numeric(df["SOLES"], errors="coerce")
            .fillna(0.0)
        )
    return df


def build_fecha_proceso(df: pd.DataFrame) -> pd.DataFrame:
    """
    Construye FECHA_PROCESO como el primer dia del mes.

    Toma ANHO (ej: "2026") y MES (ej: "06-JUNIO") y crea
    una columna datetime YYYY-MM-01.

    Si ANHO o MES faltan, intenta inferir de FECHA_ORIG.
    """
    fecha_proceso = pd.Series(pd.NaT, index=df.index, dtype="datetime64[ns]")

    if "ANHO" in df.columns and "MES" in df.columns:
        mes_num = (
            df["MES"]
            .astype(str)
            .str.upper()
            .str.strip()
            .str.extract(r"(\d{2})", expand=False)
        )
        anho = (
            df["ANHO"]
            .astype(str)
            .str.strip()
            .str.extract(r"(\d{4})", expand=False)
        )
        valido = mes_num.notna() & anho.notna()
        fecha_proceso[valido] = pd.to_datetime(
            anho[valido] + "-" + mes_num[valido] + "-01",
            errors="coerce",
        )

    fallbacks = fecha_proceso.isna()
    if fallbacks.any() and "FECHA_ORIG" in df.columns:
        orig = pd.to_datetime(df.loc[fallbacks, "FECHA_ORIG"], dayfirst=True, errors="coerce")
        fecha_proceso[fallbacks] = orig - pd.offsets.MonthBegin(1)
        fecha_proceso[fallbacks & orig.isna()] = pd.NaT

    df["FECHA_PROCESO"] = fecha_proceso
    return df


# ═══════════════════════════════════════════════════════════════════════════════
# FASE 2: RESOLUCION DE JERARQUIA DE CLIENTES
# ═══════════════════════════════════════════════════════════════════════════════

def resolve_client_hierarchy(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea CLIENTE_DOC, CLIENTE_TIPO_DOC y EMPRESA_NOM usando DOC_CLIENTE.

    - CLIENTE_DOC: DOC_CLIENTE limpio (RUC o DNI segun longitud).
    - CLIENTE_TIPO_DOC: "RUC" si 11 digitos, "DNI" si 8 digitos.
    - EMPRESA_NOM: primer NOM_CLIENTE asociado a ese documento.
    """
    if "DOC_CLIENTE" not in df.columns or "NOM_CLIENTE" not in df.columns:
        df["CLIENTE_DOC"] = ""
        df["CLIENTE_TIPO_DOC"] = ""
        df["EMPRESA_NOM"] = ""
        return df

    raw = df["DOC_CLIENTE"].astype(str).str.strip()
    df["CLIENTE_DOC"] = raw

    tipo = pd.Series("RUC", index=df.index)
    tipo[raw.str.match(r"^\d{8}$")] = "DNI"
    df["CLIENTE_TIPO_DOC"] = tipo

    doc_nombre = (
        df[df["NOM_CLIENTE"].notna() & (df["NOM_CLIENTE"].astype(str).str.strip() != "")]
        .groupby("DOC_CLIENTE")["NOM_CLIENTE"]
        .first()
    )
    df["EMPRESA_NOM"] = raw.map(doc_nombre).fillna("")
    return df


def build_sucursal_id(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea SUCURSAL_ID combinando CLIENTE_DOC + COD_SUCURSAL.

    Formato: {CLIENTE_DOC}_{COD_SUCURSAL}
    Si COD_SUCURSAL falta o es nulo, se usa "00".
    """
    if "COD_SUCURSAL" not in df.columns:
        df["SUCURSAL_ID"] = df["CLIENTE_DOC"].astype(str) + "_00"
        return df

    suc = df["COD_SUCURSAL"].fillna("00").astype(str).str.strip()
    df["SUCURSAL_ID"] = df["CLIENTE_DOC"].astype(str) + "_" + suc
    return df


def build_cliente_ui(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea CLIENTE_UI para los dropdowns de Flet.

    Formato:
        - Con sucursal: "EMPRESA_NOM (COD_SUCURSAL - NOM_SUCURSAL)"
        - Sin sucursal: "EMPRESA_NOM"

    Ejemplos:
        "CIPSA (01 - SUCURSAL CENTRO)"
        "EMPRESA SIN SUCURSAL"
    """
    # EMPRESA_NOM debe existir (creada en resolve_client_hierarchy)
    base_name = df.get("EMPRESA_NOM", pd.Series("", index=df.index)).fillna("").astype(str).str.strip()

    # Manejar ausencia de COD_SUCURSAL
    if "COD_SUCURSAL" in df.columns:
        suc_cod = df["COD_SUCURSAL"].fillna("00").astype(str).str.strip()
    else:
        suc_cod = pd.Series("00", index=df.index)

    # Obligar a string por si suc_cod es numérico
    suc_cod = suc_cod.astype(str).str.strip()

    suc_nom = df.get("NOM_SUCURSAL", pd.Series("", index=df.index)).fillna("").astype(str).str.strip()

    # Por defecto: solo nombre de empresa
    df["CLIENTE_UI"] = base_name

    # Filas que tienen sucursal (código no vacío y no "00")
    tiene_suc = (suc_cod != "") & (suc_cod != "00")
    if tiene_suc.any():
        # Construir cadena con código y, si existe, nombre de sucursal
        suc_str = suc_cod[tiene_suc]
        # Agregar nombre si está presente y no es "acumulado"
        con_nombre = tiene_suc & (suc_nom != "") & (suc_nom.str.lower() != "acumulado")
        if con_nombre.any():
            suc_str[con_nombre] = suc_str[con_nombre] + " - " + suc_nom[con_nombre]
        df.loc[tiene_suc, "CLIENTE_UI"] = base_name[tiene_suc] + " (" + suc_str[tiene_suc] + ")"
    return df


# ═══════════════════════════════════════════════════════════════════════════════
# FASE 3: TIPIFICACION COMERCIAL Y TRAZABILIDAD
# ═══════════════════════════════════════════════════════════════════════════════

def detect_stock_dormido(df: pd.DataFrame) -> pd.DataFrame:
    """
    Marca ES_STOCK_DORMIDO = 1 si FECHA_ORIG - FECHA_REF > 90 dias.

    La logica detecta productos que permanecieron en stock
    mas de 90 dias antes de ser vendidos o devueltos.
    """
    STOCK_THRESHOLD = 90

    orig = pd.to_datetime(
        df.get("FECHA_ORIG", pd.Series("", index=df.index)),
        dayfirst=True, errors="coerce",
    )
    ref = pd.to_datetime(
        df.get("FECHA_REF", pd.Series("", index=df.index)),
        dayfirst=True, errors="coerce",
    )

    delta = (orig - ref).dt.days

    df["STOCK_DORMIDO"] = np.where(
        delta.notna() & (delta > STOCK_THRESHOLD),
        1,
        0,
    ).astype(int)
    return df


# ═══════════════════════════════════════════════════════════════════════════════
# FASE 4: EXPORTACION DEL MOLDE INMUTABLE
# ═══════════════════════════════════════════════════════════════════════════════

def _find_fae_col(df: pd.DataFrame) -> str:
    """Encuentra la columna CANTIDAD FAE (puede venir como CANTIDAD_FAE)."""
    for col in df.columns:
        norm = col.upper().replace(" ", "_").replace("-", "_")
        if norm == "CANTIDAD_FAE":
            return col
    return None


def export_master(df: pd.DataFrame) -> pd.DataFrame:
    """
    Selecciona y renombra las columnas del molde inmutable (16 columnas).

    Mapping de columnas origen a destino:
        FECHA_PROCESO     ← FECHA_PROCESO
        EMPRESA_RUC       ← CLIENTE_DOC (RUC o DNI)
        CLIENTE_TIPO_DOC  ← CLIENTE_TIPO_DOC ("RUC" o "DNI")
        EMPRESA_NOM       ← NOM_CLIENTE
        SUCURSAL_ID       ← SUCURSAL_ID
        CLIENTE_UI        ← CLIENTE_UI
        PRODUCTO_NOM      ← NOM_ARTICULO
        VENDEDOR_NOM      ← NOM_VENDEDOR
        TIPO_DOC          ← TPO_DOC
        CATEGORIA_OP      ← CATEGORIA_OP
        SUBTIPO_AJUSTE    ← SUBTIPO_AJUSTE
        CANT_FISICA       ← CANTIDAD (como float)
        NETO_SOLES        ← SOLES
        CANTIDAD_FAE      ← CANTIDAD_FAE / CANTIDAD FAE
        PRECIO_BASE       ← PRECIO_BASE
        PRECIO_EFECTIVO   ← PRECIO_EFECTIVO
        STOCK_DORMIDO     ← STOCK_DORMIDO

    Retorna:
        DataFrame con las 16 columnas en el orden definido por MOLDE_INMUTABLE.
        Si alguna columna origen falta, se rellena con valores por defecto.
    """
    fae_col = _find_fae_col(df)

    mapping = {
        "FECHA_PROCESO": "FECHA_PROCESO",
        "EMPRESA_RUC": "CLIENTE_DOC",
        "CLIENTE_TIPO_DOC": "CLIENTE_TIPO_DOC",
        "EMPRESA_NOM": "NOM_CLIENTE",
        "SUCURSAL_ID": "SUCURSAL_ID",
        "CLIENTE_UI": "CLIENTE_UI",
        "PRODUCTO_NOM": "NOM_ARTICULO",
        "VENDEDOR_NOM": "NOM_VENDEDOR",
        "TIPO_DOC": "TPO_DOC",
        "CATEGORIA_OP": "CATEGORIA_OP",
        "SUBTIPO_AJUSTE": "SUBTIPO_AJUSTE",
        "CANT_FISICA": "CANTIDAD",
        "NETO_SOLES": "SOLES",
        "CANTIDAD_FAE": fae_col if fae_col else "CANTIDAD",
        "PRECIO_BASE": "PRECIO_BASE",
        "PRECIO_EFECTIVO": "PRECIO_EFECTIVO",
        "STOCK_DORMIDO": "STOCK_DORMIDO",
    }

    resultado = pd.DataFrame(index=df.index)

    for col_dest, col_origen in mapping.items():
        if col_origen in df.columns:
            resultado[col_dest] = df[col_origen].copy()
        elif col_dest in df.columns:
            # Ya fue creada con otro nombre
            resultado[col_dest] = df[col_dest].copy()
        else:
            resultado[col_dest] = _default_value(col_dest)

    # Reordenar exactamente como el molde
    resultado = resultado[MOLDE_INMUTABLE]

    # Normalizaciones finales
    resultado["CANT_FISICA"] = pd.to_numeric(resultado["CANT_FISICA"], errors="coerce").fillna(0.0)
    resultado["NETO_SOLES"] = pd.to_numeric(resultado["NETO_SOLES"], errors="coerce").fillna(0.0)
    resultado["CANTIDAD_FAE"] = pd.to_numeric(resultado["CANTIDAD_FAE"], errors="coerce").fillna(0.0)
    resultado["PRECIO_BASE"] = pd.to_numeric(resultado["PRECIO_BASE"], errors="coerce")
    resultado["PRECIO_EFECTIVO"] = pd.to_numeric(resultado["PRECIO_EFECTIVO"], errors="coerce")
    resultado["TIPO_DOC"] = resultado["TIPO_DOC"].astype(str).str.upper().str.strip()
    resultado["STOCK_DORMIDO"] = resultado["STOCK_DORMIDO"].fillna(0).astype(int)

    # Strip de todos los strings para evitar duplicados por espacios
    for col in resultado.select_dtypes(include="object").columns:
        resultado[col] = resultado[col].astype(str).str.strip()

    return resultado


def _default_value(col: str):
    if col in ("STOCK_DORMIDO",):
        return 0
    if col == "CLIENTE_TIPO_DOC":
        return "RUC"
    if col in ("CANT_FISICA", "NETO_SOLES", "CANTIDAD_FAE", "PRECIO_BASE", "PRECIO_EFECTIVO"):
        return 0.0
    return ""


# ═══════════════════════════════════════════════════════════════════════════════
# ORQUESTADOR PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

def ingest_to_master(
    filepath: str,
    output_path: Optional[str] = None,
    drop_totales: bool = True,
) -> pd.DataFrame:
    """
    Orquesta las 4 fases del pipeline de ingesta.

    Parametros:
        filepath: Ruta al archivo CSV o Excel de dgvVentas.
        output_path: Si se especifica, guarda el resultado como CSV.
        drop_totales: Si True, elimina la fila de gran total del ERP.

    Returns:
        DataFrame con las 13 columnas del molde inmutable.
    """
    log.info("=== INICIO PIPELINE INGESTA ===")
    log.info("Leyendo: %s", filepath)

    df = _read_file(filepath)
    if df.empty:
        log.warning("Archivo vacio — devolviendo DataFrame vacio del molde")
        return pd.DataFrame(columns=MOLDE_INMUTABLE)

    log.info("Filas leidas: %d, Columnas: %d", len(df), len(df.columns))

    # ── Fase 1: Saneamiento ──────────────────────────────────────────
    log.info("[Fase 1/4] Saneamiento de la ingesta")
    df = clean_duplicate_columns(df)
    df = unify_currency(df)

    if drop_totales:
        df = _remove_totals_row(df)

    df = build_fecha_proceso(df)

    # ── Fase 2: Jerarquia de Clientes ────────────────────────────────
    log.info("[Fase 2/4] Resolucion de jerarquia de clientes")
    df = resolve_client_hierarchy(df)
    df = build_sucursal_id(df)
    df = build_cliente_ui(df)

    # ── Fase 3: Tipificacion Comercial ───────────────────────────────
    log.info("[Fase 3/4] Tipificacion comercial y trazabilidad")
    df = parse_referencia(df)
    df = classify_base(df)
    df = resolve_document_relationships(df)
    df = detect_stock_dormido(df)

    # Columnas derivadas adicionales (precios, flags, agregados por documento)
    df = calculate_prices(df)
    df = _create_derived_columns(df)

    # ── Fase 4: Exportacion del molde ───────────────────────────────────────
    log.info("[Fase 4/4] Exportacion del molde inmutable")
    master = export_master(df)
    log.info("Filas en molde final: %d", len(master))

    if output_path:
        master.to_csv(output_path, index=False, encoding="utf-8-sig")
        log.info("Archivo guardado: %s", output_path)

    log.info("=== PIPELINE INGESTA COMPLETADO ===")
    return master


def batch_ingest(
    filepaths: List[str],
    output_path: Optional[str] = None,
    drop_totales: bool = True,
    merge_results: bool = True,
) -> pd.DataFrame:
    """
    Procesa múltiples archivos ERP en lote.

    Parametros:
        filepaths: Lista de rutas a archivos CSV/Excel.
        output_path: Si se especifica, guarda el resultado combinado como CSV.
        drop_totales: Si True, elimina filas de totales en cada archivo.
        merge_results: Si True, combina todos los archivos en un solo DataFrame.
                      Si False, retorna una lista de DataFrames individuales.

    Returns:
        DataFrame combinado (merge_results=True) o lista de DataFrames (False).
    """
    log.info("=== INICIO BATCH INGESTA ===")
    log.info("Archivos a procesar: %d", len(filepaths))

    results = []
    sources = []

    for i, fp in enumerate(filepaths, 1):
        log.info("Procesando archivo %d/%d: %s", i, len(filepaths), fp)
        try:
            master_df = ingest_to_master(
                filepath=fp,
                output_path=None,  # No guardar individualmente
                drop_totales=drop_totales
            )
            if not master_df.empty:
                # Añadir columna de trazabilidad
                master_df['ARCHIVO_ORIGEN'] = Path(fp).name
                master_df['ORDEN_LOTE'] = i
                results.append(master_df)
                sources.append(Path(fp))
                log.info("  ✓ %d filas procesadas", len(master_df))
            else:
                log.warning("  ⚠ Archivo vacío o sin datos procesables")
        except Exception as e:
            log.error("  ✗ Error procesando %s: %s", fp, e)
            # Continuar con el siguiente archivo

    if not results:
        log.warning("No se pudo procesar ningún archivo")
        return pd.DataFrame(columns=MOLDE_INMUTABLE + ['ARCHIVO_ORIGEN', 'ORDEN_LOTE'])

    if merge_results:
        combined = pd.concat(results, ignore_index=True)
        log.info("=== BATCH COMPLETADO: %d filas totales de %d archivos ===",
                len(combined), len(results))

        if output_path:
            combined.to_csv(output_path, index=False, encoding="utf-8-sig")
            log.info("Archivo combinado guardado: %s", output_path)

        return combined
    else:
        log.info("=== BATCH COMPLETADO: %d DataFrames individuales ===", len(results))
        return results



# ─── Funciones auxiliares internas ──────────────────────────────────────────

def _read_file(filepath: str) -> pd.DataFrame:
    from .batch_processor import read_erp_file
    try:
        ext = Path(filepath).suffix.lower()
        return read_erp_file(filepath, ext)
    except Exception as exc:
        log.error("Error leyendo archivo '%s': %s", filepath, exc)
        return pd.DataFrame()


def _create_derived_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea columnas derivadas adicionales:
    - FECHA_DT: datetime de FECHA_PROCESO para filtros rápidos
    - ES_NC, ES_NDB: flags de tipo de documento
    - CANTIDAD_FACTURA: suma de CANT_FISICA por NRO_DOC
    - ITEMS_FACTURA: número de items (filas) por NRO_DOC
    """
    # FECHA_DT
    if "FECHA_PROCESO" in df.columns:
        df["FECHA_DT"] = pd.to_datetime(
            df["FECHA_PROCESO"],
            dayfirst=True,
            errors="coerce"
        )

    # Flags de documentos
    if "TPO_DOC" in df.columns:
        tpo = df["TPO_DOC"].astype(str).str.upper().str.strip()
        df["ES_NC"] = tpo.str.startswith(("NC", "NCR"))
        df["ES_NDB"] = tpo.str.startswith("NDB")

    # Agregados por documento
    if "NRO_DOC" in df.columns:
        # Cantidad total por documento
        if "CANT_FISICA" in df.columns:
            cant_por_doc = df.groupby("NRO_DOC")["CANT_FISICA"].transform("sum")
            df["CANTIDAD_FACTURA"] = cant_por_doc
        # Número de items por documento
        items_counts = df.groupby("NRO_DOC").size()
        df["ITEMS_FACTURA"] = df["NRO_DOC"].map(items_counts)

    return df


def _remove_totals_row(df: pd.DataFrame) -> pd.DataFrame:
    """
    Elimina la fila de gran total que el ERP incluye al final.

    Se identifica porque TPO_DOC, FECHA_ORIG e ID_CLIENTE estan vacios.
    """
    ref_cols = [c for c in ["TPO_DOC", "FECHA_ORIG", "ID_CLIENTE"] if c in df.columns]
    if not ref_cols:
        return df
    mask_total = df[ref_cols].apply(
        lambda r: r.isna().all() or (r.astype(str).str.strip() == "").all(),
        axis=1,
    )
    n = mask_total.sum()
    if n > 0:
        log.info("Fila(s) de totales eliminada(s): %d", n)
        return df[~mask_total]
    return df
