@echo off
chcp 65001 >nul
title G360 - CustomTkinter App

echo.
echo ==============================================
echo   G360 CustomTkinter Application
echo ==============================================
echo.

where uv >nul 2>&1
if errorlevel 1 (
    echo [SETUP] uv no encontrado
    echo.
    echo Por favor instala uv desde:
    echo https://github.com/astral-sh/uv
    echo.
    pause
    exit /b 1
)

echo [CHECK] uv: OK

if not exist ".venv" (
    echo [SETUP] Creando entorno virtual...
    uv venv
)

echo [SETUP] Sincronizando dependencias...
uv sync

echo.
echo [RUN] Ejecutando aplicacion...
uv run python src/main.py

pause