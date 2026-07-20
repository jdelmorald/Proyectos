@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Sistema Contable - Instalacion
echo   Esto puede tardar varios minutos la primera vez...
echo ==============================================

echo ==============================================
echo   Deteniendo una version anterior (si estaba corriendo)...
echo ==============================================
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4004 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

cd server
if not exist ".env" copy ".env.example" ".env" >nul
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
call npm run seed
if errorlevel 1 goto error
cd ..

cd client
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
cd ..

echo ==============================================
echo   Configurando arranque automatico...
echo ==============================================
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.Run """%~dp0iniciar-invisible.vbs""", 0, False
) > "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Sistema Contable.vbs"

echo ==============================================
echo   Iniciando el sistema ahora...
echo ==============================================
wscript.exe "iniciar-invisible.vbs"
timeout /t 3 /nobreak >nul

echo ==============================================
echo   Creando acceso directo en el Escritorio...
echo ==============================================
(
echo [InternetShortcut]
echo URL=http://localhost:4004
echo IconFile=%~dp0logo.ico
echo IconIndex=0
) > "%USERPROFILE%\Desktop\Sistema Contable.url"

echo.
echo ==============================================
echo   LISTO.
echo   - El Sistema Contable ya esta corriendo en segundo plano, sin ventanas.
echo   - Arrancara solo cada vez que inicies sesion en esta PC.
echo   - Usa el acceso directo "Sistema Contable" del Escritorio para abrirlo.
echo   - O entra directo desde el navegador a: http://localhost:4004
echo   - Incluye Sumivensa, Indelderca y Salud San Marcos: cambia de empresa
echo     desde el selector en el menu lateral.
echo ==============================================
pause
goto :eof

:error
echo.
echo Ocurrio un error durante la instalacion. Revisa el mensaje de arriba.
pause
