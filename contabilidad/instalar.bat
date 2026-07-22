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
echo   Buscando la carpeta real del Escritorio...
echo ==============================================
REM En muchos equipos (sobre todo con OneDrive activado) el Escritorio real no
REM esta en "%%USERPROFILE%%\Desktop" sino en una carpeta redirigida (por
REM ejemplo "OneDrive\Desktop" o "OneDrive\Escritorio"). Si el acceso directo
REM se crea en el lugar equivocado, el usuario nunca lo ve. Se consulta el
REM registro de Windows para usar la carpeta real, sin importar donde este.
set "DESKTOP=%USERPROFILE%\Desktop"
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop 2^>nul ^| findstr /i "Desktop"') do set "DESKTOP=%%b"

echo ==============================================
echo   Creando acceso directo en el Escritorio...
echo ==============================================
(
echo [InternetShortcut]
echo URL=http://localhost:4004
echo IconFile=%~dp0logo.ico
echo IconIndex=0
) > "%DESKTOP%\Sistema Contable.url"

echo ==============================================
echo   Iniciando el sistema ahora...
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
