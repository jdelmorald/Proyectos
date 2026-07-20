@echo off
cd /d "%~dp0"
title Instalando Revisor...
echo ============================================
echo   Instalando la plataforma Revisor
echo   Esto puede tardar unos minutos. Por favor espera...
echo ============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js instalado en esta computadora.
  echo.
  echo Ve a https://nodejs.org, descarga e instala la version "LTS",
  echo y luego vuelve a hacer doble clic en este archivo.
  echo.
  pause
  exit /b 1
)

echo Instalando componentes ^(esto tarda varios minutos^)...
call npm install
if errorlevel 1 (
  echo.
  echo ============================================
  echo   Algo fallo instalando los componentes.
  echo   Copia todo este mensaje y compartelo para pedir ayuda.
  echo ============================================
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
)

echo.
echo Preparando la base de datos y las cuentas de prueba...
call npx prisma migrate dev
if errorlevel 1 (
  echo.
  echo ============================================
  echo   Algo fallo preparando la base de datos.
  echo   Copia todo este mensaje y compartelo para pedir ayuda.
  echo ============================================
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Listo! La instalacion termino correctamente.
echo.
echo   De ahora en adelante, usa el archivo
echo   "Iniciar Revisor.vbs" para abrir la plataforma.
echo ============================================
echo.
pause
