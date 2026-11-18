"""Profiles de Hypothesis para g360-cli.

Registra dos niveles de esfuerzo y carga el perfil ``full`` por defecto
(mantiene la cobertura del release v1.22.2: hasta 200 ejemplos). Se puede
forzar el perfil rápido ``ci`` con la variable de entorno
``G360_HYPOTHESIS_PROFILE=ci``.
"""
from __future__ import annotations

import os
from hypothesis import settings

settings.register_profile("ci", max_examples=20, deadline=None)
settings.register_profile("full", max_examples=200, deadline=None)

_profile = os.environ.get("G360_HYPOTHESIS_PROFILE", "full")
settings.load_profile(_profile)
