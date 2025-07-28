@echo off
REM Script para limpiar archivos no utilizados del backend CinemaAI

echo 🧹 Iniciando limpieza del backend CinemaAI...

REM Contador de archivos eliminados
set deleted_count=0
set total_count=0

REM Lista de archivos que ya NO se usan después de la migración al sistema de cerebros

echo 📋 Eliminando sistema LLM legacy...
call :delete_if_exists "src\services\llmService\index.ts"
call :delete_if_exists "src\services\llmService\anime.ts"
call :delete_if_exists "src\services\llmService\cinematic.ts"
call :delete_if_exists "src\services\llmService\cinematic_simple.ts"
call :delete_if_exists "src\services\llmService\realistic.ts"
call :delete_if_exists "src\services\llmService\commercial.ts"
call :delete_if_exists "src\services\llmService\game.ts"
call :delete_if_exists "src\services\llmService\narrative.ts"
call :delete_if_exists "src\services\llmService\ejemplo-integracion.ts"
call :delete_if_exists "src\services\llmService\test-cerebros.ts"

echo 📋 Eliminando archivos de tipos y validación duplicados...
call :delete_if_exists "src\utils\types-new.ts"
call :delete_if_exists "src\utils\validateVideoPlan.ts"

echo 📋 Eliminando servicios migrados a audioEngine...
call :delete_if_exists "src\services\musicService.ts"
call :delete_if_exists "src\services\sceneAudioService.ts"
call :delete_if_exists "src\services\audioFallbackService.ts"
call :delete_if_exists "src\services\carryOverService.ts"

echo 📋 Eliminando servicios de video obsoletos...
call :delete_if_exists "src\services\videoEngine.ts"
call :delete_if_exists "src\services\storyboardService.ts"

echo 📋 Eliminando servicios de búsqueda obsoletos...
call :delete_if_exists "src\services\searchAsset.ts"
call :delete_if_exists "src\utils\searchAsset.ts"

echo 📋 Eliminando servicios de métricas opcionales...
call :delete_if_exists "src\services\metricsService.ts"

echo 📋 Eliminando tests obsoletos...
call :delete_if_exists "src\tests\test-flujo-completo.ts"

echo 📋 Eliminando utilities no utilizados...
call :delete_if_exists "src\utils\mapSceneFields.ts"
call :delete_if_exists "src\utils\normalizeSceneFields.ts"
call :delete_if_exists "src\utils\extractVideoUrl.ts"
call :delete_if_exists "src\utils\audioUtils.ts"

echo 📋 Eliminando providers no utilizados...
call :delete_if_exists "src\services\providers\runwayGen4.ts"
call :delete_if_exists "src\services\providers\replicateFallback.ts"

echo 📋 Eliminando helpers del LLM obsoletos...
call :delete_if_exists "src\services\llmService\helpers\segmentador.ts"
call :delete_if_exists "src\services\llmService\helpers\assetUtils.ts"
call :delete_if_exists "src\services\llmService\restricciones.ts"

echo 📋 Eliminando types no utilizados...
call :delete_if_exists "src\types\AudioTypes.ts"

echo.
echo ✅ Limpieza completada!
echo 📊 Archivos eliminados: %deleted_count% de %total_count%
echo.
echo 🔄 Archivos conservados importantes:
echo    ✅ dispatcher.ts (cerebros cinematográficos)
echo    ✅ cerebros cinematic/* (AI inteligente)
echo    ✅ renderPipeline.ts (pipeline unificado)
echo    ✅ sadtalkerService.ts ^& wav2lipService.ts (lip-sync)
echo    ✅ audioEngine.ts (audio unificado)
echo    ✅ klingService.ts, ffmpegService.ts, cdnService.ts
echo.
echo 🚀 Backend optimizado y listo para testing!

pause
goto :eof

:delete_if_exists
set /a total_count+=1
if exist "%~1" (
    echo 🗑️  Eliminando: %~1
    del "%~1"
    set /a deleted_count+=1
) else (
    echo ⚠️  No encontrado: %~1
)
goto :eof
