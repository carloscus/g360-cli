"""Property-based tests for g360_core.commercial_engine using hypothesis."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, settings, strategies as st

from g360_core.commercial_engine import (
    CAT_AJUSTE, CAT_DEVOLUCION, CAT_VENTA,
    build_invoice_index, calculate_prices, classify_base,
    parse_referencia, resolve_document_relationships,
)

REFERENCE_STRATEGY = st.tuples(
    st.text(min_size=1, max_size=5, alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),
    st.integers(min_value=100, max_value=999),
    st.integers(min_value=10000, max_value=999999),
).map(lambda t: (t[0], str(t[1]), str(t[2])))

NULLABLE_TEXT = st.one_of(st.none(), st.text(min_size=0, max_size=200))
FLOAT_COL = st.floats(allow_nan=False, allow_infinity=False, min_value=-100000, max_value=100000)


class TestParseReferencia:
    @settings(deadline=None)
    @given(REFERENCE_STRATEGY)
    def test_reconstruye_referencia(self, ref_tuple):
        ref_tipo, ref_serie, ref_numero = ref_tuple
        df = pd.DataFrame([{"REFERENCIA": f"{ref_tipo}/{ref_serie}-{ref_numero}"}])
        result = parse_referencia(df.copy())
        assert result.loc[0, "REF_TIPO"] == ref_tipo
        assert result.loc[0, "REF_SERIE"] == ref_serie
        assert result.loc[0, "REF_NUMERO"] == ref_numero

    @settings(deadline=None)
    @given(NULLABLE_TEXT)
    def test_no_match_devuelve_sr(self, basura):
        df = pd.DataFrame([{"REFERENCIA": basura}])
        result = parse_referencia(df.copy())
        assert result.loc[0, "REF_TIPO"] == "S/R"
        assert result.loc[0, "REF_SERIE"] == "S/R"
        assert result.loc[0, "REF_NUMERO"] == "S/R"

    @settings(deadline=None)
    @given(REFERENCE_STRATEGY)
    def test_case_insensitive(self, ref_tuple):
        ref_tipo, ref_serie, ref_numero = ref_tuple
        raw = f"{ref_tipo}/{ref_serie}-{ref_numero}".lower()
        df = pd.DataFrame([{"REFERENCIA": raw}])
        result = parse_referencia(df.copy())
        assert result.loc[0, "REF_TIPO"] == ref_tipo.upper()
        assert result.loc[0, "REF_SERIE"] == ref_serie.upper()
        assert result.loc[0, "REF_NUMERO"] == ref_numero.upper()

    def test_vacia(self):
        df = pd.DataFrame([{"REFERENCIA": ""}])
        result = parse_referencia(df.copy())
        assert (result["REF_TIPO"] == "S/R").all()
        assert (result["REF_SERIE"] == "S/R").all()
        assert (result["REF_NUMERO"] == "S/R").all()

    def test_none(self):
        df = pd.DataFrame([{"REFERENCIA": None}])
        result = parse_referencia(df.copy())
        assert (result["REF_TIPO"] == "S/R").all()
        assert (result["REF_SERIE"] == "S/R").all()
        assert (result["REF_NUMERO"] == "S/R").all()


class TestClassifyBase:
    @settings(deadline=None)
    @given(st.lists(st.tuples(st.sampled_from(["F01","BDI","F03","B01","NC07","NCR","ND01"]), FLOAT_COL), min_size=1, max_size=50))
    def test_toda_fila_tiene_categoria_unica(self, rows):
        df = pd.DataFrame(rows, columns=["TPO_DOC", "CANTIDAD"])
        result = classify_base(df.copy())
        cats = set(result["CATEGORIA_OP"].unique())
        assert cats.issubset({CAT_VENTA, CAT_DEVOLUCION, CAT_AJUSTE})
        assert result["CATEGORIA_OP"].notna().all()

    @settings(deadline=None)
    @given(st.lists(st.tuples(st.just("NC07"), st.just(0.0)), min_size=1, max_size=20))
    def test_nc_con_cantidad_cero_es_ajuste(self, rows):
        df = pd.DataFrame(rows, columns=["TPO_DOC", "CANTIDAD"])
        result = classify_base(df.copy())
        assert all(result["CATEGORIA_OP"] == CAT_AJUSTE)

    @settings(deadline=None)
    @given(st.lists(st.tuples(st.just("F01"), FLOAT_COL), min_size=1, max_size=10))
    def test_facturas_siempre_venta(self, rows):
        df = pd.DataFrame(rows, columns=["TPO_DOC", "CANTIDAD"])
        result = classify_base(df.copy())
        assert all(result["CATEGORIA_OP"] == CAT_VENTA)

    def test_sin_columna_tpo_doc_asigna_venta_por_defecto(self):
        df = pd.DataFrame({"CANTIDAD": [1, 2, 3]})
        result = classify_base(df.copy())
        assert all(result["CATEGORIA_OP"] == CAT_VENTA)


class TestCalculatePrices:
    @settings(deadline=None)
    @given(st.lists(st.tuples(FLOAT_COL.map(lambda x: max(x,0)), FLOAT_COL.map(lambda x: max(x,0.01))), min_size=1, max_size=50))
    def test_precios_no_negativos(self, rows):
        df = pd.DataFrame(rows, columns=["SOLES", "CANTIDAD"])
        df["CANTIDAD FAE"] = 0
        result = calculate_prices(df.copy())
        mask = (result["SOLES"] > 0) & (result["CANTIDAD"] > 0)
        if mask.any():
            assert (result.loc[mask, "PRECIO_BASE"] >= 0).all()

    @settings(deadline=None)
    @given(st.lists(st.tuples(FLOAT_COL.map(lambda x: max(x,0)), FLOAT_COL.map(lambda x: max(x,0.01))), min_size=1, max_size=50))
    def test_precio_base_cercano(self, rows):
        df = pd.DataFrame(rows, columns=["SOLES", "CANTIDAD"])
        df["CANTIDAD FAE"] = 0
        result = calculate_prices(df.copy())
        mask = result["SOLES"] > 0
        if mask.any():
            esperado = result.loc[mask, "SOLES"] / result.loc[mask, "CANTIDAD"]
            real = result.loc[mask, "PRECIO_BASE"]
            diff = (real - esperado).abs()
            assert (diff <= 0.0001).all(), "max diff: " + str(diff.max())

    @settings(deadline=None)
    @given(st.lists(st.tuples(FLOAT_COL.map(lambda x: max(x,0.01)), FLOAT_COL.map(lambda x: max(x,0.01))), min_size=1, max_size=20))
    def test_sin_socales_retorna_nan(self, rows):
        df = pd.DataFrame(rows, columns=["CANTIDAD", "OTRO_CAMPO"])
        result = calculate_prices(df.copy())
        assert result["PRECIO_BASE"].isna().all()


class TestBuildInvoiceIndex:
    @settings(deadline=None)
    @given(st.lists(st.tuples(st.just("F01"), st.integers(100,999), st.integers(10000,999999), FLOAT_COL.map(lambda x:max(x,1)), FLOAT_COL.map(lambda x:max(x,1))), min_size=1, max_size=30))
    def test_indice_contiene_keys_validas(self, rows):
        df = pd.DataFrame(rows, columns=["TPO_DOC","SERIE_DOC","NRO_DOC","CANTIDAD","SOLES"])
        df["ID_ARTICULO"] = "SKU001"; df["CATEGORIA_OP"] = CAT_VENTA
        idx = build_invoice_index(df)
        assert isinstance(idx, dict)
        for key, val in idx.items():
            tipo, serie, nro, sku = key
            assert isinstance(tipo, str) and isinstance(serie, str)
            assert isinstance(nro, str) and isinstance(val, dict)
            assert "CANTIDAD" in val and "SOLES" in val

    def test_indice_vacio_sin_facturas(self):
        df = pd.DataFrame([{"CATEGORIA_OP": CAT_AJUSTE}])
        assert build_invoice_index(df) == {}
