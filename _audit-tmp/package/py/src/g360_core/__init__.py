"""
g360_core - Módulo principal de procesamiento ERP para g360-cli.

Proporciona:
- Estabilización de datos crudos de Excel/CSV
- Pipeline de ingesta con normalización
- Scanner de directorios
- Protección de ceros a la izquierda en IDs
- Batch processing
"""

from .batch_processor import read_erp_file
from .commercial_engine import (
    CAT_AJUSTE,
    CAT_DEVOLUCION,
    CAT_VENTA,
    SUBTIPO_CARGO_FIJO,
    SUBTIPO_PRECIO_LINEA,
    SUBTIPO_PRECIO_PARCIAL,
    SUBTIPO_SIN_BASE,
    calculate_prices,
    classify_base,
    parse_referencia,
    resolve_document_relationships,
)
from .common import (  # noqa: F401
    HEADER_ALIASES,
    build_header_aliases,
    deaccent,
    match_keyword,
    normalizar_header,
    safe_float,
    safe_int,
)
from .field_keywords import DEFAULT_FIELD_KEYWORDS, load_field_keywords  # noqa: F401
from .normalizer import normalizar_valor  # noqa: F401
from .pipeline import batch_ingest, ingest_to_master
from .processor import InsightProcessor
from .scanner import (
    ERPFileInfo,
    ERPScanner,
    batch_process_files,
    find_erp_files_in_dir,
    merge_processed_data,
    process_single_file,
)
from .utils import (
    ID_COLS_PRESERVE_ZEROS,
    NC_PREFIXES,
    build_doc_completo,
    build_entity_labels,
    clean_erp_headers,
    normalize_ids,
    parse_excel_date,
    validate_columns,
)

__all__ = [
    "CAT_AJUSTE",
    "CAT_DEVOLUCION",
    "CAT_VENTA",
    "ID_COLS_PRESERVE_ZEROS",
    "NC_PREFIXES",
    "SUBTIPO_CARGO_FIJO",
    "SUBTIPO_PRECIO_LINEA",
    "SUBTIPO_PRECIO_PARCIAL",
    "SUBTIPO_SIN_BASE",
    "ERPFileInfo",
    # Scanner
    "ERPScanner",
    # Processor
    "InsightProcessor",
    "batch_ingest",
    "batch_process_files",
    "build_doc_completo",
    "build_entity_labels",
    "calculate_prices",
    # Commercial Engine
    "classify_base",
    # Utils
    "clean_erp_headers",
    "find_erp_files_in_dir",
    # Ingestion
    "ingest_to_master",
    "merge_processed_data",
    "normalize_ids",
    "parse_excel_date",
    "parse_referencia",
    "process_single_file",
    "read_erp_file",
    "resolve_document_relationships",
    "validate_columns",
]
