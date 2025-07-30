// adaptador-cerebros.ts - Adaptador entre Sistema de Cerebros y Pipeline Legacy

import { dispatchCerebros, type RequestGeneracion } from './dispatcher.js';
import { safeLog } from '../../utils/logger.js';
import { RenderRequest, VideoPlan, TimelineSecond } from '../../utils/types.js';
import { EstiloVisualPrincipal, normalizarEstilo } from '../../types/estilos.js';

/**
 * Adaptador principal que convierte el sistema de cerebros al formato esperado
 * por el pipeline existente (Kling, Murf, FFmpeg)
 */
export async function adaptarCerebrosAVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  console.log('[Adaptador] Convirtiendo request a formato de cerebros...');
  
  // Normalizar estilo usando el sistema unificado
  const estiloVisual = normalizarEstilo(req.visualStyle);
  
  // Crear request para sistema de cerebros
  const requestCerebros: RequestGeneracion = {
    prompt: req.prompt,
    duracion: req.duration,
    estilo: estiloVisual,
    configuracion: {
      demoMode: req.demoMode,
      previewMode: req.previewMode,
      metadata: req.metadata
    }
  };
  
  console.log(`[Adaptador] Despachando a cerebros: ${estiloVisual}`);
  
  try {
    const resultadoCerebros = await dispatchCerebros(requestCerebros);
    
    if (!resultadoCerebros.success) {
      throw new Error(`Sistema de cerebros falló: ${resultadoCerebros.error}`);
    }
    
    safeLog('[Adaptador] Cerebros generaron timeline:', { 
      segundos: resultadoCerebros.videoPlan.length,
      hasMetadata: !!resultadoCerebros.metadata
    });
    
    // Convertir formato de cerebros al formato legacy esperado por el pipeline
    const timelineLegacy: TimelineSecond[] = resultadoCerebros.videoPlan.map((segundo: any, index: number) => {
      
      // Extraer datos del formato de cerebros
      const fondoData = segundo.fondo || {};
      const actorData = segundo.actor || {};
      const camaraData = segundo.camara || {};
      const sonidoData = segundo.sonido || {};
      const edicionData = segundo.edicion || {};
      const narrativaData = segundo.narrativa || {};
      
      // Convertir al formato legacy que espera el pipeline
      const timelineSecond: TimelineSecond = {
        // Campos requeridos para compatibilidad
        t: segundo.segundo,                    // Pipeline legacy usa 't'
        segundo: segundo.segundo,              // Sistema de cerebros usa 'segundo'
        
        // Visual y narrativa
        visual: narrativaData.historia || narrativaData.prompt || `Escena cinematográfica ${segundo.segundo + 1}`,
        backgroundPrompt: fondoData.nombre || fondoData.ambiente || `Fondo para segundo ${segundo.segundo}`,
        actorPrompt: actorData.tipo || actorData.emocion || `Actor para segundo ${segundo.segundo}`,
        
        // Assets (rutas que usa Kling)
        background: fondoData.ruta || fondoData.archivo,
        character: actorData.archivo || actorData.ruta,
        
        // Configuración de cámara (formato esperado por Kling)
        camera: {
          shot: camaraData.shot || 'medium',
          movement: camaraData.movement || 'static'
        },
        movement: camaraData.movement || 'static',
        lighting: camaraData.iluminacion || 'natural',
        
        // Audio (formato esperado por Murf y musicService)
        music: sonidoData.musica ? {
          mood: sonidoData.musica,
          trackId: sonidoData.musica
        } : { mood: 'cinematic', trackId: 'cinematic' },
        
        dialogo: sonidoData.requiereVoz ? narrativaData.dialogo || '' : '',
        lipSync: sonidoData.lipSync || false,
        soundCue: sonidoData.ambiente || 'ambient',
        
        // Edición (formato esperado por FFmpeg)
        transition: edicionData.tipoCorte || 'cut',
        carryover: edicionData.carryover || false,
        audioCarryover: edicionData.audioCarryover || false,
        
        // Efectos visuales y atmósfera
        emotion: segundo.esEmocional ? 'emotional' : 'neutral',
        atmosphere: segundo.tono || 'dramatic',
        colorPalette: camaraData.iluminacion || 'cinematic',
        composition: camaraData.shot || 'medium',
        effects: segundo.esEmocional ? 'dramatic' : 'subtle',
        
        // Campos específicos del sistema de cerebros (para debugging/analytics)
        segmento: segundo.segmento,
        momentoNarrativo: segundo.momentoNarrativo,
        esEmocional: segundo.esEmocional,
        tono: segundo.tono,
        
        // Metadatos adicionales para el pipeline
        visualStyle: estiloVisual,
        faceAnimation: actorData.emocion || 'neutral',
        
        // Overlays y LUTs cinematográficos
        overlays: [],
        luts: resultadoCerebros.configuracion?.filtrosGlobales?.map((filtro: string) => ({
          path: `luts/${filtro}.cube`,
          intensity: 0.7
        })) || []
      };
      
      return timelineSecond;
    });
    
    // Crear VideoPlan compatible con pipeline legacy
    const videoPlanLegacy: VideoPlan = {
      visualStyle: estiloVisual,
      timeline: timelineLegacy,
      metadata: {
        visualStyle: estiloVisual,
        duration: req.duration,
        prompt: req.prompt,
        
        // Metadata del sistema de cerebros (para analytics)
        duracionTotal: resultadoCerebros.metadata.duracionTotal,
        actos: resultadoCerebros.metadata.actos,
        momentosEmocionales: resultadoCerebros.metadata.momentosEmocionales,
        puntosClimax: resultadoCerebros.metadata.puntosClimax,
        configuracionNarrativa: resultadoCerebros.metadata.configuracionNarrativa,
        estiloVisual: resultadoCerebros.metadata.estiloVisual,
        version: resultadoCerebros.metadata.version,
        tiempoGeneracion: resultadoCerebros.tiempoGeneracion,
        
        // Configuración técnica para el pipeline
        frameRate: resultadoCerebros.configuracion?.frameRate || 24,
        aspectRatio: resultadoCerebros.configuracion?.aspectRatio || '16:9',
        resolucion: resultadoCerebros.configuracion?.resolucion || '1920x1080',
        colorGrading: resultadoCerebros.configuracion?.colorGrading || 'cinematic-lut',
        
        // Metadata legacy requerido
        characters: extraerPersonajes(timelineLegacy),
        music: { 
          mood: resultadoCerebros.configuracion?.colorGrading || 'cinematic',
          trackId: 'orchestral-cinematic'
        },
        demoMode: req.demoMode || false,
        
        // Preservar metadata original
        ...req.metadata
      },
      
      // Configuración global para FFmpeg
      configuracionGlobal: resultadoCerebros.configuracion,
      restricciones: resultadoCerebros.restricciones
    };
    
    console.log(`[Adaptador] VideoPlan convertido: ${timelineLegacy.length} segundos`);
    console.log(`[Adaptador] Momentos emocionales: ${videoPlanLegacy.metadata.momentosEmocionales?.length || 0}`);
    console.log(`[Adaptador] Actos narrativos: ${videoPlanLegacy.metadata.actos || 0}`);
    
    return videoPlanLegacy;
    
  } catch (error) {
    console.error('[Adaptador] Error en sistema de cerebros:', error);
    throw new Error(`Adaptador falló: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Extraer personajes del timeline para compatibilidad con voiceService
 */
function extraerPersonajes(timeline: TimelineSecond[]): any[] {
  const personajes = new Set<string>();
  
  timeline.forEach(segundo => {
    if (segundo.dialogo && segundo.dialogo.trim().length > 0) {
      // Extraer personaje del actor o usar genérico
      const nombrePersonaje = segundo.actorPrompt?.split(' ')[0] || 'Narrador';
      personajes.add(nombrePersonaje);
    }
  });
  
  return Array.from(personajes).map((nombre, index) => ({
    name: nombre,
    voiceId: `voice_${index + 1}`,
    gender: index % 2 === 0 ? 'male' : 'female',
    age: 30 + (index * 5),
    language: 'es'
  }));
}

/**
 * Función de utilidad para debug del adaptador
 */
export function debugAdaptador(videoPlan: VideoPlan): void {
  console.log('\n🔍 DEBUG ADAPTADOR:');
  console.log(`Timeline: ${videoPlan.timeline.length} segundos`);
  console.log(`Estilo: ${videoPlan.visualStyle}`);
  console.log(`Actos: ${videoPlan.metadata.actos}`);
  console.log(`Momentos emocionales: ${videoPlan.metadata.momentosEmocionales?.length || 0}`);
  
  // Analizar distribución de shots
  const shots = videoPlan.timeline.map(s => {
    const camera = s.camera;
    if (typeof camera === 'object' && camera !== null && 'shot' in camera) {
      return camera.shot || 'unknown';
    }
    return 'unknown';
  });
  const shotCounts = shots.reduce((acc, shot) => {
    acc[shot] = (acc[shot] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('Distribución de shots:', shotCounts);
  
  // Analizar música y audio
  const conAudio = videoPlan.timeline.filter(s => s.dialogo && s.dialogo.trim().length > 0).length;
  console.log(`Segundos con diálogo: ${conAudio}/${videoPlan.timeline.length}`);
  
  console.log('🔍 FIN DEBUG\n');
}
