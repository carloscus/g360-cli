@echo off
chcp 65001 >nul
title G360 - Build Portable EXE (CustomTkinter)

echo.
echo ==============================================
echo   G360 CustomTkinter - Build Portable EXE
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
    :: Recargar PATH para que uv esté disponible
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

:: --- 5. Verificar VC++ Redist ---
echo [CHECK] Verificando Visual C++ Redistributable...
REG QUERY "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" >nul 2>&1
if errorlevel 1 (
    echo [WARN] VC++ Redist no detectado. Intentando instalar...
    powershell -Command "
        $url = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';
        $out = '$env:TEMP\vc_redist.x64.exe';
        Write-Host 'Descargando VC++ Redist...';
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
        Invoke-WebRequest -Uri $url -OutFile $out;
        Write-Host 'Instalando... (ventana silenciosa)';
        Start-Process -Wait -FilePath $out -ArgumentList '/install', '/quiet', '/norestart';
        Remove-Item $out;
    "
    if errorlevel 1 (
        echo [WARN] No se pudo instalar VC++ Redist.
        echo        El EXE generado requeria VC++ Redist en el PC destino.
        echo        Puedes descargarlo manualmente de:
        echo        https://aka.ms/vs/17/release/vc_redist.x64.exe
    ) else (
        echo [OK] VC++ Redist instalado correctamente
    )
) else (
    echo [OK] VC++ Redist detectado
)

:: --- 6. Leer nombre del ejecutable desde skill.json ---
set "APP_NAME=G360-App"
if exist "skill.json" (
    for /f "tokens=2 delims=:,}" %%a in ('findstr /i "build_name" skill.json') do set "APP_NAME=%%~a"
)
if exist "src\core\skill.json" (
    for /f "tokens=2 delims=:,}" %%a in ('findstr /i "build_name" src\core\skill.json') do set "APP_NAME=%%~a"
)
:: Limpiar comillas y espacios
set "APP_NAME=%APP_NAME:"=%"
set "APP_NAME=%APP_NAME: =%"
if "%APP_NAME%"=="" set "APP_NAME=G360-App"

:: --- 7. Build con PyInstaller ---
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

:: --- 8. Limpiar temporales ---
if exist "build" (
    echo [CLEAN] Limpiando archivos temporales...
    rmdir /s /q build
)

echo.
echo ==============================================
echo   BUILD EXITOSO
echo   Ejecutable: dist\%APP_NAME%.exe
echo   Tamaño aproximado: ~50-80 MB
echo ==============================================
echo.
echo NOTA: En PCs sin Python solo necesitas:
echo   - dist\G360-App.exe
echo   - VC++ Redist (si no esta instalado)
echo.

:: --- 8. Preguntar si crear acceso directo ---
set /p CREATE_SHORTCUT="Crear acceso directo en el escritorio? (S/N): "
if /i "%CREATE_SHORTCUT%"=="S" (
    echo Creando acceso directo...
    powershell -Command "
        $ws = New-Object -ComObject WScript.Shell;
        $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\G360 App.lnk');
        $sc.TargetPath = '%~dp0dist\G360-App.exe';
        $sc.WorkingDirectory = '%~dp0dist';
        $sc.Description = 'G360 Desktop Application';
        $sc.IconLocation = '%~dp0assets\images\app.ico, 0';
        $sc.Save();
    "
    echo [OK] Acceso directo creado en el escritorio
)

pause