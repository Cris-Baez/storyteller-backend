#!/bin/bash
# Script para limpiar archivos no utilizados del backend CinemaAI

echo "🧹 Iniciando limpieza del backend CinemaAI..."

# Lista de archivos que ya NO se usan después de la migración al sistema de cerebros
FILES_TO_DELETE=(
    # Sistema LLM legacy (ya no se usa, todo migrado a dispatcher + cerebros)
    "src/services/llmService/index.ts"
    "src/services/llmService/anime.ts" 
    "src/services/llmService/cinematic.ts"
    "src/services/llmService/cinematic_simple.ts"
    "src/services/llmService/realistic.ts"
    "src/services/llmService/commercial.ts"
    "src/services/llmService/game.ts"
    "src/services/llmService/narrative.ts"
    "src/services/llmService/ejemplo-integracion.ts"
    "src/services/llmService/test-cerebros.ts"
    
    # Archivos de tipos y validación duplicados/obsoletos
    "src/utils/types-new.ts"  # Duplicado de types.ts
    "src/utils/validateVideoPlan.ts"  # No se importa en ningún lugar
    
    # Servicios que ya no se usan directamente (migrados a audioEngine)
    "src/services/musicService.ts"  # Migrado a audioEngine.getAdvancedMusic()
    "src/services/sceneAudioService.ts"  # Migrado a audioEngine.getSfx()
    "src/services/audioFallbackService.ts"  # Solo usado internamente por audioEngine
    "src/services/carryOverService.ts"  # No se usa en el nuevo pipeline
    
    # Servicios de video obsoletos
    "src/services/videoEngine.ts"  # No se usa, todo va por Kling
    "src/services/storyboardService.ts"  # No se importa en ningún lugar
    
    # Servicios de búsqueda obsoletos (menteFondos ya tiene su propia lógica)
    "src/services/searchAsset.ts"  # Solo usado por menteFondos, se puede integrar
    "src/utils/searchAsset.ts"  # Duplicado
    
    # Servicios de métricas y feedback (no críticos para funcionamiento)
    "src/services/metricsService.ts"  # Sistema de métricas opcional
    
    # Test obsoleto
    "src/tests/test-flujo-completo.ts"  # Test del sistema legacy
    
    # Helpers y utilities no utilizados
    "src/utils/mapSceneFields.ts"  # No se importa
    "src/utils/normalizeSceneFields.ts"  # No se importa  
    "src/utils/extractVideoUrl.ts"  # No se importa
    "src/utils/audioUtils.ts"  # No se importa
    
    # Providers no utilizados actualmente
    "src/services/providers/runwayGen4.ts"  # No se usa, solo Kling
    "src/services/providers/replicateFallback.ts"  # No se usa
    
    # Helpers del LLM que ya no se necesitan
    "src/services/llmService/helpers/segmentador.ts"  # Ya no se usa
    "src/services/llmService/helpers/assetUtils.ts"  # Ya no se usa
    "src/services/llmService/restricciones.ts"  # Ya no se usa
    
    # Types específicos no utilizados
    "src/types/AudioTypes.ts"  # No se importa
)

echo "📋 Archivos marcados para eliminación: ${#FILES_TO_DELETE[@]}"

# Función para verificar si un archivo existe antes de eliminarlo
delete_file_if_exists() {
    if [ -f "$1" ]; then
        echo "🗑️  Eliminando: $1"
        rm "$1"
        return 0
    else
        echo "⚠️  No encontrado: $1"
        return 1
    fi
}

# Contador de archivos eliminados
deleted_count=0

# Eliminar archivos uno por uno
for file in "${FILES_TO_DELETE[@]}"; do
    if delete_file_if_exists "$file"; then
        ((deleted_count++))
    fi
done

echo ""
echo "✅ Limpieza completada!"
echo "📊 Archivos eliminados: $deleted_count de ${#FILES_TO_DELETE[@]}"
echo ""
echo "🔄 Archivos conservados importantes:"
echo "   ✅ dispatcher.ts (cerebros cinematográficos)"
echo "   ✅ cerebros cinematic/* (AI inteligente)"
echo "   ✅ renderPipeline.ts (pipeline unificado)"
echo "   ✅ sadtalkerService.ts & wav2lipService.ts (lip-sync)"
echo "   ✅ audioEngine.ts (audio unificado)"
echo "   ✅ klingService.ts, ffmpegService.ts, cdnService.ts"
echo ""
echo "🚀 Backend optimizado y listo para testing!"
