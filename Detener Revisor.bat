@echo off
title Deteniendo Revisor...
set FOUND=0

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p >nul 2>&1
  set FOUND=1
)

echo.
if "%FOUND%"=="1" (
  echo La plataforma Revisor se detuvo correctamente.
) else (
  echo La plataforma Revisor no estaba encendida.
)
echo.
pause
