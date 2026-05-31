@echo off
chcp 65001 >nul
title G360 - Build Portable EXE

echo.
echo ==============================================
echo   G360 Flet Migrated - Build Portable EXE
echo   Genera un .exe standalone (sin Python)
echo ==============================================
echo.

:: --- 1. Verificar/instalar uv ---
where uv >nul 2>&1
if errorlevel 1 (
    echo [SETUP] uv no encontrado. Instalando...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    if errorlevel 1 (
        echo ERROR: No se pudo instalar uv.
        pause
        exit /b 1
    )
    for /f "tokens=*" %%a in ('uv --version') do set "UV_OK=%%a"
)
echo [CHECK] uv: OK

:: --- 2. Crear .venv si no existe ---
if not exist ".venv" (
    echo [SETUP] Creando entorno virtual...
    uv venv
)
echo [VENV] .venv: OK

:: --- 3. Sincronizar dependencias ---
echo [SETUP] Sincronizando dependencias...
uv sync

:: --- 4. Verificar archivo principal ---
if not exist "src\main.py" (
    echo ERROR: src\main.py no encontrado
    pause
    exit /b 1
)

:: --- 5. Leer nombre del ejecutable desde skill.json ---
set "APP_NAME=G360-App"
if exist "skill.json" (
    for /f "tokens=2 delims=:,}" %%a in ('findstr /i "build_name" skill.json') do set "APP_NAME=%%~a"
)
if exist "src\core\skill.json" (
    for /f "tokens=2 delims=:,}" %%a in ('findstr /i "build_name" src\core\skill.json') do set "APP_NAME=%%~a"
)
set "APP_NAME=%APP_NAME:"=%"
set "APP_NAME=%APP_NAME: =%"
if "%APP_NAME%"=="" set "APP_NAME=G360-App"

:: --- 6. Build con PyInstaller ---
echo.
echo [BUILD] Generando ejecutable portable: %APP_NAME%.exe
echo.

uv run pyinstaller --onefile --windowed ^
    --name "%APP_NAME%" ^
    --add-data "src/core;core" ^
    --add-data "src/ui;ui" ^
    --add-data "src/export;export" ^
    --add-data "assets;assets" ^
    --add-data "skill.json;." ^
    --add-data ".python-version;." ^
    --icon "assets\images\app.ico" ^
    --distpath "dist" ^
    --workpath "build\pyinstaller" ^
    --specpath "build" ^
    --noconfirm ^
    src/main.py

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la generacion del ejecutable.
    pause
    exit /b 1
)

:: --- 7. Limpiar temporales ---
if exist "build" (
    echo [CLEAN] Limpiando archivos temporales...
    rmdir /s /q build
)

echo.
echo ==============================================
echo   BUILD EXITOSO
echo   Ejecutable: dist\%APP_NAME%.exe
echo   Tamano aproximado: ~50-80 MB
echo ==============================================
echo.

pause
