#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=============================================="
echo "  Salud San Marcos - Sistema de Documentos"
echo "  Preparando el sistema (la primera vez puede tardar varios minutos)..."
echo "=============================================="

cd ../server
[ -f .env ] || cp .env.example .env
npm install
npm run build
npm run seed
cd ..

cd client
npm install
npm run build
cd ..

echo "=============================================="
echo "  Sistema listo. Iniciando..."
echo "  Abre tu navegador en:  http://localhost:4002"
echo "  NO CIERRES esta ventana mientras uses el sistema."
echo "=============================================="

cd server
npm start
