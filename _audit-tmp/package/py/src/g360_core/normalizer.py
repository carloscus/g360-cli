"""Normalizacion de valores por tipo de campo.

`normalizar_valor` es el unico punto donde un valor crudo de Excel se
convierte al tipo que espera el modelo. Que viva en la libreria (y no en cada
parser) es lo que hace que dos repos interpreten la misma celda igual.
"""

from __future__ import annotations

from .common import DESC_FIELDS, FLOAT_FIELDS, INT_FIELDS, safe_float, safe_int


def _normalize_percentage(value: object) -> float:
    """Convierte un porcentaje de Excel a fraccion (25 -> 0.25).
    @param value - Valor crudo de la celda
    @returns {float} Fraccion entre 0 y 1
    """
    text = str(value).strip().replace("%", "").replace(",", ".")

    try:
        number = float(text)
    except ValueError:
        return 0.0

    if number > 1:
        return number / 100.0
    if number == 1:
        # Ambiguo: en planillas de ERP "1" es 1%, no un 100% de descuento.
        return 0.01
    return number


def normalizar_valor(key: str, value: object) -> object:
    """Normaliza un valor de celda segun el tipo del campo canonico.
    @param key - Campo canonico (sku, list_price, desc1, ...)
    @param value - Valor crudo de la celda
    @returns {object} Valor tipado (float, int o str)
    """
    if value is None:
        if key in INT_FIELDS:
            return 0
        if key in FLOAT_FIELDS or key in DESC_FIELDS:
            return 0.0
        return ""

    if key in DESC_FIELDS:
        return _normalize_percentage(value)

    if key in INT_FIELDS:
        number = safe_int(value)
        return 0 if number is None else number

    if key in FLOAT_FIELDS:
        number = safe_float(value)
        return 0.0 if number is None else number

    if isinstance(value, str):
        return value.strip()

    return str(value).strip()


__all__ = ["normalizar_valor"]
