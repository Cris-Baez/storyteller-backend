@echo off
echo 🔄 Reiniciando servidor con fix de assets...

echo ⏹️ Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1

echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo 🚀 Iniciando servidor con cambios...
start "CinemaAI Server" cmd /k "npm run dev"

echo ⏳ Esperando 10 segundos para que inicie...
timeout /t 10 /nobreak >nul

echo 🔍 Verificando servidor...
curl -s http://localhost:3000/healthz

echo.
echo ✅ Servidor reiniciado. Ahora ejecuta:
echo    node test_assets_fix.js
echo.
pause
