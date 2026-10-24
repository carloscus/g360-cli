"""Tests del contrato de datos de g360_core.

Son las funciones que varios repos importan: si cambian, el contrato cambia.
Por eso cada caso tiene un test explicito aca.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from g360_core.common import (
    build_header_aliases,
    deaccent,
    match_keyword,
    normalizar_header,
    safe_float,
    safe_int,
)
from g360_core.field_keywords import DEFAULT_FIELD_KEYWORDS, load_field_keywords
from g360_core.normalizer import normalizar_valor

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


class TestNormalizarHeader:
    def test_quita_tildes_y_puntuacion(self):
        assert normalizar_header("Código de Barras") == "CODIGO DE BARRAS"
        assert normalizar_header("P. Lista") == "P LISTA"
        assert normalizar_header("N°") == "N"

    def test_colapsa_espacios_y_sube_mayusculas(self):
        assert normalizar_header("  precio   de  lista ") == "PRECIO DE LISTA"

    def test_tolera_none(self):
        assert normalizar_header(None) == ""


class TestDeaccent:
    def test_quita_marcas(self):
        assert deaccent("Añadir Ítem") == "Anadir Item"

    def test_vacio(self):
        assert deaccent("") == ""


class TestMatchKeyword:
    def test_exacto(self):
        assert match_keyword("CÓDIGO", "CÓDIGO") is True

    def test_prefijo(self):
        assert match_keyword("CÓDIGO", "CÓD") is True
        assert match_keyword("CATEGORIA", "CAT") is True

    def test_no_hay_falso_positivo(self):
        assert match_keyword("DESCONOCIDO", "COD") is False

    def test_vacios(self):
        assert match_keyword("", "COD") is False
        assert match_keyword("COD", "") is False


class TestSafeFloat:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("12.5", 12.5),
            ("12,5", 12.5),
            ("1,234.56", 1234.56),
            ("1.234,56", 1234.56),
            ("25%", 25.0),
            ("(10.5)", -10.5),
            (7, 7.0),
            (7.5, 7.5),
        ],
    )
    def test_convierte(self, raw, expected):
        assert safe_float(raw) == pytest.approx(expected)

    @pytest.mark.parametrize("raw", ["", "   ", "abc", None, True])
    def test_invalidos(self, raw):
        assert safe_float(raw) is None


class TestSafeInt:
    def test_redondea(self):
        assert safe_int("10.6") == 11

    def test_invalido(self):
        assert safe_int("abc") is None


class TestNormalizarValor:
    def test_descuento_porcentaje_a_fraccion(self):
        assert normalizar_valor("desc1", "25") == pytest.approx(0.25)
        assert normalizar_valor("desc2", "4") == pytest.approx(0.04)

    def test_descuento_ya_en_fraccion(self):
        assert normalizar_valor("desc1", "0.25") == pytest.approx(0.25)

    def test_precio(self):
        assert normalizar_valor("list_price", "1,234.56") == pytest.approx(1234.56)

    def test_texto(self):
        assert normalizar_valor("sku", "  ABC-1 ") == "ABC-1"

    def test_entero(self):
        assert normalizar_valor("stock", "12") == 12

    def test_vacios(self):
        assert normalizar_valor("sku", None) == ""
        assert normalizar_valor("stock", None) == 0
        assert normalizar_valor("list_price", None) == 0.0


class TestFieldKeywords:
    def test_defaults_cubren_los_campos_clave(self):
        for field in ("sku", "description", "list_price", "desc1", "stock"):
            assert field in DEFAULT_FIELD_KEYWORDS

    def test_proyecto_puede_sobreescribir(self, tmp_path):
        config = tmp_path / "config.json"
        config.write_text(
            json.dumps({"FIELD_KEYWORDS": {"sku": ["CODIGO PROPIO"]}}), encoding="utf-8"
        )

        keywords = load_field_keywords(config)

        assert keywords == {"sku": ["CODIGO PROPIO"]}

    def test_sin_config_devuelve_defaults(self, tmp_path):
        assert load_field_keywords(tmp_path / "no-existe.json") == DEFAULT_FIELD_KEYWORDS


class TestHeaderAliases:
    def test_el_primer_campo_que_reclama_gana(self):
        aliases = build_header_aliases({"sku": ["COD"], "other": ["COD"]})

        assert aliases["COD"] == "sku"

    def test_normaliza_los_alias(self):
        aliases = build_header_aliases({"sku": ["Cód. de Barra"]})

        assert aliases["COD DE BARRA"] == "sku"


class TestSincroniaDelAsset:
    def test_el_asset_de_ingestion_es_una_copia_del_paquete(self):
        asset = REPO_ROOT / "src" / "assets" / "ingestion" / "core" / "ingestion.py"
        package = REPO_ROOT / "py" / "src" / "g360_core" / "ingestion.py"

        if not asset.exists():  # el paquete se puede instalar sin los assets del CLI
            pytest.skip("asset de ingestion no presente en esta instalacion")

        assert asset.read_text(encoding="utf-8") == package.read_text(encoding="utf-8")
