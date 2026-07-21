@echo off
REM Usa este script cuando reemplaces los archivos del proyecto por una version
REM nueva (por ejemplo, un ZIP actualizado). Reconstruye todo y reinicia el
REM sistema automaticamente, sin perder los datos guardados.
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Deteniendo Sistema Contable (si estaba corriendo)...
echo ==============================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4004 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo ==============================================
echo   Actualizando el Sistema Contable...
echo ==============================================

cd server
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
cd ..

cd client
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
cd ..

echo ==============================================
echo   Actualizando el arranque automatico...
echo ==============================================
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.Run """%~dp0iniciar-invisible.vbs""", 0, False
) > "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Sistema Contable.vbs"

echo ==============================================
echo   Buscando la carpeta real del Escritorio...
echo ==============================================
REM En muchos equipos (sobre todo con OneDrive activado) el Escritorio real no
REM esta en "%%USERPROFILE%%\Desktop" sino en una carpeta redirigida. Se
REM consulta el registro de Windows para usar la carpeta real.
set "DESKTOP=%USERPROFILE%\Desktop"
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop 2^>nul ^| findstr /i "Desktop"') do set "DESKTOP=%%b"

echo ==============================================
echo   Actualizando el acceso directo del Escritorio...
echo ==============================================
(
echo [InternetShortcut]
echo URL=http://localhost:4004
echo IconFile=%~dp0logo.ico
echo IconIndex=0
) > "%DESKTOP%\Sistema Contable.url"

echo ==============================================
echo   Reiniciando el sistema...
echo ==============================================
wscript.exe "iniciar-invisible.vbs"

echo   Esperando a que el sistema termine de arrancar...
set /a intentos=0
:esperar
timeout /t 1 /nobreak >nul
set /a intentos+=1
netstat -ano | findstr :4004 | findstr LISTENING >nul
if errorlevel 1 if %intentos% lss 30 goto esperar

echo ==============================================
echo   Abriendo el Sistema Contable en el navegador...
echo ==============================================
start "" "http://localhost:4004"

echo.
echo Listo. El Sistema Contable quedo actualizado y corriendo.
pause
goto :eof

:error
echo.
echo Ocurrio un error durante la actualizacion. Revisa el mensaje de arriba.
pause
