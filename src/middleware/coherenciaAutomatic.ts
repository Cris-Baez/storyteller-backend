// src/middleware/coherenciaAutomatic.ts
/**
 * 🎯 MIDDLEWARE AUTOMÁTICO DE COHERENCIA
 * =====================================
 * 
 * SE INTEGRA AUTOMÁTICAMENTE con el pipeline existente
 * ✅ Mejora todos los videos automáticamente
 * ✅ No modifica servicios existentes
 * ✅ Se aplica transparentemente
 */

import { logger } from '../utils/logger.js';
import type { VideoPlan, TimelineSecond } from '../utils/types.js';

export interface AudioIntegrationOptions {
  visualStyle?: string;
  duration?: number;
  timeOfDay?: string;
  location?: string;
}

interface VozConfig {
  voiceId: string;
  provider: 'murf' | 'elevenlabs';
  language: string;
  personaje?: string;
  optimizada: boolean;
}

interface SegmentoMejorado extends TimelineSecond {
  vozConfig?: VozConfig;
}

interface PlanMejorado extends VideoPlan {
  timeline: SegmentoMejorado[];
}

// Funciones de mejora simplificadas para integración directa
class CoherenciaAutomatica {
  private cache = new Map<string, string>();
  private estadisticas = {
    videosProcessados: 0,
    dialogosMejorados: 0,
    promptsMejorados: 0,
    vocesOptimizadas: 0
  };

  constructor() {
    logger.info('🎯 Sistema de Coherencia Automática inicializado');
  }

  /**
   * ✅ INTERCEPTAR Y MEJORAR PLAN DE VIDEO AUTOMÁTICAMENTE
   * Se llama desde renderPipeline antes del procesamiento
   */
  async mejorarPlanAutomaticamente(videoPlan: VideoPlan, opciones: AudioIntegrationOptions = {}): Promise<PlanMejorado> {
    const videoId = videoPlan.id || `auto_${Date.now()}`;
    
    logger.info(`🔄 Aplicando mejoras automáticas de coherencia a video ${videoId}`);
    logger.info(`📊 Plan recibido:`, {
      hasTimeline: !!videoPlan.timeline,
      timelineLength: videoPlan.timeline?.length || 0,
      hasTomasReales: !!videoPlan.tomasReales,
      tomasRealesLength: videoPlan.tomasReales?.length || 0,
      planKeys: Object.keys(videoPlan),
      metadata: !!videoPlan.metadata
    });
    
    // Si no hay timeline pero SÍ hay tomasReales, convertir tomasReales a timeline
    if ((!videoPlan.timeline || videoPlan.timeline.length === 0) && videoPlan.tomasReales && videoPlan.tomasReales.length > 0) {
      logger.info('🔄 Convirtiendo tomasReales a timeline para compatibilidad');
      
      const timelineFromTomas = videoPlan.tomasReales.map((toma: any, index: number) => ({
        segundo: index * (toma.duracion || 7), // Calcular segundo basado en duración
        voz: toma.voz || toma.dialogo || '',
        dialogo: toma.dialogo || toma.voz || '',
        prompt: toma.prompt || toma.descripcion || '',
        duracion: toma.duracion || 7,
        personaje: toma.personaje || 'Narrador',
        actor: toma.actor,
        fondo: toma.fondo,
        movimientoCamara: toma.movimientoCamara,
        tipoToma: toma.tipoToma,
        emocion: toma.emocion
      }));
      
      videoPlan.timeline = timelineFromTomas;
      logger.info(`✅ Convertidos ${videoPlan.tomasReales.length} tomas a ${timelineFromTomas.length} segmentos de timeline`);
    }
    
    // Si aún no hay timeline, preservar estructura original
    if (!videoPlan.timeline || videoPlan.timeline.length === 0) {
      logger.warn('⚠️ Plan sin timeline ni tomasReales, manteniendo estructura original');
      const planPreservado: PlanMejorado = {
        ...videoPlan,
        timeline: videoPlan.timeline || []
      } as PlanMejorado;
      
      this.estadisticas.videosProcessados++;
      return planPreservado;
    }

    // Crear plan mejorado con timeline válido
    const planMejorado: PlanMejorado = {
      ...videoPlan,
      timeline: await this.procesarTimelineConMejoras(videoPlan.timeline, videoId, opciones)
    };

    // Actualizar estadísticas
    this.estadisticas.videosProcessados++;
    
    logger.info('✅ Mejoras automáticas aplicadas exitosamente');
    logger.info(`📈 Stats: ${this.estadisticas.videosProcessados} videos, ${this.estadisticas.dialogosMejorados} diálogos, ${this.estadisticas.promptsMejorados} prompts mejorados`);
    
    return planMejorado;
  }

  /**
   * ✅ PROCESAR TIMELINE CON MEJORAS
   */
  private async procesarTimelineConMejoras(timeline: TimelineSecond[], videoId: string, opciones: AudioIntegrationOptions): Promise<SegmentoMejorado[]> {
    const visualStyle = opciones.visualStyle || 'cinematic';
    const timeOfDay = opciones.timeOfDay || this.detectarHoraDia(timeline);
    const location = opciones.location || this.detectarUbicacion(timeline);
    
    return timeline.map((segmento, index) => {
      const segmentoMejorado: SegmentoMejorado = { ...segmento };
      
      // MEJORAR DIÁLOGO/VOZ
      if (segmento.voz || segmento.dialogo) {
        const textoOriginal = segmento.voz || segmento.dialogo || '';
        segmentoMejorado.voz = this.mejorarDialogoAutomatico(
          videoId, index, textoOriginal, {
            duracion: segmento.duracion || 5,
            emocion: (segmento as any).emotion || this.detectarEmocion(textoOriginal),
            personaje: (segmento as any).personaje
          }
        );
        
        if (textoOriginal !== segmentoMejorado.voz) {
          this.estadisticas.dialogosMejorados++;
          logger.info(`  📝 Diálogo ${index + 1} mejorado: "${textoOriginal}" → "${segmentoMejorado.voz}"`);
        }
      }

      // MEJORAR PROMPT VISUAL
      if (segmento.prompt) {
        const promptOriginal = segmento.prompt;
        segmentoMejorado.prompt = this.mejorarPromptAutomatico(
          videoId, index, promptOriginal, {
            visualStyle,
            transicion: index === 0 ? 'cut' : 'fade',
            timeOfDay,
            location
          }
        );
        
        if (promptOriginal !== segmentoMejorado.prompt) {
          this.estadisticas.promptsMejorados++;
          logger.info(`  🎬 Prompt ${index + 1} mejorado: "${promptOriginal}" → "${segmentoMejorado.prompt}"`);
        }
      }

      // OPTIMIZAR CONFIGURACIÓN DE VOZ
      if ((segmento as any).personaje || segmento.voz) {
        const vozOptima = this.seleccionarVozOptima(
          (segmento as any).personaje || 'Narrador',
          (segmento as any).genero || this.detectarGenero(segmento.voz || ''),
          visualStyle
        );
        
        // Agregar configuración de voz optimizada
        segmentoMejorado.vozConfig = vozOptima;
        this.estadisticas.vocesOptimizadas++;
        
        logger.info(`  🎤 Voz ${index + 1} optimizada: ${vozOptima.voiceId} (${vozOptima.provider})`);
      }

      return segmentoMejorado;
    });
  }

  /**
   * ✅ MEJORAR DIÁLOGO AUTOMÁTICAMENTE
   */
  private mejorarDialogoAutomatico(videoId: string, index: number, dialogo: string, opciones: { duracion: number; emocion: string; personaje?: string }): string {
    let dialogoMejorado = dialogo.trim();
    
    // Expandir diálogos muy cortos
    if (dialogoMejorado.length < 15 && opciones.duracion > 3) {
      const expansiones: { [key: string]: string[] } = {
        happy: ['¡Es fantástico!', '¡Increíble!', '¡Genial!'],
        sad: ['Es muy triste', 'Qué pena', 'Es doloroso'],
        dramatic: ['¡Es crucial!', '¡Decisivo!', '¡Importante!'],
        surprised: ['¡No puede ser!', '¡Increíble!', '¡Vaya!'],
        neutral: ['Muy interesante', 'Entiendo', 'Por supuesto'],
        excited: ['¡Emocionante!', '¡Perfecto!', '¡Sí!']
      };
      
      const lista = expansiones[opciones.emocion] || expansiones.neutral;
      const expansion = lista[Math.floor(Math.random() * lista.length)];
      dialogoMejorado = `${dialogoMejorado}. ${expansion}`;
    }
    
    // Recortar diálogos muy largos (máximo 4 palabras por segundo)
    const palabras = dialogoMejorado.split(' ');
    const maxPalabras = Math.max(5, opciones.duracion * 4);
    
    if (palabras.length > maxPalabras) {
      dialogoMejorado = palabras.slice(0, maxPalabras).join(' ') + '...';
    }
    
    // Mejorar transición emocional
    if (index > 0) {
      const cacheKey = `${videoId}_${index - 1}`;
      const dialogoAnterior = this.cache.get(cacheKey);
      
      if (dialogoAnterior && this.necesitaConector(dialogoAnterior, dialogoMejorado)) {
        const conectores = ['Además', 'Por otro lado', 'Entonces', 'Ahora', 'Luego'];
        const conector = conectores[Math.floor(Math.random() * conectores.length)];
        dialogoMejorado = `${conector}, ${dialogoMejorado.toLowerCase()}`;
      }
    }
    
    // Guardar en cache para siguiente segmento
    this.cache.set(`${videoId}_${index}`, dialogoMejorado);
    
    return dialogoMejorado;
  }

  /**
   * ✅ MEJORAR PROMPT AUTOMÁTICAMENTE
   */
  private mejorarPromptAutomatico(videoId: string, index: number, prompt: string, opciones: { visualStyle: string; transicion: string; timeOfDay?: string; location?: string }): string {
    let promptMejorado = prompt.trim();
    
    // Agregar estilo si no está presente
    const estiloLower = opciones.visualStyle.toLowerCase();
    if (!promptMejorado.toLowerCase().includes(estiloLower)) {
      promptMejorado = `${opciones.visualStyle} style, ${promptMejorado}`;
    }
    
    // Agregar transición para segmentos posteriores
    if (index > 0 && opciones.transicion) {
      const transiciones: { [key: string]: string } = {
        cut: 'smooth cut transition,',
        fade: 'gentle fade transition,',
        dissolve: 'beautiful dissolve transition,'
      };
      
      const textoTransicion = transiciones[opciones.transicion] || '';
      promptMejorado = `${textoTransicion} ${promptMejorado}`;
    }
    
    // Agregar contexto temporal si no está presente
    if (opciones.timeOfDay && !this.tieneContextoTemporal(promptMejorado)) {
      promptMejorado = `${promptMejorado}, ${opciones.timeOfDay} lighting`;
    }
    
    // Agregar ubicación si no está presente
    if (opciones.location && !promptMejorado.toLowerCase().includes(opciones.location.toLowerCase())) {
      promptMejorado = `${promptMejorado}, in ${opciones.location}`;
    }
    
    // Mejorar calidad general
    if (!promptMejorado.includes('high quality') && !promptMejorado.includes('professional')) {
      promptMejorado = `${promptMejorado}, high quality, professional cinematography`;
    }
    
    return promptMejorado;
  }

  /**
   * ✅ SELECCIONAR VOZ ÓPTIMA AUTOMÁTICAMENTE
   * Mapea a voces que ya funcionan bien
   */
  private seleccionarVozOptima(personaje: string, genero: string, estilo: string): VozConfig {
    // Mapeo basado en voces exitosas existentes
    const vocesOptimas: { [key: string]: { [key: string]: Omit<VozConfig, 'personaje' | 'optimizada'> } } = {
      cinematic: {
        female: { voiceId: 'spanish_female', provider: 'murf', language: 'es' },
        male: { voiceId: 'spanish_male', provider: 'murf', language: 'es' }
      },
      anime: {
        female: { voiceId: 'anime_girl_voice', provider: 'elevenlabs', language: 'es' },
        male: { voiceId: 'anime_boy_voice', provider: 'elevenlabs', language: 'es' }
      },
      cartoon: {
        female: { voiceId: 'cartoon_female', provider: 'elevenlabs', language: 'es' },
        male: { voiceId: 'cartoon_male', provider: 'elevenlabs', language: 'es' }
      },
      commercial: {
        female: { voiceId: 'en-US-sarah', provider: 'murf', language: 'en' },
        male: { voiceId: 'en-US-mark', provider: 'murf', language: 'en' }
      }
    };
    
    // Seleccionar voz basada en estilo y género
    const estiloConfig = vocesOptimas[estilo] || vocesOptimas.cinematic;
    const vozSeleccionada = estiloConfig[genero] || estiloConfig.female;
    
    return {
      ...vozSeleccionada,
      personaje,
      optimizada: true
    };
  }

  // === FUNCIONES AUXILIARES DE DETECCIÓN ===

  private detectarEmocion(texto: string): string {
    const emociones: { [key: string]: string[] } = {
      happy: ['increíble', 'genial', 'fantástico', 'maravilloso', 'alegría', '!'],
      sad: ['triste', 'dolor', 'pena', 'lamento', 'melancolía'],
      dramatic: ['crucial', 'importante', 'decisivo', 'crítico', 'intense'],
      surprised: ['sorprendente', 'increíble', '!', 'vaya', 'wow'],
      excited: ['emocionante', 'perfecto', 'sí', 'genial', '!!']
    };
    
    const textoLower = texto.toLowerCase();
    
    for (const [emocion, palabras] of Object.entries(emociones)) {
      if (palabras.some(palabra => textoLower.includes(palabra))) {
        return emocion;
      }
    }
    
    return 'neutral';
  }

  private detectarGenero(texto: string): string {
    // Detección simple basada en contenido
    const masculino = ['él', 'hombre', 'chico', 'padre', 'señor'];
    const femenino = ['ella', 'mujer', 'chica', 'madre', 'señora'];
    
    const textoLower = texto.toLowerCase();
    const scoreM = masculino.filter(p => textoLower.includes(p)).length;
    const scoreF = femenino.filter(p => textoLower.includes(p)).length;
    
    return scoreF > scoreM ? 'female' : 'male';
  }

  private detectarHoraDia(timeline: TimelineSecond[]): string {
    const textoCompleto = timeline.map(s => (s.prompt || '') + ' ' + (s.voz || (s as any).dialogo || '')).join(' ').toLowerCase();
    
    if (textoCompleto.includes('noche') || textoCompleto.includes('dark')) return 'night';
    if (textoCompleto.includes('mañana') || textoCompleto.includes('dawn')) return 'morning';
    if (textoCompleto.includes('tarde') || textoCompleto.includes('sunset')) return 'afternoon';
    if (textoCompleto.includes('mediodía') || textoCompleto.includes('noon')) return 'noon';
    
    return 'day'; // Por defecto
  }

  private detectarUbicacion(timeline: TimelineSecond[]): string {
    const textoCompleto = timeline.map(s => (s.prompt || '') + ' ' + (s.voz || (s as any).dialogo || '')).join(' ').toLowerCase();
    
    if (textoCompleto.includes('casa') || textoCompleto.includes('home')) return 'house';
    if (textoCompleto.includes('bosque') || textoCompleto.includes('forest')) return 'forest';
    if (textoCompleto.includes('ciudad') || textoCompleto.includes('city')) return 'city';
    if (textoCompleto.includes('playa') || textoCompleto.includes('beach')) return 'beach';
    if (textoCompleto.includes('montaña') || textoCompleto.includes('mountain')) return 'mountain';
    
    return 'outdoor'; // Por defecto
  }

  private necesitaConector(dialogoAnterior: string, dialogoActual: string): boolean {
    // Evitar repetir palabras clave
    const palabrasAnteriores = dialogoAnterior.toLowerCase().split(' ').filter(p => p.length > 4);
    const palabrasActuales = dialogoActual.toLowerCase().split(' ').filter(p => p.length > 4);
    
    const repeticiones = palabrasActuales.filter(p => palabrasAnteriores.includes(p));
    return repeticiones.length > 1; // Si hay muchas repeticiones
  }

  private tieneContextoTemporal(prompt: string): boolean {
    const indicadores = ['morning', 'night', 'day', 'evening', 'dawn', 'dusk', 'noon', 'mañana', 'noche', 'día', 'tarde'];
    return indicadores.some(ind => prompt.toLowerCase().includes(ind));
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS
   */
  obtenerEstadisticas() {
    return {
      ...this.estadisticas,
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ✅ LIMPIAR CACHE
   */
  limpiarCache(videoId?: string | null): void {
    if (videoId) {
      for (const [key] of this.cache) {
        if (key.startsWith(videoId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Instancia singleton para usar en toda la aplicación
export const coherenciaAutomatica = new CoherenciaAutomatica();
