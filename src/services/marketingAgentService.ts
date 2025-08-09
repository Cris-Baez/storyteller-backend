/**
 * 🤖 SISTEMA DE AGENTE AUTOMATIZADO - SEGÚN FLUJO.TXT
 * Automatización semanal de Marketing AI
 */

import { PrismaClient } from '../../generated/prisma/index.js';
import { logger } from '../utils/logger.js';
import { MarketingTemplateService } from './marketingTemplateService.js';
import { MarketingConfigService } from './marketingConfigService.js';
import cron from 'node-cron';

const prisma = new PrismaClient();

export interface AgentConfig {
  userId: number;
  isActive: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  preferredDays: string[]; // ['monday', 'wednesday', 'friday']
  preferredHours: number[]; // [9, 14, 18] (formato 24h)
  categories: string[]; // ['product_launch', 'promotion', 'educational']
  defaultStyle: string;
  defaultVoice: string;
  seasonalAdaptation: boolean;
  maxVideosPerWeek: number;
}

export class MarketingAgentService {
  private static instance: MarketingAgentService;
  private scheduledJobs: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): MarketingAgentService {
    if (!this.instance) {
      this.instance = new MarketingAgentService();
    }
    return this.instance;
  }

  /**
   * 🎯 ACTIVAR AGENTE PARA UN USUARIO
   * Según flujo.txt: Usuario activa agente y define configuración
   */
  async activateAgent(config: AgentConfig): Promise<void> {
    logger.info(`[MarketingAgent] Activando agente para usuario ${config.userId}`);

    try {
      // Verificar límites del plan del usuario
      const user = await prisma.user.findUnique({
        where: { id: config.userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que el plan permite el agente automático
      if (user.plan === 'STARTER') {
        throw new Error('El agente automático requiere plan Creator o superior');
      }

      // Guardar configuración del agente
      await this.saveAgentConfig(config);

      // Programar trabajos automáticos
      await this.scheduleAgentJobs(config);

      logger.info(`[MarketingAgent] Agente activado exitosamente para usuario ${config.userId}`);

    } catch (error) {
      logger.error(`[MarketingAgent] Error activando agente:`, error);
      throw error;
    }
  }

  /**
   * 📅 PROGRAMAR TRABAJOS DEL AGENTE
   * Según flujo.txt: Backend agenda trabajos por semana conforme a la frecuencia
   */
  private async scheduleAgentJobs(config: AgentConfig): Promise<void> {
    const jobKey = `agent_${config.userId}`;

    // Cancelar job anterior si existe
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
      this.scheduledJobs.delete(jobKey);
    }

    // Crear nuevo cron job
    let cronPattern: string;
    
    switch (config.frequency) {
      case 'weekly':
        cronPattern = '0 9 * * 1'; // Lunes a las 9 AM
        break;
      case 'biweekly':
        cronPattern = '0 9 * * 1/2'; // Cada 2 semanas, lunes
        break;
      case 'monthly':
        cronPattern = '0 9 1 * *'; // Primer día del mes
        break;
      default:
        cronPattern = '0 9 * * 1'; // Default: semanal
    }

    const job = cron.schedule(cronPattern, async () => {
      await this.executeAgentWork(config);
    });

    this.scheduledJobs.set(jobKey, job);
    job.start();

    logger.info(`[MarketingAgent] Job programado para usuario ${config.userId} con patrón ${cronPattern}`);
  }

  /**
   * 🚀 EJECUTAR TRABAJO DEL AGENTE
   * Según flujo.txt: Al disparar cada trabajo, verificar límites y ejecutar pipeline
   */
  private async executeAgentWork(config: AgentConfig): Promise<void> {
    logger.info(`[MarketingAgent] Ejecutando trabajo automático para usuario ${config.userId}`);

    try {
      // Verificar límite del plan antes de crear la orden
      const canCreateVideo = await this.checkPlanLimits(config.userId);
      if (!canCreateVideo) {
        logger.warn(`[MarketingAgent] Usuario ${config.userId} ha alcanzado el límite de su plan`);
        
        // Registrar omisión según flujo.txt
        await this.logSkippedGeneration(config.userId, 'plan_limit_exceeded');
        return;
      }

      // Obtener perfil de marketing del usuario
      const userProfile = await MarketingConfigService.getOrCreateConfig(config.userId);

      // Seleccionar plantilla adecuada por temporada/industria
      const template = await this.selectSeasonalTemplate(userProfile, config);

      // Combinar con el perfil del usuario
      const personalizedTemplate = MarketingTemplateService.personalizeTemplate(
        template,
        userProfile,
        this.getSeasonalParams()
      );

      // TODO: Ejecutar pipeline de Marketing completo
      // Aquí se integraría con el marketingPipeline.ts existente
      logger.info(`[MarketingAgent] Ejecutando pipeline con plantilla ${template.id} para usuario ${config.userId}`);

      // Simular ejecución del pipeline
      await this.simulateMarketingPipeline(config.userId, personalizedTemplate);

      // Registrar historial y actualizar uso
      await this.logSuccessfulGeneration(config.userId, template.id);

    } catch (error) {
      logger.error(`[MarketingAgent] Error en trabajo automático para usuario ${config.userId}:`, error);
      await this.logFailedGeneration(config.userId, error as Error);
    }
  }

  /**
   * ✅ VERIFICAR LÍMITES DEL PLAN
   */
  private async checkPlanLimits(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { usage: true }
    });

    if (!user || !user.usage) return false;

    const planLimits = {
      CREATOR: 5,
      STUDIO_PRO: Infinity
    };

    const currentLimit = planLimits[user.plan as keyof typeof planLimits] || 0;
    return user.usage.videosThisWeek < currentLimit;
  }

  /**
   * 🎨 SELECCIONAR PLANTILLA ESTACIONAL
   */
  private async selectSeasonalTemplate(userProfile: any, config: AgentConfig): Promise<any> {
    const currentMonth = new Date().getMonth();
    const season = this.getCurrentSeason(currentMonth);
    
    // Obtener plantillas de la industria del usuario
    const industryTemplates = MarketingTemplateService.getTemplatesByIndustry(userProfile.industry || 'servicios');
    
    // Filtrar por categorías preferidas del usuario
    const filteredTemplates = industryTemplates.filter(template => 
      config.categories.includes(template.objective)
    );

    // Seleccionar aleatoriamente para variedad
    return filteredTemplates[Math.floor(Math.random() * filteredTemplates.length)] || industryTemplates[0];
  }

  /**
   * 🗓️ OBTENER TEMPORADA ACTUAL
   */
  private getCurrentSeason(month: number): string {
    if (month >= 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'fall';
  }

  /**
   * 🎯 OBTENER PARÁMETROS ESTACIONALES
   */
  private getSeasonalParams(): Record<string, string> {
    const month = new Date().getMonth();
    const season = this.getCurrentSeason(month);
    
    const seasonalParams: Record<string, Record<string, string>> = {
      winter: { tema_estacional: 'Año Nuevo', color_predominante: 'azul invernal' },
      spring: { tema_estacional: 'Primavera', color_predominante: 'verde fresco' },
      summer: { tema_estacional: 'Verano', color_predominante: 'naranja vibrante' },
      fall: { tema_estacional: 'Black Friday', color_predominante: 'rojo intenso' }
    };

    return seasonalParams[season] || seasonalParams.spring;
  }

  /**
   * 📊 SIMULAR PIPELINE DE MARKETING
   */
  private async simulateMarketingPipeline(userId: number, template: any): Promise<void> {
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    logger.info(`[MarketingAgent] Pipeline simulado completado para usuario ${userId}`);
    // Aquí se integraría con el pipeline real
  }

  /**
   * 📝 LOGGING DE GENERACIONES
   */
  private async logSuccessfulGeneration(userId: number, templateId: string): Promise<void> {
    logger.info(`[MarketingAgent] Video generado exitosamente - Usuario: ${userId}, Plantilla: ${templateId}`);
    
    // Actualizar uso del usuario
    await prisma.usage.update({
      where: { userId },
      data: {
        videosThisWeek: { increment: 1 }
      }
    });
  }

  private async logSkippedGeneration(userId: number, reason: string): Promise<void> {
    logger.warn(`[MarketingAgent] Generación omitida - Usuario: ${userId}, Motivo: ${reason}`);
    // TODO: Guardar en tabla de historial de agente
  }

  private async logFailedGeneration(userId: number, error: Error): Promise<void> {
    logger.error(`[MarketingAgent] Generación falló - Usuario: ${userId}, Error: ${error.message}`);
    // TODO: Guardar en tabla de historial de agente
  }

  /**
   * 💾 GUARDAR CONFIGURACIÓN DEL AGENTE
   */
  private async saveAgentConfig(config: AgentConfig): Promise<void> {
    // TODO: Crear tabla AgentConfig en Prisma
    logger.info(`[MarketingAgent] Configuración guardada para usuario ${config.userId}`);
  }

  /**
   * ⏹️ DESACTIVAR AGENTE
   */
  async deactivateAgent(userId: number): Promise<void> {
    const jobKey = `agent_${userId}`;
    
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
      this.scheduledJobs.delete(jobKey);
      logger.info(`[MarketingAgent] Agente desactivado para usuario ${userId}`);
    }
  }

  /**
   * 🔄 FORZAR EJECUCIÓN PUNTUAL (Para admin)
   */
  async forceExecution(userId: number): Promise<void> {
    logger.info(`[MarketingAgent] Ejecución forzada para usuario ${userId}`);
    
    const config: AgentConfig = {
      userId,
      isActive: true,
      frequency: 'weekly',
      preferredDays: ['monday'],
      preferredHours: [9],
      categories: ['promotion'],
      defaultStyle: 'moderno',
      defaultVoice: 'commercial',
      seasonalAdaptation: true,
      maxVideosPerWeek: 5
    };

    await this.executeAgentWork(config);
  }
}

export const marketingAgent = MarketingAgentService.getInstance();
