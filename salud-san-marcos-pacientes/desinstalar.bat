@echo off
REM Detiene el modulo de Gestion de Pacientes y quita el arranque automatico. No borra
REM el proyecto ni los datos guardados (la base de datos sigue intacta en server\data).
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Deteniendo Salud San Marcos - Gestion de Pacientes...
echo ==============================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4003 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo ==============================================
echo   Quitando el arranque automatico...
echo ==============================================
del /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Salud San Marcos - Pacientes.vbs" 2>nul

echo.
echo Listo. El modulo de Gestion de Pacientes ya no arrancara automaticamente ni esta corriendo.
echo Para volver a activarlo, ejecuta instalar.bat de nuevo.
pause
