// elevenlabsFXService.ts - Servicio para generar efectos de sonido usando ElevenLabs FX
// Se integra con el sistema de audio existente y guarda en CDN

import { logger } from '../utils/logger.js';
import { uploadToCDN } from './cdnService.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ElevenLabsFXConfig {
  apiKey: string;
  baseUrl: string;
}

interface SoundEffectRequest {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

interface GeneratedSoundEffect {
  audio: Buffer;
  cdnUrl?: string;
  localPath?: string;
  historyItemId: string;
  metadata: {
    text: string;
    duration: number;
    generatedAt: string;
    prompt: string;
  };
}

class ElevenLabsFXService {
  private config: ElevenLabsFXConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      baseUrl: 'https://api.elevenlabs.io/v1'
    };

    if (!this.config.apiKey) {
      logger.warn('[ElevenLabsFX] ⚠️ ELEVENLABS_API_KEY no encontrada. Los efectos FX no estarán disponibles.');
    }
  }

  /**
   * Verifica si ElevenLabs FX está disponible
   */
  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Genera un efecto de sonido usando ElevenLabs FX y lo guarda en CDN
   */
  async generateSoundEffect(
    request: SoundEffectRequest, 
    saveTocdn: boolean = true,
    videoId?: string
  ): Promise<GeneratedSoundEffect | null> {
    if (!this.isAvailable()) {
      logger.warn('[ElevenLabsFX] Servicio no disponible, retornando null');
      return null;
    }

    try {
      logger.info(`[ElevenLabsFX] 🎵 Generando efecto: "${request.text}"`);
      
      const response = await fetch(`${this.config.baseUrl}/sound-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text: request.text,
          duration_seconds: request.duration_seconds || 5,
          prompt_influence: request.prompt_influence || 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[ElevenLabsFX] Error HTTP ${response.status}: ${errorText}`);
        return null;
      }

      // El audio viene como stream de bytes
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      let cdnUrl: string | undefined;
      let localPath: string | undefined;
      
      // Guardar en CDN si está habilitado
      if (saveTocdn && audioBuffer.length > 0) {
        try {
          // Crear archivo temporal
          const tempFileName = `fx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
          const tempPath = path.join(process.cwd(), 'tmp', tempFileName);
          
          // Asegurar que el directorio tmp existe
          await fs.mkdir(path.dirname(tempPath), { recursive: true });
          
          // Escribir el audio al archivo temporal
          await fs.writeFile(tempPath, audioBuffer);
          localPath = tempPath;
          
          // Subir al CDN
          const cdnPath = `audio/fx/${videoId || 'general'}/${tempFileName}`;
          cdnUrl = await uploadToCDN(tempPath, cdnPath, {
            type: 'sound_effect',
            prompt: request.text,
            service: 'elevenlabs',
            duration: request.duration_seconds || 5
          });
          
          logger.info(`[ElevenLabsFX] ✅ Efecto guardado en CDN: ${cdnUrl}`);
          
        } catch (cdnError) {
          logger.warn(`[ElevenLabsFX] Error guardando en CDN: ${cdnError}, continuando sin CDN`);
        }
      }
      
      logger.info(`[ElevenLabsFX] ✅ Efecto generado exitosamente (${audioBuffer.length} bytes)`);
      
      return {
        audio: audioBuffer,
        cdnUrl,
        localPath,
        historyItemId: `fx_${Date.now()}`,
        metadata: {
          text: request.text,
          duration: request.duration_seconds || 5,
          generatedAt: new Date().toISOString(),
          prompt: request.text
        }
      };

    } catch (error) {
      logger.error('[ElevenLabsFX] Error generando efecto:', error);
      return null;
    }
  }

  /**
   * Mapea efectos según el estilo visual del video
   */
  mapearEfectosPorEstilo(estilo: string, momento: string): string[] {
    const efectosPorEstilo: Record<string, Record<string, string[]>> = {
      'anime': {
        'setup': ['magical sparkles', 'energy charging up', 'dramatic wind'],
        'desarrollo': ['sword clash', 'explosion', 'running footsteps'],
        'climax': ['powerful energy blast', 'epic music swell', 'dramatic silence'],
        'cierre': ['gentle wind', 'peaceful ambience', 'hopeful melody']
      },
      'cartoon': {
        'setup': ['playful bounce', 'cartoon whoosh', 'happy chime'],
        'desarrollo': ['silly boing', 'cartoon slide whistle', 'funny pop'],
        'climax': ['cartoon explosion', 'victory fanfare', 'magical ding'],
        'cierre': ['gentle lullaby', 'soft giggle', 'peaceful birds']
      },
      'cinematic': {
        'setup': ['atmospheric tension', 'subtle drone', 'distant thunder'],
        'desarrollo': ['building suspense', 'heartbeat rhythm', 'mechanical hum'],
        'climax': ['epic orchestral hit', 'dramatic crescendo', 'powerful impact'],
        'cierre': ['peaceful resolution', 'gentle strings', 'soft piano fade']
      },
      'commercial': {
        'setup': ['professional chime', 'corporate logo sound', 'clean notification'],
        'desarrollo': ['product showcase', 'technology beep', 'positive feedback'],
        'climax': ['success notification', 'achievement sound', 'confident tone'],
        'cierre': ['brand signature', 'professional outro', 'call to action chime']
      },
      'narrativa': {
        'setup': ['documentary intro', 'nature ambience', 'thoughtful pause'],
        'desarrollo': ['page turn', 'soft wind', 'contemplative tone'],
        'climax': ['revelation moment', 'understanding chime', 'enlightenment sound'],
        'cierre': ['wise conclusion', 'book closing', 'thoughtful silence']
      },
      'noticias': {
        'setup': ['news intro', 'professional alert', 'broadcast chime'],
        'desarrollo': ['information tone', 'data point', 'factual beep'],
        'climax': ['breaking news', 'urgent alert', 'important announcement'],
        'cierre': ['news outro', 'professional closing', 'broadcast end']
      }
    };

    return efectosPorEstilo[estilo]?.[momento] || ['gentle ambient sound'];
  }

  /**
   * Genera prompts específicos para efectos de sonido basados en una toma
   */
  private generarPromptDeToma(toma: any, estilo?: string): string {
    let prompt = '';
    
    // Análisis del tipo de toma y contenido
    const tipoToma = toma.tipo_toma?.toLowerCase() || '';
    const descripcion = toma.descripcion?.toLowerCase() || '';
    const dialogo = toma.dialogo?.toLowerCase() || '';
    const emocion = toma.emocion?.toLowerCase() || '';
    
    // Detectar ambientes y situaciones
    if (descripcion.includes('exterior') || descripcion.includes('fuera') || descripcion.includes('calle')) {
      prompt = 'outdoor ambient sounds, subtle wind, distant traffic';
    } else if (descripcion.includes('interior') || descripcion.includes('dentro') || descripcion.includes('casa')) {
      prompt = 'indoor ambient sounds, subtle room tone';
    }
    
    // Detectar acciones específicas
    if (descripcion.includes('puerta') && (descripcion.includes('abre') || descripcion.includes('cierra'))) {
      prompt = 'door opening and closing sound';
    } else if (descripcion.includes('pasos') || descripcion.includes('camina') || descripcion.includes('corriendo')) {
      prompt = 'footsteps on hard surface';
    } else if (descripcion.includes('lluvia')) {
      prompt = 'gentle rain sounds';
    } else if (descripcion.includes('viento')) {
      prompt = 'wind blowing through trees';
    } else if (descripcion.includes('explosión') || descripcion.includes('explota')) {
      prompt = 'dramatic explosion sound effect';
    } else if (descripcion.includes('teléfono') || descripcion.includes('ring')) {
      prompt = 'old telephone ringing';
    }
    
    // Efectos basados en emociones
    if (emocion.includes('tensión') || emocion.includes('suspense')) {
      prompt += ', suspenseful atmosphere, subtle tension';
    } else if (emocion.includes('miedo') || emocion.includes('terror')) {
      prompt += ', eerie ambient, subtle horror atmosphere';
    } else if (emocion.includes('alegría') || emocion.includes('feliz')) {
      prompt += ', light cheerful ambient';
    }
    
    // Ajustar por estilo visual
    if (estilo) {
      switch (estilo.toLowerCase()) {
        case 'anime':
          prompt += ', anime-style sound design';
          break;
        case 'cartoon':
          prompt += ', cartoonish sound effects';
          break;
        case 'cinematic':
          prompt += ', cinematic quality sound';
          break;
        case 'commercial':
          prompt += ', professional commercial sound';
          break;
        case 'narrativa':
        case 'documental':
          prompt += ', documentary-style ambient sound';
          break;
        case 'noticias':
        case 'presentacion':
        case 'actor-directo':
          prompt += ', professional broadcast sound';
          break;
      }
    }
    
    // Si no se detectó nada específico, usar prompt genérico
    if (!prompt) {
      prompt = 'subtle ambient background sound';
    }
    
    return prompt.trim();
  }

  /**
   * Genera efectos de sonido específicos para una toma completa
   */
  async generarEfectosDeToma(
    toma: any, 
    estilo: string,
    videoId?: string,
    duracion: number = 5
  ): Promise<GeneratedSoundEffect[]> {
    const efectos: GeneratedSoundEffect[] = [];
    
    try {
      // Generar prompt principal basado en la toma
      const promptPrincipal = this.generarPromptDeToma(toma, estilo);
      
      logger.info(`[ElevenLabsFX] 🎬 Generando efectos para toma: "${promptPrincipal}"`);
      
      // Generar el efecto principal
      const efectoPrincipal = await this.generateSoundEffect({
        text: promptPrincipal,
        duration_seconds: duracion,
        prompt_influence: 0.4
      }, true, videoId);
      
      if (efectoPrincipal) {
        efectos.push(efectoPrincipal);
      }
      
      // Generar efectos adicionales si es necesario
      const descripcion = toma.descripcion?.toLowerCase() || '';
      
      // Efecto adicional para escenas con múltiples elementos
      if (descripcion.includes('lluvia') && (descripcion.includes('trueno') || descripcion.includes('tormenta'))) {
        const efectoTrueno = await this.generateSoundEffect({
          text: 'distant thunder sound',
          duration_seconds: 3,
          prompt_influence: 0.3
        }, true, videoId);
        
        if (efectoTrueno) {
          efectos.push(efectoTrueno);
        }
      }
      
    } catch (error) {
      logger.error('[ElevenLabsFX] Error generando efectos de toma:', error);
    }
    
    return efectos;
  }

  /**
   * Genera efectos de sonido para una toma específica
   */
  async generateEffectsForToma(
    toma: any, 
    estiloVisual: string, 
    momentoNarrativo: string
  ): Promise<Buffer[]> {
    if (!this.isAvailable()) {
      logger.info('[ElevenLabsFX] Servicio no disponible, retornando array vacío');
      return [];
    }

    try {
      // Obtener efectos apropiados para el estilo y momento
      const efectosSugeridos = this.mapearEfectosPorEstilo(estiloVisual, momentoNarrativo);
      
      // Seleccionar efecto basado en la emoción o descripción de la toma
      let efectoSeleccionado = efectosSugeridos[0]; // default
      
      if (toma.efectosSonoros && typeof toma.efectosSonoros === 'string') {
        // Si la toma tiene efectos específicos, intentar mapearlos
        const efectosToma = toma.efectosSonoros.toLowerCase();
        if (efectosToma.includes('explosion')) efectoSeleccionado = 'powerful explosion';
        else if (efectosToma.includes('wind')) efectoSeleccionado = 'gentle wind';
        else if (efectosToma.includes('water')) efectoSeleccionado = 'flowing water';
        else if (efectosToma.includes('fire')) efectoSeleccionado = 'crackling fire';
        else if (efectosToma.includes('magic')) efectoSeleccionado = 'magical sparkles';
      }

      logger.info(`[ElevenLabsFX] Generando efecto "${efectoSeleccionado}" para toma ${toma.numero}`);

      const soundEffect = await this.generateSoundEffect({
        text: efectoSeleccionado,
        duration_seconds: Math.min(toma.duracion || 5, 10), // Max 10s por efecto
        prompt_influence: 0.5
      });

      if (soundEffect) {
        return [soundEffect.audio];
      } else {
        logger.warn(`[ElevenLabsFX] No se pudo generar efecto para toma ${toma.numero}`);
        return [];
      }

    } catch (error) {
      logger.error(`[ElevenLabsFX] Error generando efectos para toma ${toma.numero}:`, error);
      return [];
    }
  }

  /**
   * Genera un batch de efectos para múltiples tomas
   */
  async generateBatchEffects(
    tomas: any[],
    estiloVisual: string
  ): Promise<{ [tomaIndex: number]: Buffer[] }> {
    if (!this.isAvailable()) {
      logger.info('[ElevenLabsFX] Servicio no disponible, retornando objeto vacío');
      return {};
    }

    const efectosPorToma: { [tomaIndex: number]: Buffer[] } = {};
    const totalTomas = tomas.length;

    logger.info(`[ElevenLabsFX] 🎬 Generando efectos para ${totalTomas} tomas (estilo: ${estiloVisual})`);

    for (let i = 0; i < tomas.length; i++) {
      const toma = tomas[i];
      
      // Determinar momento narrativo según posición
      let momentoNarrativo: string;
      if (i === 0) momentoNarrativo = 'setup';
      else if (i === totalTomas - 1) momentoNarrativo = 'cierre';
      else if (i > totalTomas * 0.7) momentoNarrativo = 'climax';
      else momentoNarrativo = 'desarrollo';

      // Generar efectos para esta toma
      const efectos = await this.generateEffectsForToma(toma, estiloVisual, momentoNarrativo);
      efectosPorToma[i] = efectos;

      // Pequeña pausa entre requests para evitar rate limiting
      if (i < tomas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalEfectos = Object.values(efectosPorToma).reduce((acc, arr) => acc + arr.length, 0);
    logger.info(`[ElevenLabsFX] ✅ Generados ${totalEfectos} efectos para ${totalTomas} tomas`);

    return efectosPorToma;
  }
}

// Exportar la clase y la instancia
export { ElevenLabsFXService };
export const elevenlabsFXService = new ElevenLabsFXService();

// Funciones de conveniencia para integración
export async function generateFXForVideo(tomas: any[], estiloVisual: string): Promise<Buffer[]> {
  const efectosPorToma = await elevenlabsFXService.generateBatchEffects(tomas, estiloVisual);
  
  // Combinar todos los efectos en un array plano
  const todosLosEfectos: Buffer[] = [];
  Object.values(efectosPorToma).forEach(efectos => {
    todosLosEfectos.push(...efectos);
  });
  
  return todosLosEfectos;
}

export function isElevenLabsFXAvailable(): boolean {
  return elevenlabsFXService.isAvailable();
}
