"""
g360_core - Módulo principal de procesamiento ERP para g360-cli.

Proporciona:
- Estabilización de datos crudos de Excel/CSV
- Pipeline de ingesta con normalización
- Scanner de directorios
- Protección de ceros a la izquierda en IDs
- Batch processing
"""

from .commercial_engine import (classify_base, parse_referencia, resolve_document_relationships, calculate_prices, CAT_VENTA, CAT_DEVOLUCION, CAT_AJUSTE, SUBTIPO_PRECIO_LINEA, SUBTIPO_PRECIO_PARCIAL, SUBTIPO_CARGO_FIJO, SUBTIPO_SIN_BASE)
from .pipeline import ingest_to_master, batch_ingest
from .scanner import (
    ERPScanner,
    ERPFileInfo,
    find_erp_files_in_dir,
    process_single_file,
    batch_process_files,
    merge_processed_data,
)
from .processor import InsightProcessor
from .utils import (
    clean_erp_headers,
    normalize_ids,
    build_doc_completo,
    build_entity_labels,
    validate_columns,
    parse_excel_date,
    ID_COLS_PRESERVE_ZEROS,
    NC_PREFIXES,
)
from .batch_processor import read_erp_file

__all__ = [
    # Commercial Engine
    "classify_base",
    "parse_referencia",
    "resolve_document_relationships",
    "calculate_prices",
    "CAT_VENTA",
    "CAT_DEVOLUCION",
    "CAT_AJUSTE",
    "SUBTIPO_PRECIO_LINEA",
    "SUBTIPO_PRECIO_PARCIAL",
    "SUBTIPO_CARGO_FIJO",
    "SUBTIPO_SIN_BASE",
    # Ingestion
    "ingest_to_master",
    "batch_ingest",
    # Scanner
    "ERPScanner",
    "ERPFileInfo",
    "find_erp_files_in_dir",
    "process_single_file",
    "batch_process_files",
    "merge_processed_data",
    # Processor
    "InsightProcessor",
    # Utils
    "clean_erp_headers",
    "normalize_ids",
    "build_doc_completo",
    "build_entity_labels",
    "validate_columns",
    "parse_excel_date",
    "ID_COLS_PRESERVE_ZEROS",
    "NC_PREFIXES",
    "read_erp_file",
]
