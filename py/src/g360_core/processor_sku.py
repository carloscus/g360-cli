"""SKU drilldown methods for InsightProcessor — extracted from processor.py."""

import pandas as pd
import numpy as np
from typing import Optional
from datetime import datetime


class ProcessorSKU:
    """Mixin class with all SKU-level analysis methods."""


    def get_historial_sku(self, sku: str) -> pd.DataFrame:
        """
        Retorna el historial completo de un SKU especifico.

        Filtra todas las filas donde ID_ARTICULO coincide con el SKU solicitado
        y ordena por fecha descendente (mas reciente primero).

        Util para:
        - Ver todas las facturas que incluyeron este SKU
        - Analizar patron de compras de un articulo especifico
        - Trazabilidad completa de un producto

        Args:
            sku: ID del articulo (ej: "78339").

        Returns:
            pd.DataFrame: Historial del SKU ordenado por fecha descendente.
        """
        historial = self.df[self.df["ID_ARTICULO"] == sku]
        if "FECHA_DT" in historial.columns:
            return historial.sort_values("FECHA_DT", ascending=False)
        return historial

    def get_precio_por_sucursal(self, sku: str) -> pd.DataFrame:
        """
        Ranking de sucursales por precio unitario para un SKU especifico.

        Responde: "Que sucursales negocian mas barato?"

        Para cada sucursal que compro el SKU, calcula:
        - precio_promedio: Precio unitario promedio
        - precio_min/max: Rango de precios negociados
        - desviacion_pct: Desviacion vs precio global promedio
          - Negativo = negocia mas barato que el promedio
          - Positivo = negocia mas caro que el promedio

        La deteccion de sucursales con precios significativamente mas bajos
        puede indicar:
        - Negociacion agresiva del comprador
        - Descuentos no autorizados
        - Estrategia de precios diferenciada por region

        Args:
            sku: ID del articulo (ej: "78339").

        Returns:
            pd.DataFrame: Ranking de sucursales con precio_promedio,
                          precio_min, precio_max, total_soles, cantidad,
                          n_compras, desviacion_pct, precio_global.
                          Ordenado por precio_promedio ascendente.
        """
        sucursal_col = next((c for c in self.df.columns if "NOM_SUCURSAL" in c), None)
        if not sucursal_col:
            return pd.DataFrame()

        # Filtrar solo filas del SKU con cantidad positiva (excluir NCs)
        df_sku = self.df[(self.df["ID_ARTICULO"] == sku) & (self.df["CANTIDAD"] > 0)]
        if df_sku.empty:
            return pd.DataFrame()

        # Excluir filas sin sucursal registrada
        df_sku = df_sku[df_sku[sucursal_col].astype(str).str.strip() != ""]

        if df_sku.empty:
            return pd.DataFrame()

        # Agregar por sucursal
        resumen = df_sku.groupby(sucursal_col).agg(
            precio_promedio=("PRECIO_UNID", "mean"),
            precio_min=("PRECIO_UNID", "min"),
            precio_max=("PRECIO_UNID", "max"),
            total_soles=("SOLES", "sum"),
            cantidad=("CANTIDAD", "sum"),
            n_compras=("NRO_DOC", "nunique") if "NRO_DOC" in self.df.columns else ("SOLES", "count"),
        ).reset_index()

        # Calcular desviacion vs precio global promedio
        precio_global = resumen["precio_promedio"].mean()
        if precio_global != 0:
            resumen["desviacion_pct"] = ((resumen["precio_promedio"] - precio_global) / precio_global * 100).round(1)
        else:
            resumen["desviacion_pct"] = 0.0
        resumen["precio_global"] = round(precio_global, 4)

        return resumen.sort_values("precio_promedio", ascending=True)

    def get_historial_precios_sku(self, sku: str) -> pd.DataFrame:
        """
        Historial de precios de un SKU con deteccion de variaciones anomalias.

        Para cada transaccion del SKU, calcula:
        - variacion_pct: Cambio porcentual vs la transaccion anterior
        - alerta_precio: Booleano - True si la variacion supera 10%

        Las alertas de precio son utiles para detectar:
        - "Guerras de precios" internas entre vendedores
        - Descuentos no autorizados
        - Errores de digitacion en facturas
        - Cambios de lista de precios no comunicados

        Args:
            sku: ID del articulo (ej: "78339").

        Returns:
            pd.DataFrame: Historial del SKU con columnas adicionales
                          variacion_pct y alerta_precio.
        """
        historial = self.get_historial_sku(sku)
        if historial.empty:
            return pd.DataFrame()

        # Excluir filas con cantidad 0 o negativa (NCs)
        historial = historial[historial["CANTIDAD"] > 0].copy()

        if "FECHA_DT" in historial.columns:
            # Ordenar cronologicamente para calcular variacion secuencial
            historial = historial.sort_values("FECHA_DT")
            # Calcular variacion porcentual vs transaccion anterior
            historial["variacion_pct"] = historial["PRECIO_UNID"].pct_change() * 100
            historial["variacion_pct"] = historial["variacion_pct"].round(1)
            # Marcar variaciones mayores al 10% como alertas
            historial["alerta_precio"] = historial["variacion_pct"].abs() > 10

        return historial

    def get_ventas_sku_por_vendedor(self, sku: str) -> pd.DataFrame:
        """
        Desglose de ventas de un SKU por vendedor.

        Retorna por cada vendedor que vendio el SKU:
        - Cantidad total de unidades
        - Total en soles
        - Precio promedio, min, max
        - Numero de documentos/facturas
        - Numero de clientes atendidos
        - Primera y ultima fecha de venta

        Util para:
        - Comparar rendimiento de vendedores en un producto especifico
        - Detectar guerras de precios entre vendedores
        - Identificar que vendedores son mas activos en un SKU

        Args:
            sku: ID del articulo (ej: "78339").

        Returns:
            pd.DataFrame: Ranking de vendedores con metricas del SKU.
        """
        vendedor_col = next((c for c in self.df.columns if "ID_VENDEDOR" in c), None)
        nom_vendedor_col = next((c for c in self.df.columns if "NOM_VENDEDOR" in c), None)
        if not vendedor_col:
            return pd.DataFrame()

        df_sku = self.df[self.df["ID_ARTICULO"] == sku]
        if df_sku.empty:
            return pd.DataFrame()

        agg_dict = {
            "cantidad": ("CANTIDAD", "sum"),
            "total_soles": ("SOLES", "sum"),
            "precio_promedio": ("PRECIO_UNID", "mean"),
            "precio_min": ("PRECIO_UNID", "min"),
            "precio_max": ("PRECIO_UNID", "max"),
            "n_clientes": ("ID_CLIENTE", "nunique"),
        }
        if "NRO_DOC" in df_sku.columns:
            agg_dict["n_documentos"] = ("NRO_DOC", "nunique")
        else:
            agg_dict["n_documentos"] = ("SOLES", "count")
        if "FECHA_DT" in df_sku.columns:
            agg_dict["primera_venta"] = ("FECHA_DT", "min")
            agg_dict["ultima_venta"] = ("FECHA_DT", "max")

        resumen = df_sku.groupby(vendedor_col).agg(**agg_dict).reset_index()

        if nom_vendedor_col and nom_vendedor_col in df_sku.columns:
            nombre_frecuente = df_sku.groupby(vendedor_col)[nom_vendedor_col].agg(
                lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0]
            )
            resumen[nom_vendedor_col] = resumen[vendedor_col].map(nombre_frecuente)

        resumen["precio_promedio"] = resumen["precio_promedio"].round(2)

        precio_global = df_sku["PRECIO_UNID"].mean()
        if precio_global != 0:
            resumen["desviacion_precio"] = (
                (resumen["precio_promedio"] - precio_global) / precio_global * 100
            ).round(1)
        else:
            resumen["desviacion_precio"] = 0.0
        resumen["precio_global"] = round(precio_global, 4)

        if "FECHA_DT" in resumen.columns:
            resumen = resumen.sort_values("total_soles", ascending=False)
        else:
            resumen = resumen.sort_values("total_soles", ascending=False)

        return resumen

    def get_resumen_mensual_sku(self, sku: str) -> pd.DataFrame:
        """
        Evolucion mensual de ventas de un SKU especifico.

        Retorna por cada mes:
        - Total en soles
        - Cantidad de unidades
        - Numero de clientes
        - Numero de documentos
        - Precio promedio
        - Variacion mensual porcentual

        Util para:
        - Identificar estacionalidad de un producto
        - Detectar tendencias de crecimiento/decrecimiento
        - Comparar rendimiento mes a mes

        Args:
            sku: ID del articulo (ej: "78339").

        Returns:
            pd.DataFrame: Evolucion mensual ordenada cronologicamente.
        """
        if "FECHA_DT" not in self.df.columns:
            return pd.DataFrame()

        df_sku = self.df[self.df["ID_ARTICULO"] == sku].copy()
        if df_sku.empty:
            return pd.DataFrame()

        df_sku = df_sku.dropna(subset=["FECHA_DT"])
        df_sku["MES_ANIO"] = df_sku["FECHA_DT"].dt.to_period("M")

        agg_dict = {
            "total_soles": ("SOLES", "sum"),
            "cantidad": ("CANTIDAD", "sum"),
            "n_clientes": ("ID_CLIENTE", "nunique"),
            "precio_promedio": ("PRECIO_UNID", "mean"),
        }
        if "NRO_DOC" in df_sku.columns:
            agg_dict["n_documentos"] = ("NRO_DOC", "nunique")
        else:
            agg_dict["n_documentos"] = ("SOLES", "count")

        resumen = df_sku.groupby("MES_ANIO").agg(**agg_dict).reset_index()
        resumen["MES_ANIO"] = resumen["MES_ANIO"].astype(str)
        resumen["precio_promedio"] = resumen["precio_promedio"].round(2)

        resumen = resumen.sort_values("MES_ANIO")
        resumen["variacion_soles_pct"] = resumen["total_soles"].pct_change() * 100
        resumen["variacion_soles_pct"] = resumen["variacion_soles_pct"].fillna(0).round(1)

        return resumen

    def get_precios_por_cliente_sku(self, sku: str) -> pd.DataFrame:
        """
        Distribucion de precios negociados por cliente para un SKU.

        Para cada cliente que compro el SKU, muestra:
        - Precio promedio, min, max negociado
        - Cantidad total comprada
        - Total en soles
        - Numero de transacciones
        - Desviacion vs precio global

        Util para:
        - Detectar clientes que negocian precios mas bajos
        - Identificar inconsistencias en politica de precios
        - Analizar Impacto de descuentos por cliente

        Args:
            sku: ID del articulo (ej: "78339").

        Returns:
            pd.DataFrame: Clientes con distribucion de precios del SKU.
        """
        df_sku = self.df[self.df["ID_ARTICULO"] == sku]
        if df_sku.empty:
            return pd.DataFrame()

        df_venta = df_sku[df_sku["CANTIDAD"] > 0]
        if df_venta.empty:
            return pd.DataFrame()

        agg_dict = {
            "NOM_CLIENTE": ("NOM_CLIENTE", "first"),
            "cantidad": ("CANTIDAD", "sum"),
            "total_soles": ("SOLES", "sum"),
            "precio_promedio": ("PRECIO_UNID", "mean"),
            "precio_min": ("PRECIO_UNID", "min"),
            "precio_max": ("PRECIO_UNID", "max"),
        }
        if "NRO_DOC" in df_venta.columns:
            agg_dict["n_transacciones"] = ("NRO_DOC", "nunique")
        else:
            agg_dict["n_transacciones"] = ("SOLES", "count")

        resumen = df_venta.groupby("ID_CLIENTE").agg(**agg_dict).reset_index()
        resumen["precio_promedio"] = resumen["precio_promedio"].round(2)

        precio_global = df_venta["PRECIO_UNID"].mean()
        if precio_global != 0:
            resumen["desviacion_precio"] = (
                (resumen["precio_promedio"] - precio_global) / precio_global * 100
            ).round(1)
        else:
            resumen["desviacion_precio"] = 0.0
        resumen["precio_global"] = round(precio_global, 4)

        return resumen.sort_values("total_soles", ascending=False)

    def get_vendedores_count_sku(self, sku: str) -> int:
        """
        Cuenta cuantos vendedores unicos han vendido un SKU.

        Args:
            sku: ID del articulo.

        Returns:
            int: Numero de vendedores unicos.
        """
        vendedor_col = next((c for c in self.df.columns if "ID_VENDEDOR" in c), None)
        if not vendedor_col:
            return 0
        df_sku = self.df[self.df["ID_ARTICULO"] == sku]
        return df_sku[vendedor_col].nunique()

    def query_sku_drilldown(self, sku: str, ref_date: datetime = None) -> dict:
        """
        Analiza a fondo un SKU respondiendo a montos de este mes, año, comparativa YoY,
        clientes principales, precios negociados e historiales de facturas.
        """
        if ref_date is None:
            if "FECHA_DT" in self.df.columns:
                max_dt = self.df["FECHA_DT"].max()
                ref_date = max_dt if pd.notna(max_dt) else datetime.now()
            else:
                ref_date = datetime.now()
            
        df_sku = self.df[self.df["ID_ARTICULO"] == sku]
        if df_sku.empty or "FECHA_DT" not in df_sku.columns:
            return {}

        year_curr = ref_date.year
        month_curr = ref_date.month

        mask_month_curr = (df_sku["FECHA_DT"].dt.year == year_curr) & (df_sku["FECHA_DT"].dt.month == month_curr)
        mask_month_prev = (df_sku["FECHA_DT"].dt.year == year_curr - 1) & (df_sku["FECHA_DT"].dt.month == month_curr)
        mask_ytd_curr = (df_sku["FECHA_DT"].dt.year == year_curr) & (df_sku["FECHA_DT"].dt.month <= month_curr)
        mask_ytd_prev = (df_sku["FECHA_DT"].dt.year == year_curr - 1) & (df_sku["FECHA_DT"].dt.month <= month_curr)

        v_mes_curr = df_sku[mask_month_curr]["SOLES"].sum()
        v_mes_prev = df_sku[mask_month_prev]["SOLES"].sum()
        v_ytd_curr = df_sku[mask_ytd_curr]["SOLES"].sum()
        v_ytd_prev = df_sku[mask_ytd_prev]["SOLES"].sum()

        var_mes = ((v_mes_curr - v_mes_prev) / v_mes_prev * 100) if v_mes_prev != 0 else (100.0 if v_mes_curr > 0 else 0.0)
        var_ytd = ((v_ytd_curr - v_ytd_prev) / v_ytd_prev * 100) if v_ytd_prev != 0 else (100.0 if v_ytd_curr > 0 else 0.0)

        cliente_group = ["ID_CLIENTE"] + (["NOM_CLIENTE"] if "NOM_CLIENTE" in df_sku.columns else [])
        clientes_analytics = df_sku.groupby(cliente_group).agg(
            cantidad_total=("CANTIDAD", "sum"),
            soles_totales=("SOLES", "sum"),
            precio_promedio=("PRECIO_UNID", "mean"),
            precio_min=("PRECIO_UNID", "min"),
            precio_max=("PRECIO_UNID", "max")
        ).reset_index().sort_values("soles_totales", ascending=False)

        invoice_cols = [c for c in ["NRO_DOC", "TPO_DOC", "SERIE_DOC", "FECHA_DT", "NOM_CLIENTE", "CANTIDAD", "PRECIO_UNID", "SOLES"] if c in df_sku.columns]
        invoices = df_sku[invoice_cols].sort_values("FECHA_DT", ascending=False)

        return {
            "sku": sku,
            "ref_date": ref_date.strftime("%Y-%m-%d"),
            "resumen_temporal": {
                "venta_mes_actual": v_mes_curr,
                "venta_mes_anterior_yoy": v_mes_prev,
                "variacion_mes_pct": round(var_mes, 2),
                "venta_ytd_actual": v_ytd_curr,
                "venta_ytd_anterior_yoy": v_ytd_prev,
                "variacion_ytd_pct": round(var_ytd, 2),
            },
            "clientes": clientes_analytics,
            "facturas": invoices
        }

    def get_ndb_por_sku(self, sku: str) -> pd.DataFrame:
        """
        Retorna las Notas de Débito (NDB) asociadas a un SKU específico.

        Las NDB representan aumentos en el valor que el cliente debe:
        - Ajustes de precio
        - Penalidades
        - Recargos por flete
        - Diferencias de precio posteriores a la factura

        Returns:
            pd.DataFrame: NDB del SKU con columnas: NRO_DOC, FECHA_DT,
                          NOM_CLIENTE, CANTIDAD, SOLES, PRECIO_UNID, y
                          resumen por cliente.
        """
        if "ES_NDB" not in self.df.columns:
            return pd.DataFrame()

        df_sku = self.df[self.df["ID_ARTICULO"] == sku]
        if df_sku.empty:
            return pd.DataFrame()

        df_ndb = df_sku[df_sku["ES_NDB"] == True]
        if df_ndb.empty:
            return pd.DataFrame()

        ndb_cols = [c for c in ["NRO_DOC", "TPO_DOC", "SERIE_DOC", "FECHA_DT",
                                "ID_CLIENTE", "NOM_CLIENTE", "ID_VENDEDOR", "NOM_VENDEDOR",
                                "CANTIDAD", "PRECIO_UNID", "SOLES"] if c in df_ndb.columns]
        return df_ndb[ndb_cols].sort_values("FECHA_DT", ascending=False)
