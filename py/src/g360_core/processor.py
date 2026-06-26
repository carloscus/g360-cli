"""
G360 Insight Lens - Motor de Procesamiento de Datos
====================================================
Modulo central que transforma datos crudos de archivos ERP (.xls/.xlsx) en
informacion analitica estructurada para la toma de decisiones comerciales.

Responsabilidades principales:
- Limpieza y normalizacion de headers ERP (ignora logos, filas vacias)
- Normalizacion de Notas de Credito (invierte signo de montos positivos)
- Calculo de KPIs: Venta Bruta, Venta Neta, Tasa de Devolucion
- Deteccion automatica de perfil: Asistente (1 vendedor) vs Supervisor (>1)
- Agregaciones por vendedor, linea, canal, departamento, distrito, sucursal
- Analisis de cartera: clientes dormidos, concentracion HHI
- Gap Analysis: SKUs no comprados por cliente
- Comparador temporal: periodo A vs periodo B con variacion porcentual
- Historial de precios por SKU con deteccion de anomalias (>10% variacion)
- Analisis de sucursales: deteccion automatica con/sin sucursales
- Trazabilidad por pedido: agrupacion de facturas por ID_PEDIDO
- Adopcion de lineas nuevas: porcentaje de clientes tradicionales que compran nuevas

Formato ERP esperado (columnas):
    ANHO, MES, DOC_CLIENTE, ID_CLIENTE, NOM_CLIENTE, ID_LOCALIDAD_UBIGEO,
    NOM_DEPARTAMENTO, NOM_PROVINCIA, NOM_DISTRITO, ID_LINEA, NOM_LINEA,
    ID_GRUPO, NOM_GRUPO, ID_TIPO, NOM_TIPO, ID_FAMILIA, NOM_FAMILIA,
    ESTADO_LINEA, ID_ARTICULO, NOM_ARTICULO, ID_VENDEDOR, NOM_VENDEDOR,
    CANAL DE DISTRIBUCION, COD_SUCURSAL, NOM_SUCURSAL, TPO_DOC, SERIE_DOC,
    NRO_DOC, ORD_COMPRA, ID_GUIA, FECHA_ORIG, REFERENCIA, FECHA_REF,
    MONEDA, CANTIDAD, SOLES, DOLARES, NOM_CONDICION_PAGO, ID_PEDIDO,
    FECHA_VENC, DIVISION, FEC_CARGO

Autor: G360 Ecosystem
Version: 1.0
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Tuple
from datetime import datetime
from .utils import clean_erp_headers, normalize_ids, build_doc_completo, build_entity_labels, NC_PREFIXES, ERP_TPO_DOC_NC, ERP_TPO_DOC_NDB, validate_columns, parse_excel_date
from .processor_sku import ProcessorSKU
from .processor_segmentacion import ProcessorSegmentacion
from .logger import get_logger
from .commercial_engine import (
    classify_base,
    parse_referencia,
    resolve_document_relationships,
    calculate_prices,
)

log = get_logger("processor")


class InsightProcessor(ProcessorSKU, ProcessorSegmentacion):
    """
    Motor principal de procesamiento de datos para G360 Insight Lens.

    Transforma un DataFrame crudo de un archivo ERP en datos limpios,
    enriquecidos y listos para analisis comercial.

    Hereda de:
        ProcessorSKU: Metodos de analisis a nivel de SKU
        ProcessorSegmentacion: Metodos de segmentacion, agrupacion y comparacion
    """

    def __init__(self, df: pd.DataFrame, devolucion_threshold: float = 8.0):
        """
        Inicializa el procesador y ejecuta el pipeline de transformacion.

        Args:
            df: DataFrame crudo del archivo ERP con todas las columnas originales.
                Se espera que los datos vengan como strings (dtype=str en read_excel).
            devolucion_threshold: Umbral porcentual para activar alerta de tasa de
                devolucion. Si la tasa supera este valor, se marca como alerta.
                Default: 8.0 (8%).

        Raises:
            ValueError: Si faltan columnas ERP minimas requeridas.
        """
        self.df: Optional[pd.DataFrame] = None
        self.devolucion_threshold = devolucion_threshold
        self.profile = "asistente"
        self._cache: Dict[str, any] = {}
        log.info("Inicializando InsightProcessor con %d filas, umbral devolucion=%.1f%%", len(df), devolucion_threshold)
        self._process(df)


    def _process(self, df: pd.DataFrame):
        """
        Ejecuta el pipeline completo de procesamiento de datos.

        El orden de las operaciones es critico:
        - Los headers deben limpiarse primero para que las columnas sean reconocibles
        - Los IDs se normalizan antes de cualquier agrupacion
        - Las columnas numericas se convierten antes de calculos matematicos
        - El precio unitario se calcula antes de normalizar NC (para preservar logica)
        - Las NC se normalizan antes de calcular KPIs (para que los montos sean correctos)
        - Los KPIs se calculan antes de cualquier agregacion
        - Las fechas se parsean para permitir analisis temporal
        - El perfil se detecta al final basado en datos ya limpios

        Raises:
            ValueError: Si faltan columnas ERP minimas requeridas.
        """
        # Paso 0: Validacion de columnas minimas
        missing = validate_columns(df)
        if missing:
            raise ValueError(
                f"Columnas ERP requeridas faltantes: {', '.join(missing)}. "
                f"Verifica que el archivo sea un reporte valido del ERP."
            )

        log.info("Pipeline iniciado - %d filas, %d columnas", len(df), len(df.columns))

        # Paso 1: Limpieza de headers ERP (elimina filas de logos/titulos)
        self.df = clean_erp_headers(df)
        log.info("Headers limpiados: %d filas restantes", len(self.df))

        # Paso 1b: Validar formato ERP conocido (dgvVentas)
        expected_cols = {"ANHO", "MES", "ID_CLIENTE", "NOM_CLIENTE", "ID_ARTICULO",
                         "NOM_ARTICULO", "ID_VENDEDOR", "NOM_VENDEDOR", "TPO_DOC",
                         "SERIE_DOC", "NRO_DOC", "FECHA_ORIG", "REFERENCIA",
                         "CANTIDAD", "SOLES", "ESTADO_LINEA"}
        found_cols = set(self.df.columns)
        missing_known = expected_cols - found_cols
        if missing_known:
            log.warning("Columnas ERP conocidas faltantes: %s — el archivo puede no ser dgvVentas", missing_known)

        # Paso 1c: Eliminar fila de totales del reporte ERP
        # Se identifica porque tiene TPO_DOC, ID_CLIENTE y FECHA_ORIG vacios
        id_cols = [c for c in ["TPO_DOC", "FECHA_ORIG", "ID_CLIENTE"] if c in self.df.columns]
        if id_cols:
            mask_totales = self.df[id_cols].apply(
                lambda r: r.isna().all() or (r.astype(str).str.strip() == "").all(), axis=1
            )
            n_totales = mask_totales.sum()
            if n_totales > 0:
                self.df = self.df[~mask_totales]
                log.info("Fila de totales eliminada: %d fila(s)", n_totales)

        # Paso 2: Normalizacion de IDs clave para consistencia en agrupaciones
        # Se preservan ceros a la izquierda en columnas críticas (ver utils.py)
        for col in ["ID_VENDEDOR", "ID_CLIENTE", "ID_ARTICULO", "NRO_DOC", "SERIE_DOC",
                     "ID_LINEA", "ID_GRUPO", "ID_TIPO", "ID_FAMILIA", "COD_SUCURSAL"]:
            self.df = normalize_ids(self.df, col)

        # Paso 2b: Construir columna DOC_COMPLETO (tipo + serie + numero)
        self.df = build_doc_completo(self.df)

        # Paso 2c: Construir columnas _LABEL (ID - NOMBRE) para display
        self.df = build_entity_labels(self.df)

        # Paso 2d: Crear alias de columnas para compatibilidad con vistas (sin eliminar originales)
        # Aliases para nombres de productos y vendedores
        if "NOM_ARTICULO" in self.df.columns and "PRODUCTO_NOM" not in self.df.columns:
            self.df["PRODUCTO_NOM"] = self.df["NOM_ARTICULO"]
        if "NOM_VENDEDOR" in self.df.columns and "VENDEDOR_NOM" not in self.df.columns:
            self.df["VENDEDOR_NOM"] = self.df["NOM_VENDEDOR"]
        # Alias para tipo de documento
        if "TPO_DOC" in self.df.columns and "TIPO_DOC" not in self.df.columns:
            self.df["TIPO_DOC"] = self.df["TPO_DOC"]
        # Aliases para cantidad y monto
        if "CANTIDAD" in self.df.columns and "CANT_FISICA" not in self.df.columns:
            self.df["CANT_FISICA"] = self.df["CANTIDAD"]
        if "SOLES" in self.df.columns and "NETO_SOLES" not in self.df.columns:
            self.df["NETO_SOLES"] = self.df["SOLES"]

        # Paso 3-8: Transformaciones secuenciales
        self._convert_numeric_columns()
        self._normalize_nc()
        classify_base(self.df)
        if "REFERENCIA" in self.df.columns:
            parse_referencia(self.df)
        resolve_document_relationships(self.df)
        calculate_prices(self.df)
        self._calculate_monto_factura()
        self._calculate_kpis()
        self._parse_fechas()
        self._detect_stock_dormido()
        self._detect_profile()
        log.info("Pipeline completado - perfil=%s, filas=%d, columnas=%d", self.profile, len(self.df), len(self.df.columns))


    def _convert_numeric_columns(self):
        """
        Convierte columnas de texto a numerico con manejo robusto de errores.

        Las columnas SOLES, CANTIDAD y DOLARES vienen como strings del archivo ERP.
        Se convierten a float usando pd.to_numeric con errors="coerce" que convierte
        valores no numericos a NaN, luego se reemplazan con 0 para evitar errores
        en operaciones matematicas posteriores.

        Nota: Se usa fillna(0) en lugar de dropna para preservar las filas completas
        y evitar perdida de datos en otras columnas.
        """
        numeric_cols = ["SOLES", "CANTIDAD", "DOLARES"]
        for col in numeric_cols:
            if col in self.df.columns:
                self.df[col] = pd.to_numeric(self.df[col], errors="coerce").fillna(0)


    def _normalize_nc(self):
        """
        Normaliza los montos de Notas de Credito para que sean negativos.

        Logica de negocio:
        - Las Notas de Credito (NC) representan devoluciones o anulaciones
        - En el ERP, algunas NC vienen con montos POSITIVOS (error comun)
        - Para calculos correctos de Venta Neta, las NC DEBEN ser negativas
        - Se detectan por TPO_DOC: valores que empiezan con "NC", "NOTA" o "BV"
          (BV = Boleta de Venta anulada, que funciona como NC)

        Proceso:
        1. Identificar columna TPO_DOC (busqueda flexible por substring)
        2. Crear mascara de filas que son NC (regex: ^NC|^NOTA|^BV)
        3. Crear mascara de filas con monto SOLES positivo
        4. Invertir signo de SOLES y CANTIDAD donde ambas condiciones se cumplen

        Ejemplo:
            Antes: TPO_DOC="NC01", SOLES=5000, CANTIDAD=100
            Despues: TPO_DOC="NC01", SOLES=-5000, CANTIDAD=-100
        """
        tpo_col = next((c for c in self.df.columns if "TPO_DOC" in c), None)
        soles_col = "SOLES" if "SOLES" in self.df.columns else None

        if tpo_col and soles_col:
            # Vectorized approach for better performance
            # Mascara: documentos que son Notas de Credito o anulaciones
            nc_pattern = "|".join([f"^{p}" for p in NC_PREFIXES]) + "|^NOTA"
            mask_nc = self.df[tpo_col].astype(str).str.upper().str.contains(
                nc_pattern, na=False
            )
            # Mascara: montos que son positivos (necesitan inversion de signo)
            mask_positivo = self.df[soles_col] > 0
            
            # Combined mask: NC AND positive amount
            combined_mask = mask_nc & mask_positivo
            
            # Apply sign inversion using vectorized operations
            if combined_mask.any():
                self.df.loc[combined_mask, soles_col] = -self.df.loc[combined_mask, soles_col]
                self.df.loc[combined_mask, "CANTIDAD"] = -self.df.loc[combined_mask, "CANTIDAD"]

    def _calculate_monto_factura(self):
        """
        Calcula el monto total por factura (suma de todas las filas con el mismo documento).

        Esta columna es util para:
        - Verificar que una factura individual tenga un total esperado
        - Validar consistencia de datos antes de enviar a SAP/ERP
        - Auditoria de facturas con montos inusuales

        La columna MONTO_FACTURA se calcula sumando todos los SOLES de cada NRO_DOC
        una vez que las NC han sido normalizadas (pueden tener el mismo NRO_DOC).
        """
        if "NRO_DOC" not in self.df.columns or "SOLES" not in self.df.columns:
            return

        # Agrupar por NRO_DOC y sumar SOLES (NC ya estan normalizadas)
        total_por_doc = self.df.groupby("NRO_DOC")["SOLES"].transform("sum")
        self.df["MONTO_FACTURA"] = total_por_doc.round(2)


    def _calculate_kpis(self):
        """
        Calcula las columnas derivadas de KPIs para cada fila del dataset.

        Columnas creadas:
            ES_VENTA: Booleano que indica si la fila es una venta legitima
                      (Factura o Boleta) vs una Nota de Credito.
            VENTA_BRUTA: Monto SOLES si es venta positiva, 0 si es NC o monto negativo.
                         Representa el total facturado sin considerar devoluciones.
            MONTO_NC: Valor absoluto del monto si es NC negativa, 0 si es venta.
                      Representa el total devuelto/anulado.
            VENTA_NETA: VENTA_BRUTA - MONTO_NC. Es el valor real de ventas
                        despues de descontar devoluciones.

        Formula de Venta Neta:
            Venta Neta = (Facturas + Boletas) - Notas de Credito

        Esta logica es fundamental para el KPI de "Tasa de Devolucion" que se
        calcula posteriormente como: (Monto NC / Venta Bruta) * 100
        """
        soles = "SOLES" if "SOLES" in self.df.columns else None
        if not soles:
            return

        tpo_col = next((c for c in self.df.columns if "TPO_DOC" in c), None)

        # Known ERP format: F01/BDI = venta, NCR = credito, NDB = debito
        if tpo_col:
            tpo_upper = self.df[tpo_col].astype(str).str.upper().str.strip()
            self.df["ES_VENTA"] = ~tpo_upper.isin(ERP_TPO_DOC_NC)
            self.df["ES_NDB"] = tpo_upper.isin(ERP_TPO_DOC_NDB)
        else:
            self.df["ES_VENTA"] = self.df[soles] > 0
            self.df["ES_NDB"] = False

        # Calcular Venta Bruta: solo ventas positivas cuentan
        # Vectorized operations for better performance
        es_venta = self.df["ES_VENTA"]
        soles_vals = self.df[soles]
        # Venta Bruta: solo si es venta Y el monto es positivo
        self.df["VENTA_BRUTA"] = np.where(es_venta & (soles_vals > 0), soles_vals, 0.0)
        # Monto NC: valor absoluto si NO es venta Y el monto es negativo
        self.df["MONTO_NC"] = np.where(~es_venta & (soles_vals < 0), np.abs(soles_vals), 0.0)

        # Venta Neta = Bruta - Devoluciones
        self.df["VENTA_NETA"] = self.df["VENTA_BRUTA"] - self.df["MONTO_NC"]


    def _parse_fechas(self):
        """
        Convierte la columna FECHA_ORIG de string a datetime.

        Formato ERP conocido: DD/MM/YYYY (ej: "24/06/2026")
        Tambien soporta: numeros serial Excel, YYYY-MM-DD

        La columna resultante FECHA_DT se usa para:
        - Analisis temporal (tendencias mensuales)
        - Comparador de periodos
        - Deteccion de clientes dormidos (dias sin comprar)
        - Rango de fechas del reporte
        """
        if "FECHA_ORIG" not in self.df.columns:
            return

        try:
            if self.df["FECHA_ORIG"].apply(lambda x: isinstance(x, (int, float)) and not pd.isna(x)).all():
                self.df["FECHA_DT"] = pd.Timestamp("1899-12-30") + pd.to_timedelta(self.df["FECHA_ORIG"], unit='D')
            else:
                # ERP format: DD/MM/YYYY — dayfirst=True handles this
                self.df["FECHA_DT"] = pd.to_datetime(self.df["FECHA_ORIG"], dayfirst=True, errors='coerce')
        except Exception:
            self.df["FECHA_DT"] = self.df["FECHA_ORIG"].apply(parse_excel_date)


    def _detect_profile(self):
        """
        Detecta automaticamente el perfil del usuario basado en los datos.

        Criterio:
        - Si hay MAS DE 1 vendedor unico -> Modo "supervisor"
          (tiene vision del equipo completo, puede ver comparativos)
        - Si hay 1 solo vendedor -> Modo "asistente"
          (solo ve sus propios datos, foco en cliente y SKU)

        Esta deteccion permite que la UI adapte su comportamiento:
        - En modo supervisor: muestra ranking de vendedores, comparativos, metas
        - En modo asistente: muestra analisis de cliente, historial de SKU

        Nota: Se usa dropna() para excluir valores nulos del conteo,
        evitando falsos positivos si la columna tiene filas vacias.
        """
        vendedor_col = next((c for c in self.df.columns if "ID_VENDEDOR" in c), None)
        if vendedor_col:
            unique_vendedores = self.df[vendedor_col].dropna().nunique()
            self.profile = "supervisor" if unique_vendedores > 1 else "asistente"

    def _detect_stock_dormido(self):
        """
        Marca STOCK_DORMIDO = 1 si FECHA_ORIG - FECHA_REF > 90 dias.

        Detecta productos que permanecieron en stock mas de 90 dias
        antes de ser vendidos o devueltos.
        """
        if "FECHA_ORIG" not in self.df.columns or "FECHA_REF" not in self.df.columns:
            # Si faltan columnas, inicializar en 0
            self.df["STOCK_DORMIDO"] = 0
            return

        try:
            orig = pd.to_datetime(
                self.df["FECHA_ORIG"],
                dayfirst=True,
                errors="coerce",
            )
            ref = pd.to_datetime(
                self.df["FECHA_REF"],
                dayfirst=True,
                errors="coerce",
            )
            delta = (orig - ref).dt.days
            self.df["STOCK_DORMIDO"] = np.where(
                delta.notna() & (delta > 90),
                1,
                0,
            ).astype(int)
        except Exception:
            # En caso de error, columna en 0
            self.df["STOCK_DORMIDO"] = 0


    def _cache_key(self, method_name: str, **kwargs) -> str:
        """Genera clave de cache para un metodo con sus argumentos."""
        args_str = ",".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return f"{method_name}({args_str})"


    def _get_cached(self, key: str) -> Optional[any]:
        """Retorna valor cacheado si existe y no ha expirado."""
        entry = self._cache.get(key)
        if entry:
            return entry["value"]
        return None


    def _set_cached(self, key: str, value: any):
        """Almacena valor en cache."""
        self._cache[key] = {"value": value}


    def clear_cache(self):
        """Limpia toda la cache de resultados."""
        self._cache.clear()


    def get_venta_bruta_total(self) -> float:
        """
        Retorna la suma total de Venta Bruta del dataset.

        Venta Bruta = Suma de todos los montos de Facturas y Boletas positivas.
        No incluye Notas de Credito.

        Returns:
            float: Total de venta bruta en soles. 0.0 si la columna no existe.
        """
        return self.df["VENTA_BRUTA"].sum() if "VENTA_BRUTA" in self.df.columns else 0.0


    def get_venta_neta_total(self) -> float:
        """
        Retorna la suma total de Venta Neta del dataset.

        Venta Neta = Venta Bruta - Monto total de Notas de Credito.
        Representa el valor real de ventas despues de devoluciones.

        Returns:
            float: Total de venta neta en soles. 0.0 si la columna no existe.
        """
        return self.df["VENTA_NETA"].sum() if "VENTA_NETA" in self.df.columns else 0.0


    def get_tasa_devolucion(self) -> float:
        """
        Calcula la Tasa de Devolucion como porcentaje.

        Formula:
            Tasa de Devolucion = (Monto NC / Venta Bruta) * 100

        Interpretacion:
        - 0%: No hubo devoluciones en el periodo
        - <8%: Nivel aceptable (verde)
        - >=8%: Nivel de alerta (rojo) - requiere investigacion
        - >15%: Nivel critico - posible problema de calidad o logistica

        Returns:
            float: Porcentaje de devolucion. 0.0 si venta bruta es 0.
        """
        venta_bruta = self.get_venta_bruta_total()
        monto_nc = self.df["MONTO_NC"].sum() if "MONTO_NC" in self.df.columns else 0.0
        if venta_bruta == 0:
            return 0.0
        return (monto_nc / venta_bruta) * 100


    def is_devolucion_alert(self) -> bool:
        """
        Verifica si la tasa de devolucion supera el umbral configurado.

        Returns:
            bool: True si la tasa de devolucion > devolucion_threshold.
        """
        return self.get_tasa_devolucion() > self.devolucion_threshold


    def get_stats_generales(self) -> dict:
        """
        Retorna un diccionario con estadisticas generales del dataset.

        Este metodo es el punto de entrada principal para los KPI cards
        de la interfaz de usuario. Proporciona un resumen rapido de
        todos los indicadores clave en una sola llamada.

        Returns:
            dict: Con las siguientes claves:
                - total_registros: Numero de filas en el dataset
                - total_soles: Suma total de la columna SOLES
                - total_cantidad: Suma total de unidades
                - venta_bruta: Total de ventas brutas
                - venta_neta: Total de ventas netas
                - tasa_devolucion: Porcentaje de devolucion
                - alerta_devolucion: Booleano si supera threshold
                - perfil: "asistente" o "supervisor"
                - n_vendedores: Numero de vendedores unicos
                - n_clientes: Numero de clientes unicos
                - n_articulos: Numero de articulos unicos
                - n_lineas: Numero de lineas unicas
                - rango_fechas: Tuple (fecha_min, fecha_max)
        """
        n_docs = self.df["NRO_DOC"].nunique() if "NRO_DOC" in self.df.columns else 0
        v_neta = self.get_venta_neta_total()
        ticket_prom = v_neta / n_docs if n_docs > 0 else 0.0
        
        skus_ped = 0.0
        if "NRO_DOC" in self.df.columns and "ID_ARTICULO" in self.df.columns and n_docs > 0:
            try:
                skus_ped = float(self.df.groupby("NRO_DOC")["ID_ARTICULO"].nunique().mean())
            except Exception:
                skus_ped = 0.0

        def _nunique_sin_vacios(col: str) -> int:
            if col not in self.df.columns:
                return 0
            s = self.df[col].dropna()
            s = s[s.astype(str).str.strip() != ""]
            return s.nunique()

        stats = {
            "total_registros": len(self.df),
            "total_soles": self.df["SOLES"].sum() if "SOLES" in self.df.columns else 0,
            "total_cantidad": self.df["CANTIDAD"].sum() if "CANTIDAD" in self.df.columns else 0,
            "venta_bruta": self.get_venta_bruta_total(),
            "venta_neta": v_neta,
            "tasa_devolucion": self.get_tasa_devolucion(),
            "alerta_devolucion": self.is_devolucion_alert(),
            "perfil": self.profile,
            "n_vendedores": _nunique_sin_vacios("ID_VENDEDOR"),
            "n_clientes": _nunique_sin_vacios("ID_CLIENTE"),
            "n_articulos": _nunique_sin_vacios("ID_ARTICULO"),
            "n_lineas": _nunique_sin_vacios("NOM_LINEA"),
            "rango_fechas": self.get_rango_fechas(),
            "ticket_promedio": ticket_prom,
            "skus_por_pedido": skus_ped,
        }
        return stats


    def get_resumen_por_mes(self) -> pd.DataFrame:
        """
        Genera resumen temporal agrupado por la columna MES del ERP.

        La columna MES tiene formato "04-ABRIL", "03-MARZO", etc.
        Se usa para analisis de tendencia mensual cuando no se requiere
        precision a nivel de dia.

        Returns:
            pd.DataFrame: Resumen por mes con total_soles, venta_bruta,
                          venta_neta, n_documentos.
        """
        mes_col = next((c for c in self.df.columns if "MES" in c and "MES_" not in c), None)
        if not mes_col:
            return pd.DataFrame()

        resumen = self.df.groupby(mes_col).agg(
            total_soles=("SOLES", "sum"),
            venta_bruta=("VENTA_BRUTA", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_documentos=("NRO_DOC", "nunique") if "NRO_DOC" in self.df.columns else ("SOLES", "count"),
        ).reset_index()

        return resumen


    def get_resumen_temporal(self) -> pd.DataFrame:
        """
        Genera resumen temporal agrupado por mes-anio usando FECHA_DT.

        A diferencia de get_resumen_por_mes(), este metodo usa la columna
        FECHA_DT (datetime) para crear periodos mensuales precisos con
        pd.to_period("M"). Esto permite comparaciones exactas entre meses
        independientemente del formato de la columna MES del ERP.

        Returns:
            pd.DataFrame: Resumen por mes-anio con total_soles, venta_bruta,
                          venta_neta, n_documentos. MES_ANIO como string "2026-04".
        """
        if "FECHA_DT" not in self.df.columns:
            return pd.DataFrame()

        df_temp = self.df.dropna(subset=["FECHA_DT"]).copy()
        df_temp["MES_ANIO"] = df_temp["FECHA_DT"].dt.to_period("M")

        resumen = df_temp.groupby("MES_ANIO").agg(
            total_soles=("SOLES", "sum"),
            venta_bruta=("VENTA_BRUTA", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_documentos=("NRO_DOC", "nunique") if "NRO_DOC" in self.df.columns else ("SOLES", "count"),
        ).reset_index()

        resumen["MES_ANIO"] = resumen["MES_ANIO"].astype(str)

        return resumen


    def get_rango_fechas(self) -> Tuple[Optional[datetime], Optional[datetime]]:
        """
        Retorna el rango de fechas del dataset (min y max).

        Intenta usar FECHA_DT primero (columna parseada a datetime).
        Si no existe, intenta parsear FECHA_ORIG directamente.

        Returns:
            Tuple: (fecha_minima, fecha_maxima). (None, None) si no hay fechas.
        """
        if "FECHA_DT" not in self.df.columns:
            if "FECHA_ORIG" in self.df.columns:
                fechas = pd.to_datetime(self.df["FECHA_ORIG"], dayfirst=True, errors="coerce").dropna()
                if fechas.empty:
                    return None, None
                return fechas.min(), fechas.max()
            return None, None

        fechas = self.df["FECHA_DT"].dropna()
        if fechas.empty:
            return None, None

        return fechas.min(), fechas.max()


    def get_data(self) -> pd.DataFrame:
        """
        Retorna el DataFrame procesado (sin copia para evitar desperdicio de memoria).

        NOTA: Los llamadores NO deben modificar el DataFrame retornado.
              Se retorna sin copia deliberadamente para ahorrar RAM con datasets grandes.

        Returns:
            pd.DataFrame: DataFrame con todas las columnas originales
                          mas las columnas derivadas (VENTA_BRUTA, VENTA_NETA,
                          MONTO_NC, ES_VENTA, PRECIO_UNID, FECHA_DT).
        """
        return self.df


