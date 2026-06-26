"""
Commercial Engine - Motor de lógica de negocio para clasificación documental.

Responsabilidades:
    classify_base: Clasificación primaria (VENTA/DEVOLUCION/AJUSTE)
    parse_referencia: Descomposición de REFERENCIA en tipo/serie/numero
    build_invoice_index: Índice de facturas para cruce de referencias
    resolve_document_relationships: Asignación de SUBTIPO_AJUSTE
    calculate_prices: PRECIO_BASE, RECARGO_UNITARIO, PRECIO_EFECTIVO

Principio: toda regla de negocio vive aquí, no en processor.py ni pipeline.py.
"""

import re
import pandas as pd
import numpy as np

from .utils import NC_PREFIXES, ND_PREFIXES
from .logger import get_logger

log = get_logger("commercial_engine")

# ─── Constantes de clasificación ──────────────────────────────────────────────

CAT_VENTA = "VENTA"
CAT_DEVOLUCION = "DEVOLUCION"
CAT_AJUSTE = "AJUSTE"

SUBTIPO_PRECIO_LINEA = "PRECIO_LINEA"
SUBTIPO_PRECIO_PARCIAL = "PRECIO_PARCIAL"
SUBTIPO_CARGO_FIJO = "CARGO_FIJO"
SUBTIPO_SIN_BASE = "SIN_BASE"

REF_PATTERN = re.compile(r"^([A-Z0-9]+)/(\d+)-(\d+)$")


# ─── Helpers internos ─────────────────────────────────────────────────────────

def _find_fae_col(df: pd.DataFrame) -> str:
    """Encuentra la columna CANTIDAD FAE (puede venir como CANTIDAD_FAE)."""
    for col in df.columns:
        norm = col.upper().replace(" ", "_").replace("-", "_")
        if norm == "CANTIDAD_FAE":
            return col
    return None


def _find_tpo_col(df: pd.DataFrame) -> str:
    """Encuentra la columna TPO_DOC (puede venir como TIPO_DOC)."""
    for col in df.columns:
        if "TPO_DOC" in col or col == "TIPO_DOC":
            return col
    return None


# ─── Paso 1: Parseo de REFERENCIA ────────────────────────────────────────────

def parse_referencia(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extrae REF_TIPO, REF_SERIE y REF_NUMERO del campo REFERENCIA.

    Formato esperado: "F01/204-56287"
    Para filas sin referencia, se rellena con "S/R".
    """
    ref_tipo = []
    ref_serie = []
    ref_numero = []

    for val in df.get("REFERENCIA", pd.Series("", index=df.index)):
        raw = str(val).strip().upper() if pd.notna(val) else ""
        m = REF_PATTERN.match(raw)
        if m:
            ref_tipo.append(m.group(1))
            ref_serie.append(m.group(2))
            ref_numero.append(m.group(3))
        else:
            ref_tipo.append("S/R")
            ref_serie.append("S/R")
            ref_numero.append("S/R")

    df["REF_TIPO"] = ref_tipo
    df["REF_SERIE"] = ref_serie
    df["REF_NUMERO"] = ref_numero
    return df


# ─── Paso 2: Clasificación primaria ──────────────────────────────────────────

def classify_base(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clasificación primaria basada solo en la fila actual (sin mirar otras).

    CATEGORIA_OP:
        VENTA      → Facturas, Boletas (F01, BDI, etc.)
        DEVOLUCION → Notas de Crédito con movimiento físico (CANTIDAD != 0)
        AJUSTE     → NC/ND sin movimiento físico (CANTIDAD == 0)

    SUBTIPO_AJUSTE se inicializa vacío (se asigna en resolve_document_relationships).
    """
    tpo_col = _find_tpo_col(df)
    if tpo_col is None:
        df["CATEGORIA_OP"] = CAT_VENTA
        df["SUBTIPO_AJUSTE"] = ""
        return df

    tpo = df[tpo_col].astype(str).str.upper().str.strip()
    cant = pd.to_numeric(df.get("CANTIDAD", 0), errors="coerce").fillna(0)

    es_venta = tpo.isin(["F01", "BDI", "F03", "B01", "B03", "F07", "F08", "B07", "B08"])
    nc_pattern = "|".join([f"^{p}" for p in NC_PREFIXES])
    es_nc = tpo.str.contains(nc_pattern, na=False)
    nd_pattern = "|".join([f"^{p}" for p in ND_PREFIXES])
    es_nd = tpo.str.contains(nd_pattern, na=False)

    condiciones = [
        es_venta,
        es_nc & (cant != 0),
        es_nc & (cant == 0),
        es_nd,
    ]
    opciones = [
        CAT_VENTA,
        CAT_DEVOLUCION,
        CAT_AJUSTE,
        CAT_AJUSTE,
    ]

    df["CATEGORIA_OP"] = np.select(condiciones, opciones, default=CAT_AJUSTE)
    df["SUBTIPO_AJUSTE"] = ""

    return df


# ─── Paso 3: Resolución de relaciones documentales ──────────────────────────

def _normalize_doc_id(val) -> str:
    """Normaliza ID de documento: quita '.0' de floats, espacios, mayúsculas."""
    s = str(val).strip().upper()
    if s.endswith(".0"):
        s = s[:-2]
    return s


def build_invoice_index(df: pd.DataFrame) -> dict:
    """
    Construye índice de facturas para resolver referencias.

    Clave: (TPO_DOC, SERIE_DOC, NRO_DOC, ID_ARTICULO)
    Valor: dict con CANTIDAD, SOLES, CANTIDAD_FAE agregados.

    Solo indexa registros VENTA.
    Retorna dict vacío si no hay facturas en el dataset.
    """
    facturas = df[df["CATEGORIA_OP"] == CAT_VENTA].copy()
    if facturas.empty:
        return {}

    for col in ["TPO_DOC", "SERIE_DOC", "NRO_DOC"]:
        if col not in facturas.columns:
            return {}

    fae_col = _find_fae_col(facturas) or "CANTIDAD"
    if fae_col not in facturas.columns:
        facturas[fae_col] = 0

    # Normalizar IDs de documento y armar clave
    facturas["_IDX_TIPO"] = facturas["TPO_DOC"].astype(str).str.upper().str.strip()
    facturas["_IDX_SERIE"] = facturas["SERIE_DOC"].apply(_normalize_doc_id)
    facturas["_IDX_NRO"] = facturas["NRO_DOC"].apply(_normalize_doc_id)
    facturas["_IDX_SKU"] = facturas["ID_ARTICULO"].astype(str).str.strip() if "ID_ARTICULO" in facturas.columns else ""

    # Convertir a numérico
    facturas[fae_col] = pd.to_numeric(facturas[fae_col], errors="coerce").fillna(0)
    facturas["SOLES"] = pd.to_numeric(facturas["SOLES"], errors="coerce").fillna(0)
    facturas["CANTIDAD"] = pd.to_numeric(facturas["CANTIDAD"], errors="coerce").fillna(0)

    idx_cols = ["_IDX_TIPO", "_IDX_SERIE", "_IDX_NRO", "_IDX_SKU"]
    agg_cols = {"CANTIDAD": "sum", "SOLES": "sum", fae_col: "sum"}

    grouped = facturas.groupby(idx_cols).agg(agg_cols).to_dict("index")
    # Limpiar columnas auxiliares
    facturas.drop(columns=["_IDX_TIPO", "_IDX_SERIE", "_IDX_NRO", "_IDX_SKU"], inplace=True)
    return grouped


def resolve_document_relationships(df: pd.DataFrame) -> pd.DataFrame:
    """
    Resuelve referencias entre documentos.

    Para registros AJUSTE, cruza REFERENCIA contra el índice de facturas
    y asigna SUBTIPO_AJUSTE:
        PRECIO_LINEA      → misma factura + mismo SKU + FAE = CANTIDAD
        PRECIO_PARCIAL    → misma factura + mismo SKU + FAE < CANTIDAD
        CARGO_FIJO        → CANTIDAD_FAE = 1 (cargo fijo, no proporcional)
        SIN_BASE          → factura referenciada no encontrada
    """
    ajustes = df[df["CATEGORIA_OP"] == CAT_AJUSTE]
    if ajustes.empty:
        df["SUBTIPO_AJUSTE"] = ""
        return df

    for col in ["REF_TIPO", "REF_SERIE", "REF_NUMERO"]:
        if col not in df.columns:
            df[col] = ""

    idx = build_invoice_index(df)
    fae_col = _find_fae_col(df) or "CANTIDAD"

    if not idx:
        df.loc[df["CATEGORIA_OP"] == CAT_AJUSTE, "SUBTIPO_AJUSTE"] = SUBTIPO_SIN_BASE
        return df

    for idx_row in df[df["CATEGORIA_OP"] == CAT_AJUSTE].index:
        ref_tipo = str(df.at[idx_row, "REF_TIPO"]).strip().upper()
        ref_serie = str(df.at[idx_row, "REF_SERIE"]).strip()
        ref_numero = str(df.at[idx_row, "REF_NUMERO"]).strip()
        sku = str(df.at[idx_row, "ID_ARTICULO"]).strip() if "ID_ARTICULO" in df.columns else ""

        key_con_sku = (ref_tipo, ref_serie, ref_numero, sku)
        key_sin_sku = (ref_tipo, ref_serie, ref_numero, "")

        if key_con_sku in idx:
            factura = idx[key_con_sku]
            cant_fae_ajuste = abs(
                pd.to_numeric(df.at[idx_row, fae_col], errors="coerce") or 0
            )
            cant_factura = abs(factura.get("CANTIDAD", 0))

            if cant_fae_ajuste == 0:
                df.at[idx_row, "SUBTIPO_AJUSTE"] = SUBTIPO_CARGO_FIJO
            elif abs(cant_fae_ajuste - cant_factura) < 0.01:
                df.at[idx_row, "SUBTIPO_AJUSTE"] = SUBTIPO_PRECIO_LINEA
            elif cant_fae_ajuste < cant_factura:
                df.at[idx_row, "SUBTIPO_AJUSTE"] = SUBTIPO_PRECIO_PARCIAL
            else:
                df.at[idx_row, "SUBTIPO_AJUSTE"] = SUBTIPO_SIN_BASE
        else:
            cant_fae_val = abs(
                pd.to_numeric(df.at[idx_row, fae_col], errors="coerce") or 0
            )
            if cant_fae_val == 1:
                df.at[idx_row, "SUBTIPO_AJUSTE"] = SUBTIPO_CARGO_FIJO
            else:
                df.at[idx_row, "SUBTIPO_AJUSTE"] = SUBTIPO_SIN_BASE

    return df


# ─── Paso 4: Cálculo de precios ─────────────────────────────────────────────

def calculate_prices(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula columnas de precio:

        PRECIO_BASE       → SOLES / CANTIDAD (solo cuando CANTIDAD != 0)
        RECARGO_UNITARIO  → SOLES / abs(CANTIDAD_FAE) (solo ajustes PRECIO_LINEA)
        PRECIO_EFECTIVO   → PRECIO_BASE + RECARGO_UNITARIO (ventas con ajuste linkeado)
    """
    fae_col = _find_fae_col(df)

    # PRECIO_BASE: solo para movimientos físicos
    if "CANTIDAD" in df.columns and "SOLES" in df.columns:
        cant = pd.to_numeric(df["CANTIDAD"], errors="coerce").fillna(0)
        soles = pd.to_numeric(df["SOLES"], errors="coerce").fillna(0)
        mask_fisica = cant != 0
        df["PRECIO_BASE"] = np.where(
            mask_fisica,
            np.round(soles.abs() / cant.abs(), 4),
            np.nan
        )
    else:
        df["PRECIO_BASE"] = np.nan

    # RECARGO_UNITARIO: solo para ajustes PRECIO_LINEA o PRECIO_PARCIAL
    if fae_col and "SOLES" in df.columns:
        cant_fae = pd.to_numeric(df[fae_col], errors="coerce").fillna(0)
        soles = pd.to_numeric(df["SOLES"], errors="coerce").fillna(0)

        subtipo = df.get("SUBTIPO_AJUSTE", pd.Series(""))
        es_ajuste_precio = subtipo.isin([SUBTIPO_PRECIO_LINEA, SUBTIPO_PRECIO_PARCIAL])
        mask_recargo = es_ajuste_precio & (cant_fae != 0)

        df["RECARGO_UNITARIO"] = np.where(
            mask_recargo,
            np.round(soles / cant_fae.abs(), 4),
            np.nan
        )
    else:
        df["RECARGO_UNITARIO"] = np.nan

    # PRECIO_EFECTIVO: base + recargo
    # Para ventas: PRECIO_EFECTIVO = PRECIO_BASE
    # Para ajustes linkeados: no se suma directamente (se propaga a nivel de agregación)
    if "PRECIO_BASE" in df.columns:
        base_val = df["PRECIO_BASE"].fillna(0)
        recargo_val = df.get("RECARGO_UNITARIO", pd.Series(0)).fillna(0)
        df["PRECIO_EFECTIVO"] = np.where(
            df["PRECIO_BASE"].notna(),
            np.round(base_val + recargo_val, 4),
            np.nan
        )
    else:
        df["PRECIO_EFECTIVO"] = np.nan

    return df
