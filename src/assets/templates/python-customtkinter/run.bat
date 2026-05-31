@echo off
chcp 65001 >nul
title G360 - CustomTkinter App

echo.
echo ==============================================
echo   G360 - Running Application
echo ==============================================
echo.

:: --- 1. Verificar/instalar uv ---
where uv >nul 2>&1
if errorlevel 1 (
    echo [SETUP] uv no encontrado. Intentando instalar...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    if errorlevel 1 (
        echo.
        echo ERROR: No se pudo instalar uv automaticamente.
        echo.
        echo Opcion 1: Instalar Python manualmente desde:
        echo   https://www.python.org/downloads/
        echo.
        echo Opcion 2: Instalar uv manualmente:
        echo   powershell -ExecutionPolicy ByPass -c ^"irm https://astral.sh/uv/install.ps1 ^| iex^"
        echo.
        pause
        exit /b 1
    )
    :: Refrescar PATH
    for /f "tokens=*" %%a in ('uv --version') do set "UV_OK=%%a"
)
echo [CHECK] uv: OK

:: --- 2. Verificar Python via uv ---
echo [CHECK] Verificando Python...
uv python find >nul 2>&1
if errorlevel 1 (
    echo [SETUP] Python no encontrado. Instalando Python 3.12 con uv...
    uv python install 3.12
    if errorlevel 1 (
        echo ERROR: No se pudo instalar Python.
        pause
        exit /b 1
    )
) else (
    echo [CHECK] Python: OK
)

:: --- 3. Crear .venv desde .python-version ---
if not exist ".venv" (
    echo [SETUP] Creando entorno virtual...
    if exist ".python-version" (
        uv venv
    ) else (
        uv venv --python 3.12
    )
)
echo [VENV] .venv: OK

:: --- 4. Sincronizar dependencias (lee pyproject.toml o requirements.txt) ---
echo [SETUP] Sincronizando dependencias...
uv sync

:: --- 5. Verificar VC++ Redist (necesario para Flet en Windows) ---
echo [CHECK] Verificando Visual C++ Redistributable...
REG QUERY "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ATENCION] Visual C++ Redistributable no detectado.
    echo             Flet puede fallar sin el.
    echo.
    echo Descargalo desde:
    echo   https://aka.ms/vs/17/release/vc_redist.x64.exe
    echo.
    choice /C SN /M "Intentar descargar e instalar ahora? (S/N)"
    if errorlevel 2 goto :skip_vcredist
    powershell -Command "
        Write-Host 'Descargando VC++ Redist...';
        $url = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';
        $out = '$env:TEMP\vc_redist.x64.exe';
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
        Invoke-WebRequest -Uri $url -OutFile $out;
        Write-Host 'Instalando...';
        Start-Process -Wait -FilePath $out -ArgumentList '/install', '/quiet', '/norestart';
        Remove-Item $out;
        Write-Host 'Instalacion completada.';
    "
    if errorlevel 1 (
        echo [WARN] No se pudo instalar VC++ Redist. Continuando de todas formas...
    ) else (
        echo [OK] VC++ Redist instalado
    )
    :skip_vcredist
) else (
    echo [OK] VC++ Redist detectado
)

:: --- 6. Crear acceso directo en escritorio (primera ejecucion) ---
if not exist "%USERPROFILE%\Desktop\G360 App.lnk" (
    if exist "create_shortcut.vbs" (
        echo [SETUP] Creando acceso directo en el escritorio...
        cscript //nologo create_shortcut.vbs
    )
)

:: --- 7. Ejecutar la app ---
echo.
echo ==============================================
echo   Iniciando G360 Desktop App...
echo ==============================================
echo.

uv run python src/main.py

if errorlevel 1 (
    echo.
    echo ERROR: La aplicacion cerró con error.
    echo.
    echo Posibles causas:
    echo   - Falta VC++ Redist (ver mensajes anteriores)
    echo   - Puerto ocupado (Flet usa un puerto local)
    echo   - Error en el codigo
    echo.
    pause
)

pause