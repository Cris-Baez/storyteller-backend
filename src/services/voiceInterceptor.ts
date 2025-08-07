// src/services/voiceInterceptor.ts
/**
 * 🎤 INTERCEPTOR DE VOCES CON MEJORAS AUTOMÁTICAS
 * ==============================================
 * 
 * Intercepta llamadas al voiceService y aplica mejoras automáticamente
 * ✅ Usa configuraciones de voz optimizadas del sistema de coherencia
 * ✅ Mantiene compatibilidad total con voiceService existente
 * ✅ Se integra transparentemente
 */

import { createVoiceBuffer, pickVoiceId } from './voiceService.js';
import { logger } from '../utils/logger.js';

interface VozConfig {
  voiceId: string;
  provider: 'murf' | 'elevenlabs';
  language: string;
  personaje?: string;
  optimizada: boolean;
}

interface SolicitudVoz {
  text: string;
  voiceId?: string;
  provider?: string;
  language?: string;
  outputFormat?: string;
  speed?: number;
}

class VoiceInterceptor {
  private mejorAsAplicadas = 0;

  constructor() {
    logger.info('🎤 Voice Interceptor inicializado');
  }

  /**
   * ✅ GENERAR VOZ CON MEJORAS AUTOMÁTICAS
   * Intercepta llamadas y aplica configuración óptima
   */
  async generateVoiceConMejoras(solicitud: SolicitudVoz, vozConfig?: VozConfig | null): Promise<any> {
    logger.info(`🎤 Interceptando generación de voz: "${solicitud.text?.substring(0, 50)}..."`);
    
    // Usar configuración optimizada si está disponible
    if (vozConfig && vozConfig.optimizada) {
      logger.info(`✅ Usando configuración optimizada: ${vozConfig.voiceId} (${vozConfig.provider})`);
      
      this.mejorAsAplicadas++;
      
      try {
        // Crear un plan temporal para usar createVoiceBuffer
        const planTemporal = {
          timeline: [{
            voz: solicitud.text,
            duracion: 5,
            personaje: vozConfig.personaje || 'Narrator',
            // Agregar configuración de voz optimizada
            voiceId: vozConfig.voiceId,
            provider: vozConfig.provider,
            language: vozConfig.language
          }]
        };
        
        const resultado = await createVoiceBuffer(planTemporal as any);
        logger.info(`✅ Voz generada exitosamente con configuración optimizada`);
        return resultado;
        
      } catch (error: any) {
        logger.warn(`⚠️ Error con voz optimizada, usando fallback:`, error.message);
        
        // Fallback usando createVoiceBuffer con configuración básica
        const planFallback = {
          timeline: [{
            voz: solicitud.text,
            duracion: 5,
            personaje: 'Narrator'
          }]
        };
        
        return await createVoiceBuffer(planFallback as any);
      }
      
    } else {
      // Usar método original sin modificaciones
      logger.info(`🔄 Usando configuración original del servicio`);
      
      const planOriginal = {
        timeline: [{
          voz: solicitud.text,
          duracion: 5,
          personaje: 'Narrator'
        }]
      };
      
      return await createVoiceBuffer(planOriginal as any);
    }
  }

  /**
   * ✅ PROCESAR MÚLTIPLES VOCES CON MEJORAS
   * Para procesar timeline completo
   */
  async generarVocesParaTimeline(timeline: any[], opciones: any = {}): Promise<{
    resultados: any[];
    estadisticas: {
      total: number;
      exitosos: number;
      fallidos: number;
      mejorAsAplicadas: number;
    };
  }> {
    logger.info(`🎤 Procesando ${timeline.length} voces del timeline con mejoras`);
    
    const resultados: any[] = [];
    
    for (let i = 0; i < timeline.length; i++) {
      const segmento = timeline[i];
      
      if (segmento.voz || segmento.dialogo) {
        const texto = segmento.voz || segmento.dialogo;
        
        logger.info(`\n--- Procesando voz ${i + 1}/${timeline.length} ---`);
        logger.info(`Texto: "${texto}"`);
        
        // Solicitud básica
        const solicitudVoz: SolicitudVoz = {
          text: texto,
          language: opciones.language || 'es',
          outputFormat: opciones.outputFormat || 'mp3',
          speed: opciones.speed || 1.0
        };
        
        // Usar configuración optimizada si está disponible
        const vozConfig = segmento.vozConfig || null;
        
        try {
          const audioGenerado = await this.generateVoiceConMejoras(solicitudVoz, vozConfig);
          
          resultados.push({
            index: i,
            audio: audioGenerado,
            texto: texto,
            duracion: segmento.duracion || 5,
            vozUsada: vozConfig ? `${vozConfig.voiceId} (${vozConfig.provider})` : 'default',
            exitoso: true
          });
          
        } catch (error: any) {
          logger.error(`❌ Error generando voz para segmento ${i + 1}:`, error.message);
          
          resultados.push({
            index: i,
            audio: null,
            texto: texto,
            duracion: segmento.duracion || 5,
            vozUsada: 'error',
            exitoso: false,
            error: error.message
          });
        }
      }
    }
    
    const exitosos = resultados.filter(r => r.exitoso).length;
    const fallidos = resultados.length - exitosos;
    
    logger.info(`\n✅ Resumen generación de voces:`);
    logger.info(`   Exitosos: ${exitosos}/${resultados.length}`);
    logger.info(`   Fallidos: ${fallidos}/${resultados.length}`);
    logger.info(`   Mejoras aplicadas: ${this.mejorAsAplicadas}`);
    
    return {
      resultados,
      estadisticas: {
        total: resultados.length,
        exitosos,
        fallidos,
        mejorAsAplicadas: this.mejorAsAplicadas
      }
    };
  }

  /**
   * ✅ ESTADÍSTICAS DEL INTERCEPTOR
   */
  obtenerEstadisticas() {
    return {
      mejorAsAplicadas: this.mejorAsAplicadas,
      tipoServicio: 'VoiceInterceptor',
      timestamp: new Date().toISOString()
    };
  }
}

// Instancia singleton
export const voiceInterceptor = new VoiceInterceptor();
