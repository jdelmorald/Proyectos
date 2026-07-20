@echo off
REM Detiene Salud San Marcos y quita el arranque automatico. No borra el proyecto ni
REM los datos guardados (la base de datos sigue intacta en server\data).
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Deteniendo Salud San Marcos...
echo ==============================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4002 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo ==============================================
echo   Quitando el arranque automatico...
echo ==============================================
del /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Salud San Marcos.vbs" 2>nul

echo.
echo Listo. Salud San Marcos ya no arrancara automaticamente ni esta corriendo.
echo Para volver a activarlo, ejecuta instalar.bat de nuevo.
pause
