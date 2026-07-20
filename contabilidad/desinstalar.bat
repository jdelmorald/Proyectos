@echo off
REM Detiene el Sistema Contable y quita el arranque automatico. No borra el
REM proyecto ni los datos guardados (la base de datos sigue intacta en server\data).
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Deteniendo Sistema Contable...
echo ==============================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4004 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo ==============================================
echo   Quitando el arranque automatico...
echo ==============================================
del /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Sistema Contable.vbs" 2>nul

echo.
echo Listo. El Sistema Contable ya no arrancara automaticamente ni esta corriendo.
echo Para volver a activarlo, ejecuta instalar.bat de nuevo.
pause
