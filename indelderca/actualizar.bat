@echo off
REM Usa este script cuando reemplaces los archivos del proyecto por una version
REM nueva (por ejemplo, un ZIP actualizado). Reconstruye todo y reinicia el
REM sistema automaticamente, sin perder los datos guardados.
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Deteniendo Indelderca (si estaba corriendo)...
echo ==============================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4001 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo ==============================================
echo   Actualizando Indelderca...
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
) > "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Indelderca.vbs"

echo ==============================================
echo   Actualizando el acceso directo del Escritorio...
echo ==============================================
(
echo [InternetShortcut]
echo URL=http://localhost:4001
echo IconFile=%~dp0logo.ico
echo IconIndex=0
) > "%USERPROFILE%\Desktop\Indelderca.url"

echo ==============================================
echo   Reiniciando el sistema...
echo ==============================================
wscript.exe "iniciar-invisible.vbs"
timeout /t 3 /nobreak >nul

echo.
echo Listo. Indelderca quedo actualizado y corriendo.
pause
goto :eof

:error
echo.
echo Ocurrio un error durante la actualizacion. Revisa el mensaje de arriba.
pause
