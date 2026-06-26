import pandas as pd
import re
from typing import Optional


ENTITY_MAP = {
    "cliente": {"id": "ID_CLIENTE", "nombre": "NOM_CLIENTE", "label": "CLIENTE_LABEL"},
    "vendedor": {"id": "ID_VENDEDOR", "nombre": "NOM_VENDEDOR", "label": "VENDEDOR_LABEL"},
    "articulo": {"id": "ID_ARTICULO", "nombre": "NOM_ARTICULO", "label": "ARTICULO_LABEL"},
    "linea": {"id": "ID_LINEA", "nombre": "NOM_LINEA", "label": "LINEA_LABEL"},
    "sucursal": {"id": "COD_SUCURSAL", "nombre": "NOM_SUCURSAL", "label": "SUCURSAL_LABEL"},
    "grupo": {"id": "ID_GRUPO", "nombre": "NOM_GRUPO", "label": "GRUPO_LABEL"},
    "tipo": {"id": "ID_TIPO", "nombre": "NOM_TIPO", "label": "TIPO_LABEL"},
    "familia": {"id": "ID_FAMILIA", "nombre": "NOM_FAMILIA", "label": "FAMILIA_LABEL"},
    "pedido": {"id": "ID_PEDIDO", "nombre": None, "label": "PEDIDO_LABEL"},
    "documento": {"id": "NRO_DOC", "serie": "SERIE_DOC", "tipo": "TPO_DOC"},
}

DOC_TYPE_LABELS = {
    "F01": "Factura",
    "F03": "Factura",
    "F07": "Factura",
    "F08": "Factura",
    "B01": "Boleta",
    "B03": "Boleta",
    "B07": "Boleta",
    "B08": "Boleta",
    "NC01": "Nota de Credito",
    "NC07": "Nota de Credito",
    "NCR": "Nota de Credito",
    "NDB": "Nota de Debito",
    "ND01": "Nota de Debito",
    "BDI": "Boleta de Intermediacion",
    "T001": "Ticket",
    "R01": "Recibo",
}

NC_PREFIXES = ("NC", "NCR", "NOTA")
ND_PREFIXES = ("NDB", "ND", "ND01")

REQUIRED_COLUMNS = ["SOLES", "CANTIDAD", "ID_ARTICULO", "ID_CLIENTE", "TPO_DOC", "FECHA_ORIG"]

# KNOWN ERP FORMAT (dgvVentas):
# 44 columnas fijas: ANHO, MES, ID_CLIENTE, DOC_CLIENTE, NOM_CLIENTE,
# ID_LOCALIDAD_UBIGEO, NOM_DEPARTAMENTO, NOM_PROVINCIA, NOM_DISTRITO,
# ID_LINEA, NOM_LINEA, ID_GRUPO, NOM_GRUPO, ID_TIPO, NOM_TIPO,
# ID_FAMILIA, NOM_FAMILIA, ESTADO_LINEA, ID_ARTICULO, NOM_ARTICULO,
# ID_VENDEDOR, NOM_VENDEDOR, CANAL DE DISTRIBUCION, COD_SUCURSAL,
# NOM_SUCURSAL, TPO_DOC, SERIE_DOC, NRO_DOC, ORD_COMPRA, ID_GUIA,
# FECHA_ORIG, REFERENCIA, FECHA_REF, MONEDA, CANTIDAD, SOLES,
# DOLARES, NOM_CONDICION_PAGO, ID_PEDIDO, FECHA_VENC, DIVISION,
# FEC_CARGO, DOC_CLIENTE (dup), CANTIDAD FAE
#
# TPO_DOC: F01 (factura), NCR (nota credito), NDB (nota debito), BDI (boleta)
# ESTADO_LINEA: "LINEA NUEVA", "LINEA TRADICIONAL"
# CANAL DE DISTRIBUCION: "MAYORISTA", "SIN ASIGNAR", "DISTRIBUIDOR"
# REFERENCIA: "F01/204-56287" (traceability NCR/NDB -> factura)
# FECHA_ORIG: DD/MM/YYYY
# SERIE_DOC, NRO_DOC: floats (204.0, 56287.0) — truncate decimals

ID_COLS_PRESERVE_ZEROS = (
    "ID_ARTICULO", "ID_CLIENTE", "ID_VENDEDOR", "ID_LINEA",
    "ID_GRUPO", "ID_TIPO", "ID_FAMILIA", "COD_SUCURSAL",
    "NRO_DOC", "SERIE_DOC", "DOC_CLIENTE"
)

ID_COLS_STRIP_ZEROS = ()

# Known ERP document types — no guessing needed
ERP_TPO_DOC_SALES = ("F01", "BDI")
ERP_TPO_DOC_NC = ("NCR",)
ERP_TPO_DOC_NDB = ("NDB",)
ERP_ESTADO_LINEA = ("LINEA NUEVA", "LINEA TRADICIONAL")
ERP_CANAL_DISTRIBUCION = ("MAYORISTA", "SIN ASIGNAR", "DISTRIBUIDOR")

# Mapeo de columnas ERP críticas → etiquetas UI en español
# Usado en preview_table y donde se muestren columnas crudas
ERP_COLUMN_LABELS = {
    "ANHO": "AÑO",
    "MES": "MES",
    "ID_CLIENTE": "ID CLIENTE",
    "DOC_CLIENTE": "DOC CLIENTE",
    "NOM_CLIENTE": "CLIENTE",
    "ID_LOCALIDAD_UBIGEO": "UBIGEO",
    "NOM_DEPARTAMENTO": "DEPARTAMENTO",
    "NOM_PROVINCIA": "PROVINCIA",
    "NOM_DISTRITO": "DISTRITO",
    "ID_LINEA": "ID LÍNEA",
    "NOM_LINEA": "LÍNEA",
    "ID_GRUPO": "ID GRUPO",
    "NOM_GRUPO": "GRUPO",
    "ID_TIPO": "ID TIPO",
    "NOM_TIPO": "TIPO",
    "ID_FAMILIA": "ID FAMILIA",
    "NOM_FAMILIA": "FAMILIA",
    "ESTADO_LINEA": "ESTADO LÍNEA",
    "ID_ARTICULO": "SKU",
    "NOM_ARTICULO": "ARTÍCULO",
    "ID_VENDEDOR": "ID VENDEDOR",
    "NOM_VENDEDOR": "VENDEDOR",
    "CANAL DE DISTRIBUCION": "CANAL",
    "COD_SUCURSAL": "CÓD SUCURSAL",
    "NOM_SUCURSAL": "SUCURSAL",
    "TPO_DOC": "TIPO DOC",
    "SERIE_DOC": "SERIE",
    "NRO_DOC": "NRO DOC",
    "ORD COMPRA": "ORD COMPRA",
    "ID_GUIA": "ID GUÍA",
    "FECHA_ORIG": "FECHA",
    "REFERENCIA": "REFERENCIA",
    "FECHA_REF": "FECHA REF",
    "MONEDA": "MONEDA",
    "CANTIDAD": "CANTIDAD",
    "SOLES": "SOLES",
    "DOLARES": "DÓLARES",
    "NOM_CONDICION_PAGO": "COND PAGO",
    "ID_PEDIDO": "ID PEDIDO",
    "FECHA_VENC": "FECHA VENC",
    "DIVISION": "DIVISIÓN",
    "FEC_CARGO": "FECHA CARGO",
    "CANTIDAD FAE": "CANT FAE",
}


def clean_erp_headers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identifica y limpia los headers de un archivo ERP Vinifan.
    Ignora logos, filas vacias y basura del ERP.
    Estandariza nombres de columnas con espacios a guiones bajos.
    """
    for idx, row in df.iterrows():
        row_str = " ".join([str(v).strip().upper() for v in row if pd.notna(v)])
        if any(kw in row_str for kw in ["ID_VENDEDOR", "ID_CLIENTE", "ID_ARTICULO", "NOM_VENDEDOR"]):
            df.columns = df.iloc[idx]
            df = df.iloc[idx + 1:].reset_index(drop=True)
            break

    new_cols = []
    for i, c in enumerate(df.columns):
        c_str = str(c).strip() if pd.notna(c) else ""
        c_upper = c_str.upper()
        if not c_str or c_upper in ("NAN", "NONE") or c_upper.startswith("UNNAMED"):
            new_cols.append(f"UNNAMED_{i}")
        else:
            new_cols.append(c_upper.replace(" ", "_"))
    df.columns = new_cols

    # Renombrar columnas duplicadas (ej: DOC_CLIENTE -> DOC_CLIENTE, DOC_CLIENTE_2)
    seen = {}
    final_cols = []
    for c in df.columns:
        if c in seen:
            seen[c] += 1
            final_cols.append(f"{c}_{seen[c]}")
        else:
            seen[c] = 0
            final_cols.append(c)
    df.columns = final_cols

    df = df.dropna(how="all")

    return df


def validate_columns(df: pd.DataFrame) -> list[str]:
    """
    Valida que el DataFrame tenga las columnas ERP minimas requeridas.
    Retorna lista de columnas faltantes. Lista vacia = todo OK.
    """
    df_cols_upper = {c.upper() for c in df.columns}
    return [col for col in REQUIRED_COLUMNS if col.upper() not in df_cols_upper]


def normalize_ids(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """
    Normaliza IDs: elimina espacios y caracteres especiales.
    Preserva ceros a la izquierda para columnas críticas.
    Trunca decimales de floats (204.0 -> 204, no 2040).

    Para columnas en ID_COLS_PRESERVE_ZEROS, los ceros a la izquierda
    se mantienen intactos (ej: "01240" sigue siendo "01240").
    Para otras columnas, se eliminan ceros iniciales no significativos.

    Args:
        df: DataFrame a normalizar
        column: Nombre de la columna a normalizar

    Returns:
        DataFrame con columna normalizada
    """
    if column not in df.columns:
        return df

    preserve_zeros = column.upper() in ID_COLS_PRESERVE_ZEROS

    def _clean_id(val):
        if pd.isna(val):
            return ""
        s = str(val).strip()
        # Si es float como "204.0", truncar a entero SIN perder ceros a la izquierda
        if "." in s:
            try:
                f = float(s)
                if f == int(f):
                    # Para columnas que preservan ceros, usar zfill después
                    s = str(int(f)) if not preserve_zeros else s.split(".")[0].zfill(len(s.split(".")[0]))
            except (ValueError, OverflowError):
                pass
        # Eliminar solo caracteres no alfanuméricos (excepto guiones)
        s = re.sub(r"[^A-Z0-9\-]", "", s.upper())
        # Para columnas que NO preservan ceros, eliminar ceros iniciales
        if not preserve_zeros and s:
            s = s.lstrip('0')
        return s

    df[column] = df[column].apply(_clean_id)
    return df


def format_entity_label(id_val: str, name_val: str) -> str:
    """
    Crea etiqueta compuesta ID - NOMBRE para display en UI.

    Ejemplos:
        "68414", "PRIMAVERA DISTRIBUIDORES" -> "68414 - PRIMAVERA DISTRIBUIDORES"
        "01178", "MILCA SARAY"               -> "01178 - MILCA SARAY"
        "", "Solo Nombre"                    -> "Solo Nombre"
        "12345", ""                          -> "12345"
    """
    id_str = str(id_val).strip() if pd.notna(id_val) else ""
    name_str = str(name_val).strip() if pd.notna(name_val) else ""

    if id_str and name_str:
        return f"{id_str} - {name_str}"
    return id_str or name_str


def build_entity_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Agrega columnas _LABEL para todas las entidades con ID + nombre.

    Columnas creadas:
        CLIENTE_LABEL, VENDEDOR_LABEL, ARTICULO_LABEL, LINEA_LABEL,
        SUCURSAL_LABEL, GRUPO_LABEL, TIPO_LABEL, FAMILIA_LABEL, PEDIDO_LABEL
    """
    label_entities = [
        ("cliente", "ID_CLIENTE", "NOM_CLIENTE", "CLIENTE_LABEL"),
        ("vendedor", "ID_VENDEDOR", "NOM_VENDEDOR", "VENDEDOR_LABEL"),
        ("articulo", "ID_ARTICULO", "NOM_ARTICULO", "ARTICULO_LABEL"),
        ("linea", "ID_LINEA", "NOM_LINEA", "LINEA_LABEL"),
        ("sucursal", "COD_SUCURSAL", "NOM_SUCURSAL", "SUCURSAL_LABEL"),
        ("grupo", "ID_GRUPO", "NOM_GRUPO", "GRUPO_LABEL"),
        ("tipo", "ID_TIPO", "NOM_TIPO", "TIPO_LABEL"),
        ("familia", "ID_FAMILIA", "NOM_FAMILIA", "FAMILIA_LABEL"),
    ]

    for _, id_col, name_col, label_col in label_entities:
        id_exists = id_col in df.columns
        name_exists = name_col in df.columns

        if id_exists and name_exists:
            df[label_col] = df.apply(
                lambda r: format_entity_label(r[id_col], r[name_col]),
                axis=1,
            )
        elif id_exists:
            df[label_col] = df[id_col].astype(str).str.strip()
        elif name_exists:
            df[label_col] = df[name_col].astype(str).str.strip()

    if "ID_PEDIDO" in df.columns:
        df["PEDIDO_LABEL"] = df["ID_PEDIDO"].astype(str).str.strip()

    # Asegurar CLIENTE_UI para compatibilidad con vistas (se usa en dashboard_helpers, etc.)
    if "CLIENTE_LABEL" in df.columns:
        df["CLIENTE_UI"] = df["CLIENTE_LABEL"]

    return df


def format_documento(tipo: str, serie: str, numero: str) -> str:
    """
    Concatena tipo + serie + numero en formato legible.

    Usa solo la primera letra del tipo para el formato compacto:
        F01 + 204 + 55238  -> "F204-55238"
        NCR + 215 + 29845  -> "N215-29845 (NC)"
        NDB + 214 + 3843   -> "N214-3843 (NC)"
        BDI + 203 + 52481  -> "B203-52481"
    """
    if not tipo or not serie or not numero:
        return ""

    tipo = str(tipo).strip().upper()
    serie = str(serie).strip()
    numero = str(numero).strip()

    primer_char = tipo[0] if tipo else ""
    doc_base = f"{primer_char}{serie}-{numero}"

    if tipo.startswith(NC_PREFIXES):
        doc_base += " (NC)"

    return doc_base


def build_doc_completo(df: pd.DataFrame) -> pd.DataFrame:
    """
    Agrega columna DOC_COMPLETO al DataFrame concatenando
    TPO_DOC + SERIE_DOC + NRO_DOC con formato legible.
    """
    tpo_col = next((c for c in df.columns if "TPO_DOC" in c), None)
    serie_col = next((c for c in df.columns if "SERIE_DOC" in c), None)
    nro_col = next((c for c in df.columns if "NRO_DOC" in c), None)

    if not all([tpo_col, serie_col, nro_col]):
        return df

    df["DOC_COMPLETO"] = df.apply(
        lambda r: format_documento(
            str(r.get(tpo_col, "")),
            str(r.get(serie_col, "")),
            str(r.get(nro_col, "")),
        ),
        axis=1,
    )

    return df


def get_entity_columns(entity: str) -> dict:
    """
    Retorna el mapeo de columnas ID + nombre + label para una entidad.
    """
    return ENTITY_MAP.get(entity, {})


def detectar_tipo_documento(df: pd.DataFrame) -> Optional[str]:
    """Detecta el tipo de documento (Factura, Boleta, NC) basado en TPO_DOC."""
    col = next((c for c in df.columns if "TPO_DOC" in c), None)
    if col is None:
        return None

    valores = df[col].dropna().unique()
    tipos = set()
    for v in valores:
        v_str = str(v).upper().strip()
        if v_str.startswith("F"):
            tipos.add("FACTURA")
        elif v_str.startswith("B"):
            tipos.add("BOLETA")
        elif v_str.startswith(NC_PREFIXES) or "NOTA" in v_str:
            tipos.add("NC")

    return ", ".join(tipos) if tipos else None


def get_doc_label(tipo_doc: str) -> str:
    """
    Retorna la etiqueta legible para un tipo de documento.
    """
    return DOC_TYPE_LABELS.get(str(tipo_doc).upper().strip(), str(tipo_doc))


def parse_excel_date(value) -> Optional[pd.Timestamp]:
    """
    Convierte fecha estilo Excel a datetime.

    Soporta 3 formatos:
    1. Numero serial Excel (45454 -> 2024-07-15)
    2. String DD/MM/YYYY ("02/04/2026" -> 2026-04-02)
    3. String YYYY-MM-DD ("2026-04-02" -> 2026-04-02)

    Para numeros seriales Excel:
        Excel usa dias desde 1900-01-01 con bug del ano 1900.
        Formula: datetime(1899, 12, 30) + timedelta(days=serial)
    """
    if pd.isna(value):
        return None

    if isinstance(value, pd.Timestamp):
        return value

    if isinstance(value, (int, float)):
        try:
            return pd.Timestamp("1899-12-30") + pd.Timedelta(days=value)
        except Exception:
            return None

    text = str(value).strip()
    if not text:
        return None

    # Verificar si es una representacion en texto de un numero serial (ej: "45454" o "45454.0")
    if re.match(r"^\d+(\.\d+)?$", text):
        try:
            serial_val = float(text)
            if 0 < serial_val < 1000000:
                return pd.Timestamp("1899-12-30") + pd.Timedelta(days=serial_val)
        except Exception:
            pass

    if re.match(r"^\d{1,2}/\d{1,2}/\d{2,4}$", text):
        try:
            return pd.to_datetime(text, dayfirst=True)
        except Exception:
            return None

    if re.match(r"^\d{4}-\d{1,2}-\d{1,2}", text):
        try:
            return pd.to_datetime(text)
        except Exception:
            return None

    try:
        return pd.to_datetime(text, dayfirst=True)
    except Exception:
        return None


def parse_mes_column(mes_str: str, anho: str = None) -> tuple:
    """
    Parsea la columna MES formato '04-ABRIL' -> (4, 'ABRIL', 'YYYY-MM').
    Si anho no se provee, usa el anio actual.
    """
    if pd.isna(mes_str):
        return None, None, None

    parts = str(mes_str).strip().split("-")
    if len(parts) == 2:
        mes_num = int(parts[0])
        mes_nom = parts[1].upper()
        year = anho if anho else str(pd.Timestamp.now().year)
        return mes_num, mes_nom, f"{year}-{mes_num:02d}"
    return None, None, None
