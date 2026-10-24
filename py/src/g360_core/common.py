"""Utilidades de texto y conversion de tipos para los parsers.

Este modulo es parte del contrato entre repos: los proyectos importan estas
funciones en vez de reimplementarlas. Cada funcion es pura y sin dependencias
de pandas, para que se pueda usar desde cualquier capa.
"""

from __future__ import annotations

import re
import unicodedata

from .field_keywords import load_field_keywords

_PUNCTUATION = re.compile(r"[.,°º/\\()\[\]{}_#*'\"]+")
_SPACES = re.compile(r"\s+")

#: Campos cuyo valor es un entero.
INT_FIELDS: frozenset[str] = frozenset(
    {"sequence", "stock", "units_per_box", "pre_dispatch", "version"}
)

#: Campos cuyo valor es un decimal.
FLOAT_FIELDS: frozenset[str] = frozenset(
    {
        "list_price",
        "fixed_price",
        "net_price",
        "price_with_tax",
        "weight_kg",
        "special_discount",
        "special_discount_adjust",
    }
)

#: Campos de descuento: se guardan como fraccion (0.25 = 25%).
DESC_FIELDS: frozenset[str] = frozenset(f"desc{index}" for index in range(1, 11))


def deaccent(text: str) -> str:
    """Quita tildes y diacríticos.
    @param text - Texto de entrada
    @returns {str} Texto sin marcas diacriticas
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKD", str(text))
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalizar_header(text: str) -> str:
    """Normaliza un encabezado de columna para poder compararlo.
    @param text - Texto de entrada
    @returns {str} Mayusculas, sin tildes, sin puntuacion y con espacios colapsados
    """
    if text is None:
        return ""
    value = deaccent(str(text)).upper()
    value = _PUNCTUATION.sub(" ", value)
    return _SPACES.sub(" ", value).strip()


def match_keyword(value: str, keyword: str) -> bool:
    """Indica si un valor de celda corresponde a un alias de columna.
    La coincidencia es exacta o por prefijo ("COD" dentro de "CODIGO").
    @param value - Valor de la celda
    @param keyword - Alias buscado
    @returns {bool} True si corresponde
    """
    normalized_value = normalizar_header(value)
    normalized_keyword = normalizar_header(keyword)

    if not normalized_value or not normalized_keyword:
        return False

    return normalized_value == normalized_keyword or normalized_value.startswith(normalized_keyword)


def safe_float(value: object) -> float | None:
    """Convierte un valor de celda a float tolerando separadores y sucios.
    @param value - Valor crudo
    @returns {float|None} El numero o None si no se puede convertir
    """
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    negative = text.startswith("(") and text.endswith(")")
    if negative:
        text = text[1:-1].strip()

    text = text.replace("%", "").replace(" ", "").replace("\u00a0", "")
    if "," in text and "." in text:
        # El separador que aparece DESPUES es el decimal:
        #   US:   1,234.56  (punto decimal)
        #   EU:   1.234,56  (coma decimal)
        dot_pos = text.rfind(".")
        comma_pos = text.rfind(",")
        if dot_pos > comma_pos:
            text = text.replace(",", "")
        else:
            text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        _head, _, tail = text.partition(",")
        text = text.replace(",", "") if len(tail) == 3 else text.replace(",", ".")

    try:
        number = float(text)
    except ValueError:
        return None

    return -number if negative else number


def safe_int(value: object) -> int | None:
    """Convierte un valor de celda a int tolerando separadores y sucios.
    @param value - Valor crudo
    @returns {int|None} El entero o None si no se puede convertir
    """
    number = safe_float(value)
    if number is None:
        return None
    return round(number)


def build_header_aliases(
    field_keywords: dict[str, list[str]] | None = None,
) -> dict[str, str]:
    """Arma el mapa de encabezado exacto -> campo canonico.
    El primer campo que reclama un alias gana.
    @param field_keywords - Alias por campo canonico
    @returns {dict[str, str]} Mapa encabezado normalizado -> campo
    """
    keywords = field_keywords if field_keywords is not None else load_field_keywords()
    aliases: dict[str, str] = {}

    for field, field_aliases in keywords.items():
        for alias in field_aliases:
            normalized = normalizar_header(alias)
            if normalized and normalized not in aliases:
                aliases[normalized] = field

    return aliases


#: Mapa encabezado normalizado -> campo canonico (de los alias por defecto).
HEADER_ALIASES: dict[str, str] = build_header_aliases()


__all__ = [
    "DESC_FIELDS",
    "FLOAT_FIELDS",
    "HEADER_ALIASES",
    "INT_FIELDS",
    "build_header_aliases",
    "deaccent",
    "match_keyword",
    "normalizar_header",
    "safe_float",
    "safe_int",
]
