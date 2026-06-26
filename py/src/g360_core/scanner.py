"""
Scanner de archivos ERP para g360-cli.

Detección ligera sin dependencia de pipeline completo.
"""

from .batch_processor import read_erp_file
from .utils import validate_columns
from .pipeline import ingest_to_master
import pandas as pd
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass, field
import logging
from datetime import datetime

log = logging.getLogger(__name__)


@dataclass
class ERPFileInfo:
    """Información de un archivo ERP detectado."""
    path: Path
    size_bytes: int
    modified_time: datetime
    erp_type: str = "UNKNOWN"
    is_valid: bool = False
    missing_columns: List[str] = field(default_factory=list)
    n_rows_estimate: int = 0
    columnas_encontradas: List[str] = field(default_factory=list)
    error_msg: Optional[str] = None


class ERPScanner:
    """Escanea directorios y detecta archivos ERP válidos."""

    ERP_SIGNATURES = {
        "dgvVentas": {
            "required": {"ANHO", "MES", "ID_CLIENTE", "NOM_CLIENTE", "ID_ARTICULO",
                         "NOM_ARTICULO", "ID_VENDEDOR", "NOM_VENDEDOR", "TPO_DOC",
                         "SERIE_DOC", "NRO_DOC", "FECHA_ORIG", "REFERENCIA",
                         "CANTIDAD", "SOLES"},
            "weight": 15
        },
        "generic": {
            "required": {"CANTIDAD", "SOLES"},
            "weight": 5
        }
    }

    MIN_VALID_SCORE = 10

    def scan_directory(self, directory: Path, recursive: bool = True) -> List[ERPFileInfo]:
        if not directory.exists():
            raise FileNotFoundError(f"Directorio no encontrado: {directory}")

        patterns = ["*.xls", "*.xlsx", "*.csv"]
        files = []
        if recursive:
            for pattern in patterns:
                files.extend(directory.rglob(pattern))
        else:
            for pattern in patterns:
                files.extend(directory.glob(pattern))

        results = []
        for file_path in files:
            try:
                info = self.analyze_file(file_path)
                results.append(info)
            except Exception as e:
                info = ERPFileInfo(
                    path=file_path,
                    size_bytes=file_path.stat().st_size,
                    modified_time=datetime.fromtimestamp(file_path.stat().st_mtime),
                    erp_type="ERROR",
                    is_valid=False,
                    error_msg=str(e)
                )
                results.append(info)

        return results

    def analyze_file(self, file_path: Path) -> ERPFileInfo:
        stat = file_path.stat()
        info = ERPFileInfo(
            path=file_path,
            size_bytes=stat.st_size,
            modified_time=datetime.fromtimestamp(stat.st_mtime)
        )

        try:
            df_head = self._read_headers(file_path)
            if df_head.empty:
                info.error_msg = "Archivo vacío"
                return info

            info.columnas_encontradas = list(df_head.columns)
            info.n_rows_estimate = len(df_head)

            erp_type, score = self._detect_erp_type(df_head.columns)
            info.erp_type = erp_type

            missing = validate_columns(df_head)
            info.missing_columns = missing

            if erp_type != "UNKNOWN" and not missing:
                info.is_valid = True
            elif score >= self.MIN_VALID_SCORE:
                info.is_valid = True
            else:
                info.is_valid = False
                info.error_msg = f"Score {score} bajo o faltan columnas"

        except Exception as e:
            info.error_msg = f"Error: {str(e)}"

        return info

    def _read_headers(self, file_path: Path, nrows: int = 100) -> pd.DataFrame:
        ext = file_path.suffix.lower()
        try:
            if ext == '.csv':
                df = read_erp_file(str(file_path), '.csv', nrows=nrows)
            elif ext in ('.xls', '.xlsx'):
                df = read_erp_file(str(file_path), ext, nrows=nrows)
            else:
                raise ValueError(f"Extensión no soportada: {ext}")
        except Exception as e:
            raise ValueError(f"No se pudo leer: {e}")

        df.columns = [c.strip().upper() for c in df.columns]
        return df

    def _detect_erp_type(self, columns: List[str]) -> Tuple[str, int]:
        cols_upper = set(c.upper() for c in columns)
        scores = {}
        for name, sig in self.ERP_SIGNATURES.items():
            matched = cols_upper & set(sig["required"])
            score = len(matched) * sig["weight"]
            specific = {"ANHO", "MES", "TPO_DOC", "DOC_CLIENTE"}
            score += len(cols_upper & specific) * 3
            scores[name] = score

        best = max(scores, key=scores.get)
        return (best, scores[best]) if scores[best] >= self.MIN_VALID_SCORE else ("UNKNOWN", scores[best])

    def get_valid_files(self, files: List[ERPFileInfo]) -> List[ERPFileInfo]:
        return [f for f in files if f.is_valid]

    def get_invalid_files(self, files: List[ERPFileInfo]) -> List[ERPFileInfo]:
        return [f for f in files if not f.is_valid]

    def group_by_erp_type(self, files: List[ERPFileInfo]) -> dict:
        groups = {}
        for f in files:
            groups.setdefault(f.erp_type, []).append(f)
        return groups


def find_erp_files_in_dir(
    directory: Path,
    recursive: bool = True,
    min_score: int = 10
) -> Tuple[List[ERPFileInfo], List[ERPFileInfo]]:
    scanner = ERPScanner()
    scanner.MIN_VALID_SCORE = min_score
    all_files = scanner.scan_directory(directory, recursive=recursive)
    valid = scanner.get_valid_files(all_files)
    invalid = scanner.get_invalid_files(all_files)
    return valid, invalid


def process_single_file(filepath: Path) -> pd.DataFrame:
    """Procesa un archivo ERP y retorna DataFrame."""
    # Import diferido para evitar dependencia circular
    from .pipeline import ingest_to_master
    df = ingest_to_master(str(filepath), output_path=None, drop_totales=True)
    if 'ARCHIVO_ORIGEN' not in df.columns:
        df['ARCHIVO_ORIGEN'] = filepath.name
    return df


def batch_process_files(
    filepaths: List[Path],
    merge_results: bool = True
) -> pd.DataFrame:
    results = []
    for i, fp in enumerate(filepaths, 1):
        try:
            df = process_single_file(fp)
            if not df.empty:
                df['ORDEN_LOTE'] = i
                results.append(df)
        except Exception as e:
            log.error(f"Error procesando {fp}: {e}")

    if not results:
        return pd.DataFrame()

    if merge_results:
        combined = pd.concat(results, ignore_index=True)
        log.info(f"Batch: {len(combined)} filas de {len(results)} archivos")
        return combined
    return results


def merge_processed_data(dfs: List[pd.DataFrame], source_paths: List[Path]) -> pd.DataFrame:
    if not dfs:
        return pd.DataFrame()
    dfs_with_source = []
    for df, path in zip(dfs, source_paths):
        df_copy = df.copy()
        if 'ARCHIVO_ORIGEN' not in df_copy.columns:
            df_copy['ARCHIVO_ORIGEN'] = path.name
        dfs_with_source.append(df_copy)
    combined = pd.concat(dfs_with_source, ignore_index=True)
    return combined
