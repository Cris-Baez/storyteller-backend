import { PrismaClient, MarketingConfig, $Enums } from '../../generated/prisma/index.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface MarketingConfigData {
  // INFORMACIÓN DEL NEGOCIO  
  businessType?: string;
  
  // PREFERENCIAS DE ESTILO
  style?: string;
  colors?: string; // JSON string de array de colores hex
  
  // PREFERENCIAS DE VOZ Y AUDIO
  voiceType?: string;
  musicStyle?: string;
  
  // CONFIGURACIÓN DE CONTENIDO
  frequency?: string;
  tone?: string;
  
  // NOTA: Otros campos como businessName, targetAudience, videoDuration, etc.
  // no están disponibles en el esquema actual de MarketingConfig
  // pero se mantienen en la interfaz para compatibilidad futura
  businessName?: string;
  industry?: string;
  targetAudience?: string;
  businessDescription?: string;
  brandColors?: string[]; // Se convertirá a colors (JSON string)
  logoUrl?: string;
  voiceStyle?: string;
  videoDuration?: number;
  contentTone?: string;
  includeCallToAction?: boolean;
  defaultCallToAction?: string;
  useAIActor?: boolean;
  preferredResolution?: string;
  watermarkEnabled?: boolean;
  autoPublish?: boolean;
  publishDays?: string[];
  publishTime?: string;
  timezone?: string;
}

/**
 * 🎯 SERVICIO DE CONFIGURACIÓN PERSONALIZADA DE MARKETING AI
 * 
 * Este servicio maneja toda la configuración personalizada del usuario
 * para generar videos de marketing adaptados a su negocio.
 */
export class MarketingConfigService {

  /**
   * 📋 OBTENER O CREAR CONFIGURACIÓN DEL USUARIO
   */
  static async getOrCreateConfig(userId: number): Promise<MarketingConfig> {
    logger.info(`[MarketingConfigService] 📋 Obteniendo configuración para usuario: ${userId}`);

    try {
      // Intentar obtener configuración existente
      let config = await prisma.marketingConfig.findUnique({
        where: { userId }
      });

      // Si no existe, crear una con valores por defecto
      if (!config) {
        logger.info(`[MarketingConfigService] ➕ Creando configuración por defecto para usuario: ${userId}`);
        
        config = await prisma.marketingConfig.create({
          data: {
            userId,
            businessType: 'other',
            style: 'professional',
            voiceType: 'neutral',
            musicStyle: 'corporate',
            frequency: 'weekly',
            tone: 'professional'
          }
        });
      }

      return config;

    } catch (error) {
      logger.error(`[MarketingConfigService] ❌ Error obteniendo configuración:`, error);
      throw new Error('Error al obtener configuración de marketing');
    }
  }

  /**
   * ✏️ ACTUALIZAR CONFIGURACIÓN
   */
  static async updateConfig(userId: number, data: MarketingConfigData): Promise<MarketingConfig> {
    logger.info(`[MarketingConfigService] ✏️ Actualizando configuración para usuario: ${userId}`);

    try {
      // Preparar datos para actualización
      const updateData: any = { ...data };
      
      // Convertir arrays a JSON strings para almacenar en DB
      if (data.brandColors) {
        updateData.colors = JSON.stringify(data.brandColors);
        delete updateData.brandColors;
      }
      // publishDays no está en el esquema actual
      if (data.publishDays) {
        delete updateData.publishDays;
      }

      // Actualizar usando upsert para crear si no existe
      const config = await prisma.marketingConfig.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData,
          // Valores por defecto para campos requeridos si no se proporcionan
          businessType: data.businessType || 'other',
          style: data.style || 'professional',
          voiceType: data.voiceType || 'neutral',
          musicStyle: data.musicStyle || 'corporate',
          frequency: data.frequency || 'weekly',
          tone: data.tone || 'professional'
        }
      });

      logger.info(`[MarketingConfigService] ✅ Configuración actualizada para usuario: ${userId}`);
      return config;

    } catch (error) {
      logger.error(`[MarketingConfigService] ❌ Error actualizando configuración:`, error);
      throw new Error('Error al actualizar configuración de marketing');
    }
  }

  /**
   * 🏢 OBTENER OPCIONES DE TIPO DE NEGOCIO
   */
  static getBusinessTypeOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'restaurant', label: 'Restaurante', description: 'Comida, bebidas, gastronomía' },
      { value: 'spa', label: 'Spa & Wellness', description: 'Relajación, belleza, bienestar' },
      { value: 'retail', label: 'Tienda/Retail', description: 'Productos, venta al por menor' },
      { value: 'fitness', label: 'Fitness & Gym', description: 'Ejercicio, entrenamiento, salud' },
      { value: 'beauty', label: 'Belleza & Estética', description: 'Cosmética, peluquería, cuidado personal' },
      { value: 'tech', label: 'Tecnología', description: 'Software, hardware, servicios tech' },
      { value: 'services', label: 'Servicios Profesionales', description: 'Consultoría, legal, contabilidad' },
      { value: 'education', label: 'Educación', description: 'Cursos, academias, formación' },
      { value: 'real_estate', label: 'Inmobiliaria', description: 'Propiedades, construcción' },
      { value: 'automotive', label: 'Automotriz', description: 'Autos, reparación, accesorios' },
      { value: 'other', label: 'Otro', description: 'Otro tipo de negocio' }
    ];
  }

  /**
   * 🎨 OBTENER OPCIONES DE ESTILO
   */
  static getStyleOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'professional', label: 'Profesional', description: 'Formal, corporativo, confiable' },
      { value: 'casual', label: 'Casual', description: 'Relajado, cercano, amigable' },
      { value: 'energetic', label: 'Energético', description: 'Dinámico, emocionante, activo' },
      { value: 'emotional', label: 'Emocional', description: 'Inspirador, conmovedor, personal' },
      { value: 'luxury', label: 'Lujo', description: 'Premium, exclusivo, elegante' },
      { value: 'minimalist', label: 'Minimalista', description: 'Simple, limpio, moderno' }
    ];
  }

  /**
   * 🎵 OBTENER OPCIONES DE MÚSICA
   */
  static getMusicStyleOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'upbeat', label: 'Alegre', description: 'Ritmo rápido, energético' },
      { value: 'corporate', label: 'Corporativo', description: 'Profesional, neutral' },
      { value: 'emotional', label: 'Emocional', description: 'Inspirador, conmovedor' },
      { value: 'energetic', label: 'Energético', description: 'Dinámico, motivador' },
      { value: 'minimal', label: 'Minimal', description: 'Sutil, de fondo' },
      { value: 'none', label: 'Sin música', description: 'Solo voz y efectos' }
    ];
  }

  /**
   * 🎤 OBTENER OPCIONES DE VOZ
   */
  static getVoiceOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'male', label: 'Masculina', description: 'Voz masculina profesional' },
      { value: 'female', label: 'Femenina', description: 'Voz femenina profesional' },
      { value: 'neutral', label: 'Neutral', description: 'Voz balanceada y versátil' }
    ];
  }

  /**
   * 📊 GENERAR CONFIGURACIÓN PARA PIPELINE
   * Convierte la configuración de la DB en formato usado por MarketingPipeline
   */
  static configToPromptInput(config: MarketingConfig): any {
    return {
      businessType: config.businessType,
      style: config.style,
      voiceType: config.voiceType,
      musicStyle: config.musicStyle,
      frequency: config.frequency,
      tone: config.tone,
      brandColors: config.colors ? JSON.parse(config.colors) : [],
      // Campos por defecto para compatibilidad
      duration: 30,
      useAIActor: false,
      callToAction: null,
      contentTone: config.tone,
      targetAudience: null
    };
  }

  /**
   * 🗑️ ELIMINAR CONFIGURACIÓN
   */
  static async deleteConfig(userId: number): Promise<void> {
    logger.info(`[MarketingConfigService] 🗑️ Eliminando configuración para usuario: ${userId}`);

    try {
      await prisma.marketingConfig.delete({
        where: { userId }
      });

      logger.info(`[MarketingConfigService] ✅ Configuración eliminada para usuario: ${userId}`);

    } catch (error) {
      logger.error(`[MarketingConfigService] ❌ Error eliminando configuración:`, error);
      throw new Error('Error al eliminar configuración de marketing');
    }
  }

  /**
   * 📋 VALIDAR CONFIGURACIÓN
   */
  static validateConfig(data: MarketingConfigData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar duración de video
    if (data.videoDuration && ![15, 30, 45, 60].includes(data.videoDuration)) {
      errors.push('La duración debe ser 15, 30, 45 o 60 segundos');
    }

    // Validar colores (formato hex)
    if (data.brandColors || data.colors) {
      const colors = data.brandColors || (typeof data.colors === 'string' ? JSON.parse(data.colors) : []);
      const hexRegex = /^#[0-9A-F]{6}$/i;
      const invalidColors = Array.isArray(colors) ? colors.filter(color => !hexRegex.test(color)) : [];
      if (invalidColors.length > 0) {
        errors.push(`Colores inválidos: ${invalidColors.join(', ')}`);
      }
    }

    // Validar email si se proporciona
    if (data.publishTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.publishTime)) {
        errors.push('Hora de publicación debe estar en formato HH:MM');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 🎯 OBTENER ESTADÍSTICAS DE CONFIGURACIÓN
   */
  static async getConfigStats(): Promise<any> {
    try {
      // Obtener conteo total
      const totalCount = await prisma.marketingConfig.count();

      // Obtener estadísticas por tipo de negocio
      const businessTypeStats = await prisma.marketingConfig.groupBy({
        by: ['businessType'],
        _count: {
          _all: true
        },
        where: {
          businessType: { not: null }
        }
      });

      // Obtener estadísticas por estilo
      const styleStats = await prisma.marketingConfig.groupBy({
        by: ['style'],
        _count: {
          _all: true
        },
        where: {
          style: { not: null }
        }
      });

      return {
        totalConfigs: totalCount,
        byBusinessType: businessTypeStats.reduce((acc, stat) => {
          if (stat.businessType) {
            acc[stat.businessType] = stat._count._all || 0;
          }
          return acc;
        }, {} as Record<string, number>),
        byStyle: styleStats.reduce((acc, stat) => {
          if (stat.style) {
            acc[stat.style] = stat._count._all || 0;
          }
          return acc;
        }, {} as Record<string, number>)
      };

    } catch (error) {
      logger.error(`[MarketingConfigService] ❌ Error obteniendo estadísticas:`, error);
      throw new Error('Error al obtener estadísticas de configuración');
    }
  }
}
