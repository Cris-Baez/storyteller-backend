import { PrismaClient, MarketingTemplate } from '../../generated/prisma/index.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface TemplateCreateData {
  title: string;
  description?: string;
  businessType: string;
  category: string;
  structure: any; // JSON con la estructura narrativa
  duration?: number;
  style?: string;
  tone?: string;
  musicStyle?: string;
  voiceType?: string;
  effectsEnabled?: boolean;
  tags?: string[];
  thumbnail?: string;
  sampleVideo?: string;
}

export interface TemplateUpdateData extends Partial<TemplateCreateData> {
  isActive?: boolean;
  isPublic?: boolean;
}

export interface TemplateFilters {
  businessType?: string;
  category?: string;
  style?: string;
  tone?: string;
  duration?: number;
  isActive?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * 📄 SERVICIO DE PLANTILLAS DE MARKETING
 * 
 * Maneja todas las operaciones CRUD de plantillas para videos promocionales
 */
export class TemplateService {

  /**
   * 📋 OBTENER TODAS LAS PLANTILLAS
   */
  static async getAllTemplates(filters?: TemplateFilters): Promise<MarketingTemplate[]> {
    logger.info('[TemplateService] 📋 Obteniendo plantillas con filtros:', filters);

    try {
      const where: any = {};

      if (filters) {
        if (filters.businessType) where.businessType = filters.businessType;
        if (filters.category) where.category = filters.category;
        if (filters.style) where.style = filters.style;
        if (filters.tone) where.tone = filters.tone;
        if (filters.duration) where.duration = filters.duration;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
        
        // Filtro por tags usando JSON contains
        if (filters.tags && filters.tags.length > 0) {
          where.tags = {
            contains: filters.tags[0] // Busca el primer tag
          };
        }
      }

      const templates = await prisma.marketingTemplate.findMany({
        where,
        orderBy: [
          { isActive: 'desc' },
          { useCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      logger.info(`[TemplateService] ✅ Encontradas ${templates.length} plantillas`);
      return templates;

    } catch (error) {
      logger.error('[TemplateService] ❌ Error obteniendo plantillas:', error);
      throw new Error('Error al obtener plantillas');
    }
  }

  /**
   * 🔍 OBTENER PLANTILLA POR ID
   */
  static async getTemplateById(id: number): Promise<MarketingTemplate | null> {
    logger.info(`[TemplateService] 🔍 Obteniendo plantilla ID: ${id}`);

    try {
      const template = await prisma.marketingTemplate.findUnique({
        where: { id }
      });

      if (template) {
        logger.info(`[TemplateService] ✅ Plantilla encontrada: ${template.title}`);
      } else {
        logger.warn(`[TemplateService] ⚠️ Plantilla no encontrada: ${id}`);
      }

      return template;

    } catch (error) {
      logger.error('[TemplateService] ❌ Error obteniendo plantilla:', error);
      throw new Error('Error al obtener plantilla');
    }
  }

  /**
   * ➕ CREAR NUEVA PLANTILLA
   */
  static async createTemplate(data: TemplateCreateData): Promise<MarketingTemplate> {
    logger.info('[TemplateService] ➕ Creando nueva plantilla:', data.title);

    try {
      const templateData: any = {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : null
      };

      const template = await prisma.marketingTemplate.create({
        data: templateData
      });

      logger.info(`[TemplateService] ✅ Plantilla creada: ${template.id} - ${template.title}`);
      return template;

    } catch (error) {
      logger.error('[TemplateService] ❌ Error creando plantilla:', error);
      throw new Error('Error al crear plantilla');
    }
  }

  /**
   * ✏️ ACTUALIZAR PLANTILLA
   */
  static async updateTemplate(id: number, data: TemplateUpdateData): Promise<MarketingTemplate> {
    logger.info(`[TemplateService] ✏️ Actualizando plantilla ID: ${id}`);

    try {
      // Verificar que la plantilla existe
      const existing = await this.getTemplateById(id);
      if (!existing) {
        throw new Error('Plantilla no encontrada');
      }

      const updateData: any = { ...data };
      
      // Convertir tags a JSON si se proporciona
      if (data.tags) {
        updateData.tags = JSON.stringify(data.tags);
      }

      const template = await prisma.marketingTemplate.update({
        where: { id },
        data: updateData
      });

      logger.info(`[TemplateService] ✅ Plantilla actualizada: ${template.title}`);
      return template;

    } catch (error) {
      logger.error('[TemplateService] ❌ Error actualizando plantilla:', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR PLANTILLA
   */
  static async deleteTemplate(id: number): Promise<void> {
    logger.info(`[TemplateService] 🗑️ Eliminando plantilla ID: ${id}`);

    try {
      // Verificar que la plantilla existe
      const existing = await this.getTemplateById(id);
      if (!existing) {
        throw new Error('Plantilla no encontrada');
      }

      await prisma.marketingTemplate.delete({
        where: { id }
      });

      logger.info(`[TemplateService] ✅ Plantilla eliminada: ${existing.title}`);

    } catch (error) {
      logger.error('[TemplateService] ❌ Error eliminando plantilla:', error);
      throw error;
    }
  }

  /**
   * 📊 INCREMENTAR CONTADOR DE USO
   */
  static async incrementUseCount(id: number): Promise<void> {
    logger.info(`[TemplateService] 📊 Incrementando contador de uso para plantilla: ${id}`);

    try {
      await prisma.marketingTemplate.update({
        where: { id },
        data: {
          useCount: {
            increment: 1
          }
        }
      });

      logger.info(`[TemplateService] ✅ Contador incrementado para plantilla: ${id}`);

    } catch (error) {
      logger.error('[TemplateService] ❌ Error incrementando contador:', error);
      // No lanzar error ya que esto no debe detener el proceso principal
    }
  }

  /**
   * 🏢 OBTENER PLANTILLAS POR TIPO DE NEGOCIO
   */
  static async getTemplatesByBusinessType(businessType: string): Promise<MarketingTemplate[]> {
    logger.info(`[TemplateService] 🏢 Obteniendo plantillas para negocio: ${businessType}`);

    return this.getAllTemplates({
      businessType,
      isActive: true,
      isPublic: true
    });
  }

  /**
   * 🎯 OBTENER PLANTILLAS POPULARES
   */
  static async getPopularTemplates(limit = 10): Promise<MarketingTemplate[]> {
    logger.info(`[TemplateService] 🎯 Obteniendo ${limit} plantillas más populares`);

    try {
      const templates = await prisma.marketingTemplate.findMany({
        where: {
          isActive: true,
          isPublic: true
        },
        orderBy: {
          useCount: 'desc'
        },
        take: limit
      });

      logger.info(`[TemplateService] ✅ Encontradas ${templates.length} plantillas populares`);
      return templates;

    } catch (error) {
      logger.error('[TemplateService] ❌ Error obteniendo plantillas populares:', error);
      throw new Error('Error al obtener plantillas populares');
    }
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS DE PLANTILLAS
   */
  static async getTemplateStats(): Promise<any> {
    logger.info('[TemplateService] 📈 Obteniendo estadísticas de plantillas');

    try {
      const totalActive = await prisma.marketingTemplate.count({
        where: { isActive: true }
      });

      const totalPublic = await prisma.marketingTemplate.count({
        where: { isPublic: true }
      });

      const byBusinessType = await prisma.marketingTemplate.groupBy({
        by: ['businessType'],
        _count: {
          _all: true
        },
        where: {
          isActive: true
        }
      });

      const byCategory = await prisma.marketingTemplate.groupBy({
        by: ['category'],
        _count: {
          _all: true
        },
        where: {
          isActive: true
        }
      });

      const totalUsage = await prisma.marketingTemplate.aggregate({
        _sum: {
          useCount: true
        },
        where: {
          isActive: true
        }
      });

      const stats = {
        totalActive,
        totalPublic,
        totalUsage: totalUsage._sum.useCount || 0,
        byBusinessType: byBusinessType.reduce((acc, item) => {
          acc[item.businessType] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count._all;
          return acc;
        }, {} as Record<string, number>)
      };

      logger.info('[TemplateService] ✅ Estadísticas obtenidas:', stats);
      return stats;

    } catch (error) {
      logger.error('[TemplateService] ❌ Error obteniendo estadísticas:', error);
      throw new Error('Error al obtener estadísticas de plantillas');
    }
  }

  /**
   * 🏷️ OBTENER CATEGORÍAS Y OPCIONES DISPONIBLES
   */
  static getTemplateOptions() {
    return {
      businessTypes: [
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
      ],
      categories: [
        { value: 'promotional', label: 'Promocional', description: 'Ofertas, descuentos, promociones' },
        { value: 'product', label: 'Producto', description: 'Lanzamiento o showcase de productos' },
        { value: 'service', label: 'Servicio', description: 'Explicación de servicios ofrecidos' },
        { value: 'seasonal', label: 'Temporal', description: 'Navidad, Black Friday, etc.' },
        { value: 'testimonial', label: 'Testimonial', description: 'Reseñas y experiencias de clientes' },
        { value: 'brand', label: 'Marca', description: 'Presentación de empresa y valores' },
        { value: 'educational', label: 'Educativo', description: 'Tips, tutoriales, how-to' },
        { value: 'event', label: 'Evento', description: 'Invitaciones, anuncios de eventos' }
      ],
      styles: [
        { value: 'professional', label: 'Profesional', description: 'Formal, corporativo, confiable' },
        { value: 'casual', label: 'Casual', description: 'Relajado, cercano, amigable' },
        { value: 'energetic', label: 'Energético', description: 'Dinámico, emocionante, activo' },
        { value: 'emotional', label: 'Emocional', description: 'Inspirador, conmovedor, personal' },
        { value: 'luxury', label: 'Lujo', description: 'Premium, exclusivo, elegante' },
        { value: 'minimalist', label: 'Minimalista', description: 'Simple, limpio, moderno' }
      ],
      tones: [
        { value: 'professional', label: 'Profesional', description: 'Formal y corporativo' },
        { value: 'friendly', label: 'Amigable', description: 'Cercano y personal' },
        { value: 'authoritative', label: 'Autoritativo', description: 'Experto y confiable' },
        { value: 'playful', label: 'Divertido', description: 'Casual y entretenido' },
        { value: 'inspirational', label: 'Inspirador', description: 'Motivador y positivo' },
        { value: 'urgent', label: 'Urgente', description: 'Llamada a la acción inmediata' }
      ],
      durations: [
        { value: 15, label: '15 segundos', description: 'Video corto y directo' },
        { value: 30, label: '30 segundos', description: 'Equilibrio perfecto' },
        { value: 45, label: '45 segundos', description: 'Contenido más detallado' },
        { value: 60, label: '60 segundos', description: 'Historia completa' }
      ]
    };
  }

  /**
   * 🔍 VALIDAR DATOS DE PLANTILLA
   */
  static validateTemplateData(data: TemplateCreateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (!data.title || data.title.length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    }

    if (!data.businessType) {
      errors.push('El tipo de negocio es requerido');
    }

    if (!data.category) {
      errors.push('La categoría es requerida');
    }

    if (!data.structure) {
      errors.push('La estructura narrativa es requerida');
    }

    if (data.duration && (data.duration < 15 || data.duration > 120)) {
      errors.push('La duración debe estar entre 15 y 120 segundos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
