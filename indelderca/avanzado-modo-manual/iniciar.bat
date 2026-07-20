@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Indelderca - Sistema de Documentos
echo   Preparando el sistema (la primera vez puede tardar varios minutos)...
echo ==============================================

cd ..\server
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
echo   Sistema listo. Iniciando...
echo   Abre tu navegador en:  http://localhost:4001
echo   NO CIERRES esta ventana mientras uses el sistema.
echo ==============================================

cd server
call npm start
pause
goto :eof

:error
echo.
echo Ocurrio un error durante la instalacion. Revisa el mensaje de arriba.
pause
