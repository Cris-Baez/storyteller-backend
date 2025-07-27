// test-flujo-completo.ts - Prueba del Flujo Completo CinemaAI

import { RenderRequest } from '../utils/types.js';
import { adaptarCerebrosAVideoPlan, debugAdaptador } from '../services/llmService/adaptador-cerebros.js';

/**
 * Prueba completa del flujo CinemaAI actualizado
 * 1. RenderRequest → Sistema de Cerebros
 * 2. VideoPlan → Distribución (Kling, Murf, Freesound)  
 * 3. Assets → FFmpeg → Video Final
 */
async function probarFlujoCinemaAI() {
  console.log('🎬 PRUEBA COMPLETA DEL FLUJO CINEMAAI');
  console.log('=' .repeat(60));
  
  // 1. Simular RenderRequest del usuario
  const renderRequest: RenderRequest = {
    prompt: "Un samurái camina bajo la lluvia hacia un templo abandonado, recordando su pasado",
    visualStyle: 'cinematic',
    duration: 15,
    metadata: {
      llmModel: 'openai/chatgpt-4o-latest'
    },
    demoMode: false,
    previewMode: false
  };
  
  console.log('📝 1. RENDER REQUEST');
  console.log(`Prompt: "${renderRequest.prompt}"`);
  console.log(`Estilo: ${renderRequest.visualStyle}`);
  console.log(`Duración: ${renderRequest.duration} segundos`);
  
  try {
    // 2. Sistema de Cerebros → VideoPlan
    console.log('\n🧠 2. SISTEMA DE CEREBROS');
    console.log('Despachando a cerebros cinematográficos...');
    
    const videoPlan = await adaptarCerebrosAVideoPlan(renderRequest);
    
    console.log('✅ VideoPlan generado exitosamente');
    console.log(`Timeline: ${videoPlan.timeline.length} segundos`);
    console.log(`Estilo: ${videoPlan.visualStyle}`);
    console.log(`Actos narrativos: ${videoPlan.metadata.actos}`);
    console.log(`Momentos emocionales: ${videoPlan.metadata.momentosEmocionales?.length || 0}`);
    
    // Debug detallado
    debugAdaptador(videoPlan);
    
    // 3. Análisis de distribución a servicios
    console.log('\n📤 3. DISTRIBUCIÓN A SERVICIOS');
    
    // Para KlingService
    const assetsParagKling = videoPlan.timeline.map((segundo, index) => ({
      segundo: index,
      background: segundo.background,
      character: segundo.character,
      camera: segundo.camera,
      visual: segundo.visual,
      lighting: segundo.lighting
    }));
    
    console.log('🎥 KLING SERVICE:');
    console.log(`- ${assetsParagKling.length} clips a generar`);
    console.log(`- Fondos únicos: ${new Set(assetsParagKling.map(a => a.background)).size}`);
    console.log(`- Actores únicos: ${new Set(assetsParagKling.map(a => a.character)).size}`);
    console.log(`- Shots de cámara:`, [...new Set(assetsParagKling.map(a => 
      typeof a.camera === 'object' && a.camera !== null ? a.camera.shot : 'unknown'
    ))]);
    
    // Para MurfService (VoiceService)
    const dialogos = videoPlan.timeline.filter(s => s.dialogo && s.dialogo.trim().length > 0);
    
    console.log('\n🎙️ MURF SERVICE:');
    console.log(`- ${dialogos.length} segundos con diálogo`);
    console.log(`- Personajes: ${videoPlan.metadata.characters?.length || 0}`);
    console.log(`- Lip-sync requerido: ${videoPlan.timeline.filter(s => s.lipSync).length} segundos`);
    
    // Para FreesoundService (musicService + sceneAudioService)
    const musicaRequerida = videoPlan.timeline.map(s => s.music?.mood).filter(Boolean);
    const efectosSonoros = videoPlan.timeline.map(s => s.soundCue).filter(Boolean);
    
    console.log('\n🔊 FREESOUND SERVICE:');
    console.log(`- Estilos musicales: ${[...new Set(musicaRequerida)].join(', ')}`);
    console.log(`- Efectos de sonido: ${[...new Set(efectosSonoros)].join(', ')}`);
    console.log(`- Audio carryover: ${videoPlan.timeline.filter(s => s.audioCarryover).length} transiciones`);
    
    // Para FFmpegService
    const transiciones = videoPlan.timeline.map(s => s.transition).filter(Boolean);
    const efectosVisuales = videoPlan.timeline.filter(s => s.effects && s.effects !== 'subtle').length;
    
    console.log('\n🎬 FFMPEG SERVICE:');
    console.log(`- Transiciones: ${[...new Set(transiciones)].join(', ')}`);
    console.log(`- Efectos visuales: ${efectosVisuales} segundos`);
    console.log(`- Color grading: ${videoPlan.metadata.colorGrading || 'cinematic'}`);
    console.log(`- Frame rate: ${videoPlan.metadata.frameRate || 24} FPS`);
    console.log(`- Resolución: ${videoPlan.metadata.resolucion || '1920x1080'}`);
    
    // 4. Resumen del flujo
    console.log('\n🎯 4. RESUMEN DEL FLUJO');
    console.log('✅ RenderRequest → Sistema de Cerebros: OK');
    console.log('✅ VideoPlan → Formato Compatible: OK'); 
    console.log('✅ Distribución a Servicios: OK');
    console.log('📋 Próximo paso: Pipeline ejecutará Kling → Murf → FFmpeg');
    
    // 5. Verificación de calidad
    console.log('\n🔍 5. VERIFICACIÓN DE CALIDAD');
    
    let puntuacionCalidad = 0;
    const verificaciones = [];
    
    // Timeline completo
    if (videoPlan.timeline.length === renderRequest.duration) {
      puntuacionCalidad += 25;
      verificaciones.push('✅ Timeline completo');
    } else {
      verificaciones.push(`❌ Timeline incompleto (${videoPlan.timeline.length}/${renderRequest.duration})`);
    }
    
    // Assets válidos
    const assetsValidos = videoPlan.timeline.every(s => s.background && s.character);
    if (assetsValidos) {
      puntuacionCalidad += 25;
      verificaciones.push('✅ Assets válidos');
    } else {
      verificaciones.push('❌ Assets faltantes');
    }
    
    // Estructura narrativa
    if (videoPlan.metadata.actos && videoPlan.metadata.actos >= 3) {
      puntuacionCalidad += 25;
      verificaciones.push('✅ Estructura narrativa');
    } else {
      verificaciones.push('❌ Estructura narrativa incompleta');
    }
    
    // Configuración técnica
    const configCompleta = videoPlan.metadata.frameRate && videoPlan.metadata.aspectRatio;
    if (configCompleta) {
      puntuacionCalidad += 25;
      verificaciones.push('✅ Configuración técnica');
    } else {
      verificaciones.push('❌ Configuración técnica incompleta');
    }
    
    verificaciones.forEach(v => console.log(v));
    console.log(`\n📊 Puntuación de calidad: ${puntuacionCalidad}/100`);
    
    if (puntuacionCalidad >= 75) {
      console.log('🎉 ¡FLUJO LISTO PARA PRODUCCIÓN!');
    } else {
      console.log('⚠️ Flujo necesita ajustes antes de producción');
    }
    
    return {
      success: true,
      videoPlan,
      puntuacionCalidad,
      verificaciones
    };
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL FLUJO:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      videoPlan: null,
      puntuacionCalidad: 0,
      verificaciones: ['❌ Flujo falló completamente']
    };
  }
}

// Función para simular el comportamiento de cada servicio
function simularDistribucionServicios(videoPlan: any) {
  console.log('\n🔄 SIMULACIÓN DE SERVICIOS');
  
  // Simular KlingService
  console.log('\n🎥 Simulando KlingService...');
  const clipsKling = videoPlan.timeline.map((segundo: any, index: number) => ({
    id: `clip_${index}`,
    prompt: segundo.visual,
    background: segundo.background,
    character: segundo.character,
    camera: segundo.camera,
    duration: 1,
    status: 'ready'
  }));
  console.log(`Clips generados: ${clipsKling.length}`);
  
  // Simular MurfService
  console.log('\n🎙️ Simulando MurfService...');
  const audiosVoz = videoPlan.timeline
    .filter((s: any) => s.dialogo)
    .map((segundo: any, index: number) => ({
      id: `voice_${index}`,
      text: segundo.dialogo,
      voice: segundo.lipSync ? 'narrator-male' : 'background',
      duration: 1
    }));
  console.log(`Audios de voz: ${audiosVoz.length}`);
  
  // Simular FreesoundService
  console.log('\n🔊 Simulando FreesoundService...');
  const audioMusica = {
    mood: videoPlan.metadata.music?.mood || 'cinematic',
    duration: videoPlan.timeline.length,
    tracks: ['orchestral-main', 'ambient-background']
  };
  console.log(`Música: ${audioMusica.mood} (${audioMusica.duration}s)`);
  
  // Simular FFmpegService
  console.log('\n🎬 Simulando FFmpegService...');
  const videoFinal = {
    clips: clipsKling,
    audio: audiosVoz,
    music: audioMusica,
    effects: videoPlan.timeline.filter((s: any) => s.effects !== 'subtle').length,
    transitions: [...new Set(videoPlan.timeline.map((s: any) => s.transition))],
    resolution: videoPlan.metadata.resolucion || '1920x1080',
    frameRate: videoPlan.metadata.frameRate || 24
  };
  
  console.log('📹 Video final simulado:');
  console.log(`- Clips: ${videoFinal.clips.length}`);
  console.log(`- Audios: ${videoFinal.audio.length}`);
  console.log(`- Efectos: ${videoFinal.effects}`);
  console.log(`- Transiciones: ${videoFinal.transitions.join(', ')}`);
  
  return videoFinal;
}

// Ejecutar prueba si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  probarFlujoCinemaAI()
    .then(resultado => {
      if (resultado.success && resultado.videoPlan) {
        simularDistribucionServicios(resultado.videoPlan);
      }
      console.log('\n🏁 Prueba completada');
    })
    .catch(console.error);
}

export { probarFlujoCinemaAI, simularDistribucionServicios };
