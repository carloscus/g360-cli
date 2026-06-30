"""Segmentation and comparison methods for InsightProcessor — extracted from processor.py."""

import pandas as pd
import numpy as np

from .logger import get_logger

log = get_logger("processor_seg")


class ProcessorSegmentacion:
    """Mixin class with all segmentation, grouping, and comparison methods."""


    def get_resumen_por_vendedor(self) -> pd.DataFrame:
        """
        Genera resumen agregado por vendedor con KPIs completos.

        Agrupa solo por ID_VENDEDOR. El nombre se toma del valor
        mas frecuente para evitar duplicados por variaciones de nombre.
        """
        cache_key = self._cache_key("vendedor")
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached.copy()

        vendedor_col = next((c for c in self.df.columns if "ID_VENDEDOR" in c), None)
        nom_col = next((c for c in self.df.columns if "NOM_VENDEDOR" in c), None)

        if not vendedor_col:
            return pd.DataFrame()

        df_filtrado = self.df.dropna(subset=[vendedor_col])
        df_filtrado = df_filtrado[df_filtrado[vendedor_col].astype(str).str.strip() != ""]

        # Groupby solo por ID, nombre mas frecuente
        resumen = df_filtrado.groupby(vendedor_col).agg(
            venta_bruta=("VENTA_BRUTA", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            monto_nc=("MONTO_NC", "sum"),
            n_documentos=("SOLES", "count"),
            n_clientes=("ID_CLIENTE", "nunique"),
        ).reset_index()

        if nom_col:
            nombre_frecuente = df_filtrado.groupby(vendedor_col)[nom_col].agg(
                lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0]
            )
            resumen[nom_col] = resumen[vendedor_col].map(nombre_frecuente)

        resumen["tasa_devolucion"] = (
            resumen["monto_nc"] / resumen["venta_bruta"].replace(0, np.nan) * 100
        ).fillna(0)

        resumen["alerta_devolucion"] = resumen["tasa_devolucion"] > self.devolucion_threshold

        resultado = resumen.sort_values("venta_neta", ascending=False)
        self._set_cached(cache_key, resultado)
        return resultado

    def get_resumen_por_linea(self) -> pd.DataFrame:
        """
        Genera resumen agregado por linea de producto con escala visual.

        Agrupa por ID_LINEA. El nombre se toma del valor mas frecuente.
        """
        cache_key = self._cache_key("linea")
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached.copy()

        id_col = next((c for c in self.df.columns if "ID_LINEA" in c), None)
        nom_col = next((c for c in self.df.columns if "NOM_LINEA" in c), None)

        if not nom_col:
            return pd.DataFrame()

        group_col = id_col if id_col else nom_col

        resumen = self.df.groupby(group_col).agg(
            total_soles=("SOLES", "sum"),
            venta_bruta=("VENTA_BRUTA", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            cantidad=("CANTIDAD", "sum"),
            n_items=(group_col, "count"),
        ).reset_index()

        if id_col and nom_col and id_col != nom_col:
            nombre_frecuente = self.df.groupby(id_col)[nom_col].agg(
                lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0]
            )
            resumen[nom_col] = resumen[id_col].map(nombre_frecuente)
            resumen = resumen.rename(columns={id_col: "ID_LINEA"})

        # Escala visual con raiz cubica para balancear diferencias grandes
        max_val = resumen["total_soles"].abs().max()
        if max_val > 0:
            resumen["escala_visual"] = (
                resumen["total_soles"].abs() ** (1 / 3)
            ) / (max_val ** (1 / 3))
        else:
            resumen["escala_visual"] = 0

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0
        resumen["es_negativo"] = resumen["total_soles"] < 0

        resultado = resumen.sort_values("total_soles", ascending=False)
        self._set_cached(cache_key, resultado)
        return resultado

    def get_resumen_por_canal(self) -> pd.DataFrame:
        """
        Genera resumen por canal de distribucion (MAYORISTA, MINORISTA, SIN ASIGNAR).

        Util para identificar que canal genera mas volumen de ventas y
        detectar oportunidades de crecimiento en canales sub-atendidos.

        Returns:
            pd.DataFrame: Resumen por canal con total_soles, venta_bruta,
                          venta_neta, n_clientes, n_documentos, porcentaje.
        """
        canal_col = next((c for c in self.df.columns if "CANAL" in c), None)
        if not canal_col:
            return pd.DataFrame()

        resumen = self.df.groupby(canal_col).agg(
            total_soles=("SOLES", "sum"),
            venta_bruta=("VENTA_BRUTA", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_clientes=("ID_CLIENTE", "nunique"),
            n_documentos=("NRO_DOC", "nunique") if "NRO_DOC" in self.df.columns else ("SOLES", "count"),
        ).reset_index()

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_por_departamento(self) -> pd.DataFrame:
        """
        Genera resumen geografico por departamento (LA LIBERTAD, ANCASH, etc.).

        Util para analisis de cobertura territorial y deteccion de
        zonas con bajo rendimiento o sin atencion comercial.

        Returns:
            pd.DataFrame: Resumen por departamento con total_soles,
                          venta_neta, n_clientes, n_vendedores, porcentaje.
        """
        depto_col = next((c for c in self.df.columns if "DEPARTAMENTO" in c), None)
        if not depto_col:
            return pd.DataFrame()

        resumen = self.df.groupby(depto_col).agg(
            total_soles=("SOLES", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_clientes=("ID_CLIENTE", "nunique"),
            n_vendedores=("ID_VENDEDOR", "nunique"),
        ).reset_index()

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_por_distrito(self) -> pd.DataFrame:
        """
        Genera resumen por distrito para analisis de calor comercial.

        Permite identificar distritos con mayor concentracion de ventas
        y detectar "silencios comerciales" (zonas sin actividad).

        Returns:
            pd.DataFrame: Resumen por distrito con total_soles,
                          venta_neta, n_clientes, porcentaje.
        """
        distrito_col = next((c for c in self.df.columns if "DISTRITO" in c), None)
        if not distrito_col:
            return pd.DataFrame()

        resumen = self.df.groupby(distrito_col).agg(
            total_soles=("SOLES", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_clientes=("ID_CLIENTE", "nunique"),
        ).reset_index()

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_por_sucursal(self) -> pd.DataFrame:
        """
        Genera resumen por sucursal para matriz de rendimiento.

        Filtra automaticamente las filas sin sucursal registrada
        (valores vacios o "ACUMULADO") para evitar distorsion en el analisis.

        Util para:
        - Identificar sucursales con mejor/peor rendimiento
        - Detectar sucursales que negocian precios mas bajos
        - Analisis de cobertura por punto de venta

        Returns:
            pd.DataFrame: Resumen por sucursal con total_soles, venta_neta,
                          n_clientes, n_documentos, porcentaje.
        """
        sucursal_col = next((c for c in self.df.columns if "NOM_SUCURSAL" in c), None)
        if not sucursal_col:
            return pd.DataFrame()

        resumen = self.df.groupby(sucursal_col).agg(
            total_soles=("SOLES", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_clientes=("ID_CLIENTE", "nunique"),
            n_documentos=("NRO_DOC", "nunique") if "NRO_DOC" in self.df.columns else ("SOLES", "count"),
        ).reset_index()

        # Filtrar filas sin sucursal registrada (vacias o "ACUMULADO")
        resumen = resumen[resumen[sucursal_col].astype(str).str.strip() != ""]
        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_por_cliente(self) -> pd.DataFrame:
        """
        Genera resumen por cliente con analisis de cartera.

        Agrupa solo por ID_CLIENTE. El nombre se toma del valor mas frecuente.
        """
        cache_key = self._cache_key("cliente")
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached.copy()

        cliente_col = next((c for c in self.df.columns if "ID_CLIENTE" in c), None)
        nom_cliente = next((c for c in self.df.columns if "NOM_CLIENTE" in c), None)

        if not cliente_col:
            return pd.DataFrame()

        df_filtrado = self.df.dropna(subset=[cliente_col])
        df_filtrado = df_filtrado[df_filtrado[cliente_col].astype(str).str.strip() != ""]

        resumen = df_filtrado.groupby(cliente_col).agg(
            total_compras=("SOLES", "sum"),
            venta_bruta=("VENTA_BRUTA", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            n_compras=("NRO_DOC", "nunique") if "NRO_DOC" in df_filtrado.columns else ("SOLES", "count"),
        ).reset_index()

        if nom_cliente:
            nombre_frecuente = df_filtrado.groupby(cliente_col)[nom_cliente].agg(
                lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0]
            )
            resumen[nom_cliente] = resumen[cliente_col].map(nombre_frecuente)

        # Calcular dias sin comprar para deteccion de clientes dormidos
        if "FECHA_DT" in df_filtrado.columns:
            fecha_max = df_filtrado["FECHA_DT"].max()
            ultima_compra = df_filtrado.groupby(cliente_col)["FECHA_DT"].max()
            resumen["ultima_compra"] = resumen[cliente_col].map(ultima_compra)
            resumen["ultima_compra_dt"] = pd.to_datetime(resumen["ultima_compra"], errors="coerce")
            resumen["dias_sin_comprar"] = (fecha_max - resumen["ultima_compra_dt"]).dt.days
            resumen["es_dormido"] = resumen["dias_sin_comprar"] > 30

        resultado = resumen.sort_values("total_compras", ascending=False)
        self._set_cached(cache_key, resultado)
        return resultado

    def get_clientes_dormidos(self) -> pd.DataFrame:
        """
        Retorna solo los clientes clasificados como "dormidos".

        Un cliente dormido es aquel que no ha realizado compras en los
        ultimos 30 dias del periodo analizado. Estos clientes representan
        oportunidades de reactivacion para el equipo comercial.

        Returns:
            pd.DataFrame: Clientes dormidos con sus datos de resumen.
                          DataFrame vacio si no hay clientes dormidos.
        """
        resumen = self.get_resumen_por_cliente()
        if resumen.empty or "es_dormido" not in resumen.columns:
            return pd.DataFrame()
        return resumen[resumen["es_dormido"]]

    def get_hhi_por_vendedor(self) -> pd.DataFrame:
        """
        Calcula el indice HHI (Herfindahl-Hirschman) por vendedor.

        El HHI mide la concentracion de la cartera de clientes de un vendedor.
        Se calcula como la suma de los cuadrados de las participaciones de
        cada cliente en las ventas totales del vendedor.

        Interpretacion del HHI:
            HHI > 0.50: Concentracion ALTA - riesgo de perder gran volumen
                        si un cliente clave se va
            HHI 0.25-0.50: Concentracion MEDIA - cartera razonablemente
                           diversificada pero con algunos clientes dominantes
            HHI < 0.25: Concentracion BAJA - cartera bien diversificada,
                        riesgo distribuido entre muchos clientes

        Ejemplo:
            Vendedor con 2 clientes: Cliente A = 90%, Cliente B = 10%
            HHI = 0.9^2 + 0.1^2 = 0.81 + 0.01 = 0.82 -> ALTA concentracion

            Vendedor con 10 clientes iguales: cada uno = 10%
            HHI = 10 * 0.1^2 = 0.10 -> BAJA concentracion

        Returns:
            pd.DataFrame: HHI por vendedor con columns: ID_VENDEDOR, HHI,
                          n_clientes, total_ventas, concentracion.
        """
        vendedor_col = next((c for c in self.df.columns if "ID_VENDEDOR" in c), None)
        cliente_col = next((c for c in self.df.columns if "ID_CLIENTE" in c), None)

        if not vendedor_col or not cliente_col:
            return pd.DataFrame()

        ventas_por_vendedor_cliente = self.df.groupby([vendedor_col, cliente_col])["SOLES"].sum().reset_index()

        hhi_results = []
        for vendedor_id, group in ventas_por_vendedor_cliente.groupby(vendedor_col):
            total = group["SOLES"].sum()
            if total > 0:
                shares = (group["SOLES"] / total) ** 2
                hhi = shares.sum()
                hhi_results.append({
                    vendedor_col: vendedor_id,
                    "HHI": hhi,
                    "n_clientes": len(group),
                    "total_ventas": total,
                    "concentracion": "ALTA" if hhi > 0.5 else ("MEDIA" if hhi > 0.25 else "BAJA"),
                })

        return pd.DataFrame(hhi_results).sort_values("HHI", ascending=False)

    def get_anomalias_vendedores(self) -> pd.DataFrame:
        """Detect anomalous vendors using IsolationForest."""
        from src.core.anomaly_detector import AnomalyDetector
        return AnomalyDetector().detect_vendors(self.df)

    def get_anomalias_clientes(self) -> pd.DataFrame:
        """Detect anomalous clients using IsolationForest."""
        from src.core.anomaly_detector import AnomalyDetector
        return AnomalyDetector().detect_clients(self.df)

    def get_resumen_por_grupo(self) -> pd.DataFrame:
        """
        Genera resumen por grupo de producto (subcategoria de linea).

        La jerarquia de productos es: Linea -> Grupo -> Tipo -> Familia.
        Este metodo agrega a nivel de Grupo para analisis intermedio
        entre linea y articulo individual.

        Returns:
            pd.DataFrame: Resumen por grupo con total_soles, cantidad,
                          n_items, porcentaje.
        """
        grupo_col = next((c for c in self.df.columns if "NOM_GRUPO" in c), None)
        if not grupo_col:
            return pd.DataFrame()

        resumen = self.df.groupby(grupo_col).agg(
            total_soles=("SOLES", "sum"),
            cantidad=("CANTIDAD", "sum"),
            n_items=(grupo_col, "count"),
        ).reset_index()

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_por_estado_linea(self) -> pd.DataFrame:
        """
        Compara el rendimiento de LINEA NUEVA vs LINEA TRADICIONAL.

        La columna ESTADO_LINEA clasifica cada linea de producto como:
        - "LINEA NUEVA": Productos recientemente incorporados al catalogo
        - "LINEA TRADICIONAL": Productos establecidos en el catalogo

        Este analisis es crucial para:
        - Medir la adopcion de nuevos productos en el mercado
        - Detectar si las lineas nuevas estan cannibalizando las tradicionales
        - Evaluar la estrategia de expansion de catalogo
        - Identificar oportunidades de cross-selling

        Returns:
            pd.DataFrame: Resumen por estado de linea con total_soles,
                          venta_neta, cantidad, n_clientes, n_articulos,
                          n_lineas, porcentaje.
        """
        estado_col = next((c for c in self.df.columns if "ESTADO_LINEA" in c), None)
        if not estado_col:
            return pd.DataFrame()

        resumen = self.df.groupby(estado_col).agg(
            total_soles=("SOLES", "sum"),
            venta_neta=("VENTA_NETA", "sum"),
            cantidad=("CANTIDAD", "sum"),
            n_clientes=("ID_CLIENTE", "nunique"),
            n_articulos=("ID_ARTICULO", "nunique"),
            n_lineas=("NOM_LINEA", "nunique"),
        ).reset_index()

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_linea_por_estado(self) -> pd.DataFrame:
        """
        Desglose de cada linea clasificada como nueva o tradicional.

        Combina NOM_LINEA con ESTADO_LINEA para mostrar exactamente
        que lineas son nuevas y cuales son tradicionales, con sus
        respectivos volumenes de venta.

        Util para identificar lineas especificas que necesitan
        estrategias de promocion o proteccion diferentes.

        Returns:
            pd.DataFrame: Resumen por linea y estado con total_soles,
                          cantidad, n_items, porcentaje.
        """
        estado_col = next((c for c in self.df.columns if "ESTADO_LINEA" in c), None)
        linea_col = next((c for c in self.df.columns if "NOM_LINEA" in c), None)

        if not estado_col or not linea_col:
            return pd.DataFrame()

        resumen = self.df.groupby([linea_col, estado_col]).agg(
            total_soles=("SOLES", "sum"),
            cantidad=("CANTIDAD", "sum"),
            n_items=(linea_col, "count"),
        ).reset_index()

        _total_sum = resumen["total_soles"].sum()
        resumen["porcentaje"] = resumen["total_soles"] / _total_sum if _total_sum != 0 else 0.0

        return resumen.sort_values("total_soles", ascending=False)

    def get_resumen_por_pedido(self) -> pd.DataFrame:
        """
        Genera resumen por ID_PEDIDO para trazabilidad completa.

        Un pedido (ID_PEDIDO) puede generar multiples facturas cuando:
        - El pedido excede el stock disponible y se despacha parcial
        - El cliente solicita facturas separadas por sucursal
        - Hay condiciones de pago diferentes dentro del mismo pedido

        La columna es_multiples_facturas indica si un pedido genero
        mas de una factura, lo cual es util para:
        - Medir eficiencia de despacho (pedidos parciales = ineficiencia)
        - Identificar clientes con logistica compleja
        - Tracking de cumplimiento de pedidos

        Returns:
            pd.DataFrame: Resumen por pedido con total_soles, cantidad,
                          n_facturas, n_skus, n_clientes, primer_documento,
                          es_multiples_facturas.
        """
        pedido_col = next((c for c in self.df.columns if "ID_PEDIDO" in c), None)
        if not pedido_col:
            return pd.DataFrame()

        # Filtrar filas con ID_PEDIDO valido (no vacio)
        df_pedidos = self.df[self.df[pedido_col].astype(str).str.strip() != ""]
        if df_pedidos.empty:
            return pd.DataFrame()

        resumen = df_pedidos.groupby(pedido_col).agg(
            total_soles=("SOLES", "sum"),
            cantidad=("CANTIDAD", "sum"),
            n_facturas=("NRO_DOC", "nunique") if "NRO_DOC" in self.df.columns else ("SOLES", "count"),
            n_skus=("ID_ARTICULO", "nunique"),
            n_clientes=("ID_CLIENTE", "nunique"),
            primer_documento=("FECHA_DT", "min") if "FECHA_DT" in self.df.columns else ("SOLES", "count"),
        ).reset_index()

        # Marcar pedidos que generaron multiples facturas
        resumen["es_multiples_facturas"] = resumen["n_facturas"] > 1

        return resumen.sort_values("total_soles", ascending=False)

    def get_facturas_por_pedido(self, pedido_id: str) -> pd.DataFrame:
        """
        Retorna todas las facturas asociadas a un ID_PEDIDO especifico.

        Util para drill-down desde el resumen de pedidos hacia el
        detalle de cada documento generado.

        Args:
            pedido_id: ID del pedido (ej: "CC09028").

        Returns:
            pd.DataFrame: Todas las filas del pedido solicitado.
        """
        pedido_col = next((c for c in self.df.columns if "ID_PEDIDO" in c), None)
        if not pedido_col:
            return pd.DataFrame()

        return self.df[self.df[pedido_col] == pedido_id].copy()

    def get_adopcion_lineas_nuevas_por_cliente(self) -> pd.DataFrame:
        """
        Mide la tasa de adopcion de lineas nuevas por parte de clientes tradicionales.

        Logica de clasificacion:
        - Cliente tradicional: Ha comprado al menos una vez en LINEA TRADICIONAL
        - Cliente con adopcion: Ha comprado en AMBAS categorias (tradicional + nueva)
        - Cliente solo tradicional: Solo compra lineas tradicionales (oportunidad)
        - Cliente solo nueva: Cliente nuevo que solo compra lineas nuevas

        La tasa de adopcion se calcula como:
            (Clientes con AMBAS / Clientes tradicionales) * 100

        Una tasa baja indica que los clientes tradicionales no estan
        probando los nuevos productos, lo cual puede ser senal de:
        - Falta de comunicacion sobre nuevos productos
        - Resistencia al cambio
        - Canal de distribucion inadecuado para nuevas lineas

        Returns:
            pd.DataFrame: 6 filas con metricas de adopcion:
                - Clientes con lineas tradicionales
                - Clientes con lineas nuevas
                - Clientes con AMBAS (adopcion)
                - Solo tradicional (sin adopcion)
                - Solo nueva (cliente nuevo)
                - Tasa de adopcion (porcentaje)
        """
        estado_col = next((c for c in self.df.columns if "ESTADO_LINEA" in c), None)
        cliente_col = next((c for c in self.df.columns if "ID_CLIENTE" in c), None)

        if not estado_col or not cliente_col:
            return pd.DataFrame()

        # Identificar clientes que compraron en cada categoria
        clientes_tradicional = set(
            self.df[self.df[estado_col].astype(str).str.upper().str.contains("TRADICIONAL", na=False)][cliente_col].unique()
        )
        clientes_nueva = set(
            self.df[self.df[estado_col].astype(str).str.upper().str.contains("NUEVA", na=False)][cliente_col].unique()
        )

        # Calcular intersecciones y diferencias
        clientes_ambas = clientes_tradicional & clientes_nueva
        clientes_solo_tradicional = clientes_tradicional - clientes_nueva
        clientes_solo_nueva = clientes_nueva - clientes_tradicional

        return pd.DataFrame([{
            "metrica": "Clientes con lineas tradicionales",
            "valor": len(clientes_tradicional),
        }, {
            "metrica": "Clientes con lineas nuevas",
            "valor": len(clientes_nueva),
        }, {
            "metrica": "Clientes con AMBAS (adopcion)",
            "valor": len(clientes_ambas),
        }, {
            "metrica": "Solo tradicional (sin adopcion)",
            "valor": len(clientes_solo_tradicional),
        }, {
            "metrica": "Solo nueva (cliente nuevo)",
            "valor": len(clientes_solo_nueva),
        }, {
            "metrica": "Tasa de adopcion",
            "valor": round(len(clientes_ambas) / len(clientes_tradicional) * 100, 1) if clientes_tradicional else 0,
        }])

    def get_comparador_temporal(self, fecha_inicio_a, fecha_fin_a, fecha_inicio_b, fecha_fin_b, sku: str = None) -> dict:
        """
        Compara dos rangos de fechas y calcula variacion porcentual.

        Este metodo responde preguntas como:
        - "Que paso entre febrero y abril?"
        - "Crecieron las ventas este mes vs el anterior?"
        - "Perdimos o ganamos clientes en el periodo?"

        Para cada metrica (ventas, clientes, SKUs, documentos, lineas) calcula:
        - Valor en periodo A
        - Valor en periodo B
        - Variacion porcentual: ((B - A) / A) * 100

        Ademas calcula:
        - skus_nuevos: SKUs que aparecieron en B pero no en A
        - skus_perdidos: SKUs que estaban en A pero desaparecieron en B

        Args:
            fecha_inicio_a: Fecha inicio periodo A (ej: "2026-03-01")
            fecha_fin_a: Fecha fin periodo A (ej: "2026-03-31")
            fecha_inicio_b: Fecha inicio periodo B (ej: "2026-04-01")
            fecha_fin_b: Fecha fin periodo B (ej: "2026-04-30")
            sku: Opcional. ID del SKU para filtrar la comparacion.

        Returns:
            dict: Con claves para cada metrica conteniendo:
                - periodo_a: Valor en periodo A
                - periodo_b: Valor en periodo B
                - variacion_pct: Cambio porcentual
                - skus_nuevos: SKUs nuevos en periodo B
                - skus_perdidos: SKUs perdidos en periodo B
        """
        if "FECHA_DT" not in self.df.columns:
            return {}

        df = self.df.dropna(subset=["FECHA_DT"])
        if sku:
            df = df[df["ID_ARTICULO"] == sku]

        # Crear mascaras para cada periodo
        mask_a = (df["FECHA_DT"] >= pd.to_datetime(fecha_inicio_a)) & (df["FECHA_DT"] <= pd.to_datetime(fecha_fin_a))
        mask_b = (df["FECHA_DT"] >= pd.to_datetime(fecha_inicio_b)) & (df["FECHA_DT"] <= pd.to_datetime(fecha_fin_b))

        df_a = df[mask_a]
        df_b = df[mask_b]

        # Funcion interna para calcular estadisticas de un subconjunto
        def calc_stats(d):
            return {
                "ventas": d["SOLES"].sum() if not d.empty else 0,
                "clientes": d["ID_CLIENTE"].nunique() if "ID_CLIENTE" in d.columns and not d.empty else 0,
                "skus": d["ID_ARTICULO"].nunique() if "ID_ARTICULO" in d.columns and not d.empty else 0,
                "documentos": d["NRO_DOC"].nunique() if "NRO_DOC" in d.columns and not d.empty else 0,
                "lineas": d["NOM_LINEA"].nunique() if "NOM_LINEA" in d.columns and not d.empty else 0,
            }

        stats_a = calc_stats(df_a)
        stats_b = calc_stats(df_b)

        # Calcular variacion porcentual para cada metrica
        comparacion = {}
        for key in stats_a:
            val_a = stats_a[key]
            val_b = stats_b[key]
            if val_a > 0:
                variacion = round((val_b - val_a) / val_a * 100, 1)
            elif val_b > 0:
                variacion = 100.0  # De 0 a algo = crecimiento del 100%
            else:
                variacion = 0.0  # Sin cambios
            comparacion[key] = {
                "periodo_a": val_a,
                "periodo_b": val_b,
                "variacion_pct": variacion,
            }

        # Calcular SKUs nuevos y perdidos entre periodos
        skus_a = set(df_a["ID_ARTICULO"].unique()) if "ID_ARTICULO" in df_a.columns else set()
        skus_b = set(df_b["ID_ARTICULO"].unique()) if "ID_ARTICULO" in df_b.columns else set()

        comparacion["skus_nuevos"] = len(skus_b - skus_a)
        comparacion["skus_perdidos"] = len(skus_a - skus_b)

        return comparacion

    def get_skus_no_comprados_por_cliente(self, cliente_id: str) -> pd.DataFrame:
        """
        Gap Analysis: Identifica SKUs del catalogo que el cliente NO compro.

        Este analisis responde: "Que SKUs de la linea Lapiceros no compra?"

        Logica:
        1. Obtener todos los SKUs vendidos en el dataset (catalogo efectivo)
        2. Obtener los SKUs que compro este cliente especifico
        3. Retornar la diferencia: SKUs del catalogo - SKUs del cliente

        Los resultados se ordenan por n_clientes descendente, mostrando
        primero los SKUs que MAS clientes compran pero este cliente no.
        Estos son los de mayor potencial de venta.

        Util para:
        - Identificar oportunidades de cross-selling
        - Preparar propuestas comerciales personalizadas
        - Detectar gaps en la cartera de productos del cliente

        Args:
            cliente_id: ID del cliente (ej: "68414").

        Returns:
            pd.DataFrame: SKUs no comprados con columns: ID_ARTICULO,
                          nom_articulo, nom_linea, total_ventas, n_clientes,
                          comprado_por_cliente (siempre False).
        """
        cliente_col = next((c for c in self.df.columns if "ID_CLIENTE" in c), None)
        if not cliente_col:
            return pd.DataFrame()

        # Catalogo completo: todos los SKUs vendidos con sus agregaciones
        todos_skus = self.df.groupby("ID_ARTICULO").agg(
            nom_articulo=("NOM_ARTICULO", "first"),
            nom_linea=("NOM_LINEA", "first"),
            total_ventas=("SOLES", "sum"),
            n_clientes=("ID_CLIENTE", "nunique"),
        ).reset_index()

        # SKUs que este cliente ya compro
        skus_cliente = set(self.df[self.df[cliente_col] == cliente_id]["ID_ARTICULO"].unique())

        # Marcar cuales fueron comprados por el cliente
        todos_skus["comprado_por_cliente"] = todos_skus["ID_ARTICULO"].isin(skus_cliente)

        # Filtrar solo los NO comprados y ordenar por potencial (n_clientes)
        no_comprados = todos_skus[~todos_skus["comprado_por_cliente"]].sort_values("n_clientes", ascending=False)

        return no_comprados

    def get_clientes_con_sucursales(self) -> pd.DataFrame:
        """
        Identifica clientes con y sin sucursales registradas.

        Deteccion automatica:
        - Cuenta sucursales unicas por cliente (excluyendo vacios)
        - Marca clientes con n_sucursales > 0 como "tiene_sucursales"
        - Clientes sin sucursales tienen ventas directas (ACUMULADO)

        Esta informacion es crucial para:
        - Adaptar la UI: ocultar matriz de sucursales si no hay datos
        - Estrategia comercial: clientes con sucursales necesitan
          gestion de cuenta diferente (pricing por sucursal, etc.)
        - Analisis de cobertura: identificar clientes multi-punto

        Returns:
            pd.DataFrame: Clientes con columns: ID_CLIENTE, nom_cliente,
                          total_soles, n_sucursales, tiene_sucursales.
                          Ordenado por total_soles descendente.
        """
        cliente_col = next((c for c in self.df.columns if "ID_CLIENTE" in c), None)
        sucursal_col = next((c for c in self.df.columns if "NOM_SUCURSAL" in c), None)

        if not cliente_col:
            return pd.DataFrame()

        resumen = self.df.groupby(cliente_col).agg(
            nom_cliente=("NOM_CLIENTE", "first"),
            total_soles=("SOLES", "sum"),
        ).reset_index()

        if sucursal_col:
            # Contar sucursales unicas (excluyendo valores vacios)
            resumen["n_sucursales"] = self.df.groupby(cliente_col)[sucursal_col].apply(
                lambda x: x[x.astype(str).str.strip() != ""].nunique()
            ).values
            resumen["n_sucursales"] = resumen["n_sucursales"].fillna(0).astype(int)
            resumen["tiene_sucursales"] = resumen["n_sucursales"] > 0
        else:
            resumen["n_sucursales"] = 0
            resumen["tiene_sucursales"] = False

        return resumen.sort_values("total_soles", ascending=False)


    def filter_by(self, **kwargs) -> pd.DataFrame:
        """
        Filtrado generico por cualquier columna del dataset.

        Permite filtrar el dataset por multiples criterios simultaneamente.
        La busqueda es case-insensitive y busca coincidencia exacta.

        Ejemplos de uso:
            >>> proc.filter_by(ID_CLIENTE="68414")
            >>> proc.filter_by(ID_CLIENTE="68414", MES="04-ABRIL")
            >>> proc.filter_by(NOM_LINEA="ARCHIVO", TPO_DOC="F01")

        Args:
            **kwargs: Pares columna=valor para filtrar. Los nombres de
                      columna son case-insensitive.

        Returns:
            pd.DataFrame: Filas que cumplen TODOS los criterios especificados.
        """
        mask = pd.Series(True, index=self.df.index)
        for col, value in kwargs.items():
            col_upper = col.upper()
            matching_col = next((c for c in self.df.columns if c.upper() == col_upper), None)
            if matching_col:
                mask &= self.df[matching_col].astype(str).str.upper() == str(value).upper()
        return self.df.loc[mask]

    def filter_by_smart_query(self, query_str: str) -> pd.DataFrame:
        """
        Filtra el dataset usando una query inteligente que soporta:
        - Terminos de texto (para SKU, nombre de articulo, ID de cliente, nombre de cliente, vendedor)
        - Operadores de comparacion para cantidad y precio (ej. cant>10, precio<=5.5, soles>100)
        """
        if not query_str or query_str.strip() == "":
            return self.df.copy()

        query_str = query_str.strip()

        if len(query_str) > 200:
            query_str = query_str[:200]

        import re
        filtered_df = self.df
        
        # Expresiones regulares para operadores: cant>10, cantidad>=100, precio<=5.5, soles>200
        op_pattern = r"(cantidad|cant|precio_unit|precio|soles)\s*(>=|<=|>|<|=)\s*([0-9.-]+)"
        matches = re.findall(op_pattern, query_str, re.IGNORECASE)
        
        # Limpiar la query de los operadores para quedarnos con el texto libre
        clean_query = re.sub(op_pattern, "", query_str, flags=re.IGNORECASE).strip()
        
        # 1. Aplicar filtros de operadores
        for field, op, val_str in matches:
            try:
                val = float(val_str)
            except ValueError:
                log.debug("Valor no numerico ignorado en filtro: %s=%s", field, val_str)
                continue
            col_target = None
            field_lower = field.lower()
            
            if "cant" in field_lower:
                col_target = "CANTIDAD"
            elif "precio" in field_lower:
                col_target = "PRECIO_UNID"
            elif "soles" in field_lower:
                col_target = "SOLES"
                
            if col_target and col_target in filtered_df.columns:
                if op == ">":
                    filtered_df = filtered_df[filtered_df[col_target] > val]
                elif op == "<":
                    filtered_df = filtered_df[filtered_df[col_target] < val]
                elif op == ">=":
                    filtered_df = filtered_df[filtered_df[col_target] >= val]
                elif op == "<=":
                    filtered_df = filtered_df[filtered_df[col_target] <= val]
                elif op == "=":
                    filtered_df = filtered_df[filtered_df[col_target] == val]

        # 2. Aplicar filtro de texto libre
        if clean_query:
            tokens = clean_query.split()
            for token in tokens:
                token_upper = token.upper()
                masks = []
                
                search_cols = ["ID_ARTICULO", "NOM_ARTICULO", "ID_CLIENTE", "NOM_CLIENTE", "ID_VENDEDOR", "NOM_VENDEDOR", "NRO_DOC"]
                for col in search_cols:
                    if col in filtered_df.columns:
                        if col in ["ID_ARTICULO", "ID_CLIENTE", "ID_VENDEDOR", "NRO_DOC"]:
                            masks.append(filtered_df[col].astype(str).str.upper() == token_upper)
                        else:
                            masks.append(filtered_df[col].astype(str).str.upper().str.contains(token_upper, na=False))
                
                if masks:
                    combined_mask = masks[0]
                    for m in masks[1:]:
                        combined_mask |= m
                    filtered_df = filtered_df[combined_mask]
                    
        return filtered_df
