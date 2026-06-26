"""
Procesador por lotes para archivos ERP grandes.

Lee archivos grandes y los procesa en un solo paso usando InsightProcessor.
El chunking original causaba procesamiento duplicado; ahora se procesa
todo el DataFrame de una vez para garantizar consistencia.
"""
import pandas as pd
from pathlib import Path
from typing import Optional, Callable
import gc
from .processor import InsightProcessor


class BatchProcessor:
    """Procesa archivos ERP grandes con feedback de progreso."""

    def __init__(self, progress_callback: Optional[Callable] = None):
        self.progress_callback = progress_callback

    def process_large_file(self, df: pd.DataFrame, filename: str) -> InsightProcessor:
        """
        Procesa un DataFrame completo en un solo paso.

        Args:
            df: DataFrame con datos crudos
            filename: Nombre del archivo para logs

        Returns:
            InsightProcessor con todos los datos procesados
        """
        if self.progress_callback:
            self.progress_callback(0.1, f"Procesando {len(df):,} registros...")

        processor = InsightProcessor(df)
        gc.collect()

        if self.progress_callback:
            self.progress_callback(1.0, "Procesamiento completado")

        return processor

    def read_with_progress(self, path: str, file_ext: str,
                           on_progress: Callable[[float, str], None]) -> pd.DataFrame:
        """
        Lee archivo con indicador de progreso.

        Args:
            path: Ruta del archivo
            file_ext: Extension del archivo (.csv, .xls, .xlsx)
            on_progress: Callback de progreso (0-1, mensaje)

        Returns:
            DataFrame leido
        """
        on_progress(0.05, "Leyendo archivo...")
        df = read_erp_file(path, file_ext)
        on_progress(0.2, f"Archivo leido: {len(df):,} filas")
        return df


def read_erp_file(path: str, file_ext: str = None) -> pd.DataFrame:
    """
    Funcion unificada de lectura de archivos ERP.

    Es el unico punto de entrada para leer archivos .xls, .xlsx y .csv
    en toda la aplicacion. Usa engines explicitos para evitar problemas
    de compatibilidad con pandas/xlrd/openpyxl.

    PROTECCIÓN DE CEROS A LA IZQUIERDA:
    Las columnas críticas de IDs se leen obligatoriamente como strings (dtype=str)
    para preservar ceros iniciales (ej: "01240" no se convierte a 1240).

    Args:
        path: Ruta absoluta al archivo.
        file_ext: Extension (incluye el punto). Si es None se infiere.

    Returns:
        DataFrame con columnas críticas como strings para preservar ceros.

    Raises:
        ValueError: Si la extension no es soportada o hay error de lectura.
    """
    if file_ext is None:
        file_ext = Path(path).suffix.lower()
    else:
        file_ext = file_ext.lower()

    # Columnas críticas que deben preservar ceros a la izquierda
    critical_cols = [
        "ID_ARTICULO", "ID_CLIENTE", "ID_VENDEDOR", "ID_LINEA",
        "ID_GRUPO", "ID_TIPO", "ID_FAMILIA", "COD_SUCURSAL",
        "NRO_DOC", "SERIE_DOC", "DOC_CLIENTE"
    ]

    if file_ext == '.csv':
        # Para CSV, leer todo como string inicialmente
        df = pd.read_csv(
            path, dtype=str, encoding='utf-8-sig',
            sep=None, engine='python', low_memory=False,
        )
    elif file_ext in ('.xls', '.xlsx'):
        engine = "xlrd" if file_ext == ".xls" else "openpyxl"
        try:
            # Leer Excel con dtype=str para forzar texto en TODAS las columnas
            # Esto previene que pandas convierta "01240" -> 1240 automáticamente
            df = pd.read_excel(path, dtype=str, engine=engine)
        except Exception as ex:
            raise ValueError(
                f"Error leyendo archivo Excel ({file_ext}) con motor '{engine}': {ex}"
            )
    else:
        raise ValueError(f"Extension '{file_ext}' no soportada. Use .xls, .xlsx, .csv")

    # Limpieza post-lectura: eliminar espacios en blanco de columnas críticas
    for col in critical_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    return df