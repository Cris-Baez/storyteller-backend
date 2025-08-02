@echo off
echo 🚀 Iniciando Storyteller AI Backend...
echo.

echo ✅ Compilando TypeScript...
call npm run build
if errorlevel 1 (
    echo ❌ Error en compilación
    exit /b 1
)

echo ✅ Iniciando servidor...
node dist/index.js
