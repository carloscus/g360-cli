"""Alias de columnas ERP: el contrato de datos entre repos.

Este modulo es la fuente unica de los alias que usan los parsers para
reconocer columnas de Excel ("CÓDIGO", "P. LISTA", "D1", ...). Los proyectos
pueden sobreescribirlo con su propio `assets/data/config.json`
(llave FIELD_KEYWORDS); si no, se usan estos defaults.

Los aliases son datos, no codigo: cambiar uno es un cambio de contrato y debe
reflejarse en todos los proyectos que lo consumen.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

#: Alias por campo canonico (campo -> lista de nombres de columna aceptados).
DEFAULT_FIELD_KEYWORDS: dict[str, list[str]] = {
    "sku": ["CÓDIGO", "CODIGO", "SKU", "COD.", "ITEM", "CÓD", "CÓDIGO INTERNO"],
    "description": [
        "ARTÍCULO",
        "DESCRIPCIÓN",
        "DESCRIPCION",
        "PRODUCTO",
        "NOMBRE",
        "NOMBRE CORTO",
        "NOM",
    ],
    "full_name": [
        "NOMBRE COMPLETO",
        "DESCRIPCIÓN COMPLETA",
        "DESCRIPCION COMPLETA",
        "NOM COMPLETO",
    ],
    "line": [
        "LÍNEA",
        "LINEA",
        "LIN",
        "RUBRO",
        "GRUPO LIN",
        "LINEA DE PRODUCTO",
        "LINEA_PROD",
    ],
    "category": [
        "CATEGORÍA",
        "CATEGORIA",
        "CAT",
        "DEPARTAMENTO",
        "TIPO PRODUCTO",
        "TIPO_PROD",
        "CLASE",
    ],
    "family": ["FAMILIA", "FAM", "SUBCATEGORÍA", "SUBCATEGORIA"],
    "group": ["GRUPO", "GRU", "MARCA", "SECCIÓN", "SECCION"],
    "units_per_box": [
        "U/BX",
        "UN/BOX",
        "U.M.",
        "UM",
        "UNIDAD",
        "UNID",
        "UOM",
        "UN/BX",
        "UNDXCAJ",
    ],
    "list_price": [
        "P. LISTA",
        "PRECIO LISTA",
        "P.LISTA",
        "PLIST",
        "PRECIO",
        "P.L",
        "PRECIO BASE",
        "P. BASE",
    ],
    "desc1": ["D1", "DESC1", "DESC. 1", "DESCUENTO 1", "DSCTO1", "DESC 1"],
    "desc2": ["D2", "DESC2", "DESC. 2", "DESCUENTO 2", "DSCTO2", "DESC 2"],
    "desc3": ["D3", "DESC3", "DESC. 3", "DESCUENTO 3", "DSCTO3", "DESC 3"],
    "desc4": ["D4", "DESC4", "DESC. 4", "DESCUENTO 4", "DSCTO4", "DESC 4"],
    "desc5": ["D5", "DESC5", "DESC. 5", "DESCUENTO 5", "DSCTO5", "DESC 5"],
    "desc6": ["D6", "DESC6", "DESC. 6", "DESCUENTO 6", "DSCTO6", "DESC 6"],
    "desc7": ["D7", "DESC7", "DESC. 7", "DESCUENTO 7", "DSCTO7", "DESC 7"],
    "fixed_price": [
        "P. FIJO",
        "PRECIO FIJO",
        "P.FIJO",
        "PFIJO",
        "PRECIO ESPECIAL",
        "P.ESP",
    ],
    "net_price": ["P. NETO", "PRECIO NETO", "P.NETO", "PNET", "PRECIO FINAL"],
    "price_with_tax": ["P. C/IGV", "P.CIGV", "PRECIO IGV", "P.IGV", "CON IGV"],
    "stock": [
        "STOCK",
        "SALDO",
        "CANTIDAD",
        "STOCK TOTAL",
        "DISPONIBLE",
        "VES",
        "V.E.S.",
        "ALMACEN",
        "ALMACÉN",
    ],
    "active": ["ACTIVO", "ACT", "ESTADO", "STATUS", "ST", "S"],
    "sort_key": ["SORT", "ORDEN", "ORD", "ORDER"],
    "ean13": ["EAN13", "EAN", "CÓDIGO BARRA", "CODIGO BARRA", "BARRA", "BARCODE"],
    "weight_kg": ["PESO", "PESO KG", "KG", "PESO(KG)"],
    "customer_sku": [
        "SKU CLIENTE",
        "COD. CLIENTE",
        "COD CLIENTE",
        "COD_CLI",
        "SKU_CLI",
    ],
    "subcategory": ["SUBCATEGORÍA", "SUBCATEGORIA", "SUBCAT", "TIPO"],
    "sequence": ["N°", "NUM", "NUMERO", "NO.", "NRO", "#"],
    "almacen": ["ALMACÉN", "ALMACEN", "DEPÓSITO", "DEPOSITO", "UBICACIÓN"],
    "sku_unit": ["U.M.", "UM", "UNIDAD", "UNID", "UOM"],
    "predespacho": ["PREDESPACHO", "PRE-DESPACHO", "PREDESP"],
    "disponible": ["DISPONIBLE", "DISP.", "SALDO DISPONIBLE"],
}


def find_config_path(start: Path | None = None) -> Path | None:
    """Busca el `config.json` del proyecto (para leer FIELD_KEYWORDS).
    @param start - Directorio desde donde buscar (por defecto, el actual)
    @returns {Path|None} Ruta del config o None si no existe
    """
    base = start or Path.cwd()
    candidates = [
        base / "assets" / "data" / "config.json",
        base / "config.json",
        base / "src" / "core" / "config.json",
        base / "src" / "config" / "config.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def load_field_keywords(config_path: Path | None = None) -> dict[str, list[str]]:
    """Carga los alias de columnas: los del proyecto si existen, si no los default.
    @param config_path - Ruta al config.json del proyecto
    @returns {dict[str, list[str]]} Alias por campo canonico
    """
    path = config_path or find_config_path()
    if path is None:
        return dict(DEFAULT_FIELD_KEYWORDS)

    try:
        with open(path, encoding="utf-8") as handle:
            data: dict[str, Any] = json.load(handle)
    except (OSError, ValueError):
        return dict(DEFAULT_FIELD_KEYWORDS)

    keywords = data.get("FIELD_KEYWORDS")
    if not isinstance(keywords, dict) or not keywords:
        return dict(DEFAULT_FIELD_KEYWORDS)

    return {str(key): [str(alias) for alias in aliases] for key, aliases in keywords.items()}


__all__ = ["DEFAULT_FIELD_KEYWORDS", "find_config_path", "load_field_keywords"]
