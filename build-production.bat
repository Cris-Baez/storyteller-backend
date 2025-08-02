@echo off
title Storyteller AI - Compilacion Final
echo.
echo ================================
echo   STORYTELLER AI BACKEND
echo   Compilacion para Produccion
echo ================================
echo.

echo [1/3] Limpiando build anterior...
if exist dist rmdir /s /q dist

echo [2/3] Compilando TypeScript...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Compilacion fallida
    echo.
    pause
    exit /b 1
)

echo [3/3] Verificando archivos...
if exist "dist\index.js" (
    echo ✅ index.js creado
) else (
    echo ❌ index.js no encontrado
    pause
    exit /b 1
)

if exist "dist\pipelines\renderPipeline.js" (
    echo ✅ renderPipeline.js creado
) else (
    echo ❌ renderPipeline.js no encontrado
    pause
    exit /b 1
)

echo.
echo ================================
echo   COMPILACION EXITOSA
echo ================================
echo.
echo ✅ Backend listo para produccion
echo ✅ Modo demo activado por defecto
echo ✅ Fallbacks configurados
echo.
echo Para iniciar: npm start
echo Para test: node test-endpoints.mjs
echo.
pause
