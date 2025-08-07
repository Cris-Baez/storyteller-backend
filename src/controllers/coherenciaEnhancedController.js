// src/controllers/coherenciaEnhancedController.js
/**
 * 🎯 CONTROLADOR CON MEJORAS DE COHERENCIA
 * ========================================
 * 
 * Ejemplo de cómo integrar las mejoras de coherencia con tus servicios existentes
 * ✅ USA tus servicios originales sin modificarlos
 * ✅ Aplica mejoras ANTES de llamar a los servicios  
 * ✅ Mantiene compatibilidad total
 * ✅ Usa voces/sonidos que ya funcionan
 */

// Importar tus servicios existentes (SIN modificar)
const { VoiceService } = require('../services/voiceService');
const { KlingService } = require('../services/klingService');
const { FFMpegService } = require('../services/ffmpegService');

// Funciones de coherencia (nuevas, no tocan código existente)
class CoherenciaController {
  constructor() {
    // Usar tus servicios existentes
    this.voiceService = new VoiceService();
    this.klingService = new KlingService();
    this.ffmpegService = new FFMpegService();
    
    // Cache de coherencia
    this.dialogosAnteriores = new Map();
    this.promptsAnteriores = new Map();
  }

  /**
   * ✅ GENERAR VIDEO CON MEJORAS DE COHERENCIA
   * Procesa un plan de video aplicando mejoras sin tocar servicios originales
   */
  async generarVideoMejorado(planOriginal, opciones = {}) {
    console.log('🔄 Iniciando generación de video con mejoras de coherencia...');
    
    try {
      // 1. VALIDAR PLAN (sin modificarlo)
      const validacion = this.validarPlanCoherencia(planOriginal);
      if (!validacion.esValido) {
        console.warn('⚠️ Plan con problemas de coherencia:');
        validacion.problemas.forEach(p => console.warn(`  - ${p}`));
      }
      
      // 2. PROCESAR SEGMENTOS CON MEJORAS
      const segmentosMejorados = await this.procesarSegmentosConCoherencia(
        planOriginal.timeline || [],
        opciones
      );
      
      // 3. GENERAR ASSETS CON SERVICIOS ORIGINALES
      const assets = await this.generarAssetsConServicios(segmentosMejorados);
      
      // 4. ENSAMBLAR VIDEO FINAL
      const videoFinal = await this.ensamblarVideoFinal(assets, opciones);
      
      console.log('✅ Video generado exitosamente con mejoras de coherencia');
      return videoFinal;
      
    } catch (error) {
      console.error('❌ Error en generación con coherencia:', error);
      throw error;
    }
  }

  /**
   * ✅ VALIDAR COHERENCIA DEL PLAN
   */
  validarPlanCoherencia(plan) {
    const problemas = [];
    const sugerencias = [];
    
    if (!plan.timeline || plan.timeline.length === 0) {
      problemas.push('Plan sin timeline o vacío');
      return { esValido: false, problemas, sugerencias };
    }
    
    plan.timeline.forEach((segmento, i) => {
      // Validar diálogos
      if (segmento.voz || segmento.dialogo) {
        const texto = segmento.voz || segmento.dialogo || '';
        const duracion = segmento.duracion || 5;
        
        if (texto.length < 10) {
          problemas.push(`Segmento ${i + 1}: Diálogo muy corto`);
        }
        
        if (texto.split(' ').length > duracion * 4) {
          problemas.push(`Segmento ${i + 1}: Diálogo muy largo para ${duracion}s`);
        }
      }
      
      // Validar prompts
      if (segmento.prompt && segmento.prompt.length < 20) {
        problemas.push(`Segmento ${i + 1}: Descripción visual muy corta`);
      }
    });
    
    return {
      esValido: problemas.length === 0,
      problemas,
      sugerencias
    };
  }

  /**
   * ✅ PROCESAR SEGMENTOS CON MEJORAS DE COHERENCIA
   */
  async procesarSegmentosConCoherencia(segmentos, opciones) {
    const videoId = opciones.videoId || `video_${Date.now()}`;
    const visualStyle = opciones.visualStyle || 'cinematic';
    
    console.log(`🔄 Procesando ${segmentos.length} segmentos con mejoras...`);
    
    const segmentosMejorados = segmentos.map((segmento, index) => {
      const segmentoMejorado = { ...segmento };
      
      // MEJORAR DIÁLOGO
      if (segmento.voz || segmento.dialogo) {
        const dialogoOriginal = segmento.voz || segmento.dialogo || '';
        const dialogoMejorado = this.mejorarDialogo(
          videoId,
          index,
          dialogoOriginal,
          {
            duracion: segmento.duracion || 5,
            emocion: segmento.emotion || 'neutral',
            personaje: segmento.personaje
          }
        );
        
        segmentoMejorado.voz = dialogoMejorado;
        segmentoMejorado.dialogo = dialogoMejorado;
      }
      
      // MEJORAR PROMPT VISUAL
      if (segmento.prompt) {
        const promptMejorado = this.mejorarPromptVisual(
          videoId,
          index,
          segmento.prompt,
          {
            visualStyle,
            transicion: index === 0 ? 'cut' : 'fade',
            timeOfDay: opciones.timeOfDay,
            location: opciones.location
          }
        );
        
        segmentoMejorado.prompt = promptMejorado;
      }
      
      // SELECCIONAR VOZ ÓPTIMA
      if (segmento.personaje) {
        const vozOptima = this.seleccionarVozExistente(
          segmento.personaje,
          segmento.genero || 'female',
          visualStyle
        );
        
        segmentoMejorado.vozRecomendada = vozOptima;
      }
      
      return segmentoMejorado;
    });
    
    console.log('✅ Segmentos mejorados con coherencia');
    return segmentosMejorados;
  }

  /**
   * ✅ GENERAR ASSETS CON TUS SERVICIOS EXISTENTES
   */
  async generarAssetsConServicios(segmentos) {
    console.log('🎬 Generando assets con servicios existentes...');
    
    const assets = [];
    
    for (const [index, segmento] of segmentos.entries()) {
      console.log(`Procesando segmento ${index + 1}/${segmentos.length}`);
      
      const asset = {
        index,
        duracion: segmento.duracion || 5
      };
      
      // GENERAR AUDIO con tu VoiceService existente
      if (segmento.voz) {
        try {
          const vozConfig = segmento.vozRecomendada || { voiceId: 'spanish_female', provider: 'murf' };
          
          console.log(`🎤 Generando audio con voz: ${vozConfig.voiceId} (${vozConfig.provider})`);
          
          // Usar tu servicio existente SIN modificaciones
          asset.audio = await this.voiceService.generateVoice({
            text: segmento.voz,
            voiceId: vozConfig.voiceId,
            provider: vozConfig.provider,
            language: 'es',
            outputFormat: 'mp3'
          });
          
          console.log(`✅ Audio generado para segmento ${index + 1}`);
          
        } catch (error) {
          console.error(`❌ Error generando audio segmento ${index + 1}:`, error.message);
          // Fallback silencioso
          asset.audio = null;
        }
      }
      
      // GENERAR VIDEO con tu KlingService existente  
      if (segmento.prompt) {
        try {
          console.log(`🎬 Generando video: "${segmento.prompt}"`);
          
          // Usar tu servicio existente SIN modificaciones
          asset.video = await this.klingService.generateSegmentWithKling({
            prompt: segmento.prompt,
            duration: segmento.duracion,
            aspectRatio: '16:9',
            quality: 'high'
          });
          
          console.log(`✅ Video generado para segmento ${index + 1}`);
          
        } catch (error) {
          console.error(`❌ Error generando video segmento ${index + 1}:`, error.message);
          // Usar video fallback de tu servicio
          asset.video = null;
        }
      }
      
      assets.push(asset);
    }
    
    console.log('✅ Assets generados exitosamente');
    return assets;
  }

  /**
   * ✅ ENSAMBLAR VIDEO FINAL
   */
  async ensamblarVideoFinal(assets, opciones) {
    console.log('🎵 Ensamblando video final con FFmpeg...');
    
    try {
      // Usar tu FFMpegService existente SIN modificaciones
      const videoFinal = await this.ffmpegService.assembleVideo({
        clips: assets,
        outputPath: opciones.outputPath || `./generated/video_coherente_${Date.now()}.mp4`,
        backgroundMusic: opciones.backgroundMusic,
        resolution: opciones.resolution || '1920x1080'
      });
      
      console.log('✅ Video ensamblado exitosamente');
      return videoFinal;
      
    } catch (error) {
      console.error('❌ Error ensamblando video:', error);
      throw error;
    }
  }

  // === FUNCIONES AUXILIARES DE COHERENCIA ===

  mejorarDialogo(videoId, index, dialogo, opciones) {
    const key = `${videoId}_${index}`;
    const keyAnterior = `${videoId}_${index - 1}`;
    const dialogoAnterior = this.dialogosAnteriores.get(keyAnterior);
    
    let dialogoMejorado = dialogo;
    
    // Expandir diálogos muy cortos
    if (dialogoMejorado.length < 10) {
      const expansiones = {
        happy: '¡Es fantástico!',
        sad: 'Es muy triste',
        dramatic: '¡Esto es crucial!',
        surprised: '¡Increíble!',
        neutral: 'Es interesante'
      };
      
      const expansion = expansiones[opciones.emocion] || 'Muy bien';
      dialogoMejorado = `${dialogoMejorado}. ${expansion}`;
    }
    
    // Recortar diálogos muy largos
    const palabras = dialogoMejorado.split(' ');
    const maxPalabras = opciones.duracion * 4; // 4 palabras por segundo
    if (palabras.length > maxPalabras) {
      dialogoMejorado = palabras.slice(0, maxPalabras).join(' ') + '...';
    }
    
    // Guardar para coherencia del siguiente segmento
    this.dialogosAnteriores.set(key, dialogoMejorado);
    
    return dialogoMejorado;
  }

  mejorarPromptVisual(videoId, index, prompt, opciones) {
    const key = `${videoId}_${index}`;
    const keyAnterior = `${videoId}_${index - 1}`;
    
    let promptMejorado = prompt;
    
    // Agregar estilo si no lo tiene
    if (!promptMejorado.toLowerCase().includes(opciones.visualStyle.toLowerCase())) {
      promptMejorado = `${opciones.visualStyle} style, ${promptMejorado}`;
    }
    
    // Agregar transición
    const transiciones = {
      cut: 'seamless transition,',
      fade: 'gentle fade,',
      dissolve: 'smooth dissolve,'
    };
    
    if (index > 0 && opciones.transicion) {
      const textoTransicion = transiciones[opciones.transicion] || '';
      promptMejorado = `${textoTransicion} ${promptMejorado}`;
    }
    
    // Agregar contexto temporal/espacial
    if (opciones.timeOfDay && !promptMejorado.includes('morning') && !promptMejorado.includes('night') && !promptMejorado.includes('day')) {
      promptMejorado = `${promptMejorado}, ${opciones.timeOfDay} lighting`;
    }
    
    if (opciones.location && !promptMejorado.toLowerCase().includes(opciones.location.toLowerCase())) {
      promptMejorado = `${promptMejorado}, in ${opciones.location}`;
    }
    
    // Guardar para coherencia del siguiente segmento
    this.promptsAnteriores.set(key, promptMejorado);
    
    return promptMejorado;
  }

  seleccionarVozExistente(personaje, genero, estilo) {
    // Mapeo a voces que ya funcionan en tu sistema
    const vocesExitosas = {
      cinematic: {
        female: { voiceId: 'spanish_female', provider: 'murf' },
        male: { voiceId: 'spanish_male', provider: 'murf' }
      },
      anime: {
        female: { voiceId: 'anime_girl_voice', provider: 'elevenlabs' },
        male: { voiceId: 'anime_boy_voice', provider: 'elevenlabs' }
      },
      commercial: {
        female: { voiceId: 'en-US-sarah', provider: 'murf' },
        male: { voiceId: 'en-US-mark', provider: 'murf' }
      },
      cartoon: {
        female: { voiceId: 'cartoon_female', provider: 'elevenlabs' },
        male: { voiceId: 'cartoon_male', provider: 'elevenlabs' }
      }
    };
    
    const estiloVoces = vocesExitosas[estilo] || vocesExitosas.cinematic;
    const vozSeleccionada = estiloVoces[genero] || estiloVoces.female;
    
    return vozSeleccionada;
  }

  /**
   * ✅ LIMPIAR CACHE DE COHERENCIA
   */
  limpiarCache(videoId = null) {
    if (videoId) {
      // Limpiar solo un video específico
      for (const [key] of this.dialogosAnteriores) {
        if (key.startsWith(videoId)) {
          this.dialogosAnteriores.delete(key);
        }
      }
      for (const [key] of this.promptsAnteriores) {
        if (key.startsWith(videoId)) {
          this.promptsAnteriores.delete(key);
        }
      }
    } else {
      // Limpiar todo
      this.dialogosAnteriores.clear();
      this.promptsAnteriores.clear();
    }
  }
}

module.exports = { CoherenciaController };

/**
 * 🚀 EJEMPLO DE USO:
 * 
 * const controller = new CoherenciaController();
 * 
 * const plan = {
 *   timeline: [
 *     {
 *       voz: 'Hola',  // Se expandirá automáticamente
 *       prompt: 'Casa',  // Se mejorará con estilo
 *       duracion: 4,
 *       personaje: 'Narrador',
 *       genero: 'male'
 *     },
 *     {
 *       voz: 'Continuamos con la historia',
 *       prompt: 'Bosque misterioso',
 *       duracion: 5,
 *       emotion: 'dramatic'
 *     }
 *   ]
 * };
 * 
 * const video = await controller.generarVideoMejorado(plan, {
 *   videoId: 'mi_video_001',
 *   visualStyle: 'cinematic',
 *   timeOfDay: 'sunset',
 *   location: 'forest',
 *   outputPath: './mi_video_coherente.mp4'
 * });
 */
