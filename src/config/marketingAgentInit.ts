import { PrismaClient } from '@prisma/client';
import { logger, safeLog } from '../utils/logger.js';
import { marketingConfig, configUtils } from './marketingConfig.js';
import { startMarketingScheduler, stopMarketingScheduler } from '../jobs/marketingScheduler.js';

/**
 * 🚀 INICIALIZADOR DEL MARKETING AGENT
 * Maneja la inicialización completa del sistema Marketing Agent
 */

export interface MarketingAgentInitStatus {
  enabled: boolean;
  database: boolean;
  scheduler: boolean;
  services: boolean;
  errors: string[];
  warnings: string[];
  startTime: number;
  initTime?: number;
}

// Estado global de inicialización
let initStatus: MarketingAgentInitStatus = {
  enabled: false,
  database: false,
  scheduler: false,
  services: false,
  errors: [],
  warnings: [],
  startTime: 0
};

// Instancia de Prisma para verificaciones
const prisma = new PrismaClient();

/**
 * Inicializar el Marketing Agent completamente
 */
export async function initializeMarketingAgent(): Promise<MarketingAgentInitStatus> {
  const startTime = Date.now();
  initStatus.startTime = startTime;
  
  safeLog('🚀 Iniciando Marketing Agent...');
  
  try {
    // 1. Verificar si está habilitado
    if (!configUtils.isEnabled()) {
      initStatus.warnings.push('Marketing Agent está deshabilitado por configuración');
      safeLog('⚠️ Marketing Agent deshabilitado por configuración');
      return initStatus;
    }
    
    initStatus.enabled = true;
    safeLog('✅ Marketing Agent habilitado');
    
    // 2. Verificar conexión a base de datos
    await initializeDatabase();
    
    // 3. Inicializar servicios
    await initializeServices();
    
    // 4. Inicializar programador de trabajos
    await initializeScheduler();
    
    // 5. Finalizar inicialización
    initStatus.initTime = Date.now() - startTime;
    safeLog(`🎉 Marketing Agent inicializado exitosamente en ${initStatus.initTime}ms`);
    
    // Log de resumen
    logInitializationSummary();
    
    return initStatus;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    initStatus.errors.push(errorMessage);
    logger.error('[MarketingAgent] Error durante la inicialización:', error);
    safeLog(`❌ Error inicializando Marketing Agent: ${errorMessage}`);
    return initStatus;
  }
}

/**
 * Verificar y preparar la base de datos
 */
async function initializeDatabase(): Promise<void> {
  try {
    safeLog('🔍 Verificando conexión a base de datos...');
    
    // Verificar conexión básica
    await prisma.$connect();
    
    // Verificar que existen las tablas necesarias
    const tablesCheck = await Promise.allSettled([
      prisma.user.findFirst(),
      prisma.socialAccount.findFirst(),
      prisma.marketingInsight.findFirst()
    ]);
    
    const failedTables = tablesCheck
      .map((result, index) => ({ result, table: ['users', 'social_accounts', 'marketing_insights'][index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ table }) => table);
    
    if (failedTables.length > 0) {
      throw new Error(`Tablas faltantes: ${failedTables.join(', ')}`);
    }
    
    initStatus.database = true;
    safeLog('✅ Base de datos verificada correctamente');
    
  } catch (error) {
    initStatus.errors.push(`Error de base de datos: ${error instanceof Error ? error.message : 'desconocido'}`);
    throw error;
  }
}

/**
 * Inicializar servicios del Marketing Agent
 */
async function initializeServices(): Promise<void> {
  try {
    safeLog('🛠️ Inicializando servicios...');
    
    // Verificar configuración de servicios externos
    const servicesConfig = [
      { name: 'Instagram API', config: marketingConfig.instagram },
      { name: 'AI Provider', config: marketingConfig.ai },
      { name: 'Cache', config: marketingConfig.cache }
    ];
    
    for (const service of servicesConfig) {
      if (!service.config || Object.keys(service.config).length === 0) {
        initStatus.warnings.push(`Configuración incompleta para ${service.name}`);
      }
    }
    
    // Verificar configuración de IA
    if (!process.env.OPENAI_API_KEY && marketingConfig.ai.provider === 'openai') {
      initStatus.warnings.push('OPENAI_API_KEY no configurada para proveedor OpenAI');
    }
    
    initStatus.services = true;
    safeLog('✅ Servicios inicializados');
    
  } catch (error) {
    initStatus.errors.push(`Error inicializando servicios: ${error instanceof Error ? error.message : 'desconocido'}`);
    throw error;
  }
}

/**
 * Inicializar programador de trabajos
 */
async function initializeScheduler(): Promise<void> {
  try {
    if (!configUtils.getJobsConfig().enabled) {
      initStatus.warnings.push('Programador de trabajos deshabilitado');
      safeLog('⚠️ Programador de trabajos deshabilitado');
      return;
    }
    
    safeLog('⏰ Inicializando programador de trabajos...');
    
    // Iniciar el programador
    startMarketingScheduler();
    
    initStatus.scheduler = true;
    safeLog('✅ Programador de trabajos iniciado');
    
  } catch (error) {
    initStatus.errors.push(`Error inicializando programador: ${error instanceof Error ? error.message : 'desconocido'}`);
    throw error;
  }
}

/**
 * Detener el Marketing Agent
 */
export async function shutdownMarketingAgent(): Promise<void> {
  safeLog('🛑 Deteniendo Marketing Agent...');
  
  try {
    // Detener programador si está activo
    if (initStatus.scheduler) {
      stopMarketingScheduler();
      safeLog('✅ Programador de trabajos detenido');
    }
    
    // Cerrar conexión a base de datos
    if (initStatus.database) {
      await prisma.$disconnect();
      safeLog('✅ Conexión a base de datos cerrada');
    }
    
    // Resetear estado
    initStatus = {
      enabled: false,
      database: false,
      scheduler: false,
      services: false,
      errors: [],
      warnings: [],
      startTime: 0
    };
    
    safeLog('✅ Marketing Agent detenido completamente');
    
  } catch (error) {
    logger.error('[MarketingAgent] Error durante el shutdown:', error);
    safeLog(`❌ Error deteniendo Marketing Agent: ${error instanceof Error ? error.message : 'desconocido'}`);
  }
}

/**
 * Obtener estado actual de inicialización
 */
export function getMarketingAgentStatus(): MarketingAgentInitStatus {
  return { ...initStatus };
}

/**
 * Verificar si el Marketing Agent está completamente inicializado
 */
export function isMarketingAgentReady(): boolean {
  return initStatus.enabled && 
         initStatus.database && 
         initStatus.services && 
         initStatus.errors.length === 0;
}

/**
 * Realizar verificación de salud del sistema
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  uptime: number;
  errors: string[];
}> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];
  
  try {
    // Verificar base de datos
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.database = false;
    errors.push('Database connection failed');
  }
  
  // Verificar configuración
  checks.configuration = configUtils.isEnabled();
  
  // Verificar servicios críticos
  checks.services = initStatus.services;
  checks.scheduler = initStatus.scheduler;
  
  // Determinar estado general
  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyChecks === totalChecks) {
    status = 'healthy';
  } else if (healthyChecks >= totalChecks * 0.5) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  return {
    status,
    checks,
    uptime: initStatus.startTime ? Date.now() - initStatus.startTime : 0,
    errors
  };
}

/**
 * Reinicializar el Marketing Agent
 */
export async function restartMarketingAgent(): Promise<MarketingAgentInitStatus> {
  safeLog('🔄 Reiniciando Marketing Agent...');
  
  await shutdownMarketingAgent();
  
  // Esperar un momento para asegurar el shutdown completo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return await initializeMarketingAgent();
}

/**
 * Log del resumen de inicialización
 */
function logInitializationSummary(): void {
  const summary = {
    enabled: initStatus.enabled,
    database: initStatus.database,
    services: initStatus.services,
    scheduler: initStatus.scheduler,
    initTime: initStatus.initTime,
    errorsCount: initStatus.errors.length,
    warningsCount: initStatus.warnings.length
  };
  
  logger.info('[MarketingAgent] Resumen de inicialización:', summary);
  
  if (initStatus.warnings.length > 0) {
    safeLog('⚠️ Advertencias durante la inicialización:');
    initStatus.warnings.forEach(warning => safeLog(`  • ${warning}`));
  }
  
  if (configUtils.isDebugMode()) {
    safeLog('🔍 Modo debug habilitado para Marketing Agent');
    safeLog(`📊 Configuración cargada:`, {
      jobsEnabled: marketingConfig.jobs.enabled,
      loggingLevel: marketingConfig.logging.level,
      aiProvider: marketingConfig.ai.provider,
      cacheEnabled: marketingConfig.cache.enabled
    });
  }
}

// Manejo de señales del sistema para shutdown limpio
process.on('SIGTERM', async () => {
  safeLog('🔔 Recibida señal SIGTERM, deteniendo Marketing Agent...');
  await shutdownMarketingAgent();
  process.exit(0);
});

process.on('SIGINT', async () => {
  safeLog('🔔 Recibida señal SIGINT, deteniendo Marketing Agent...');
  await shutdownMarketingAgent();
  process.exit(0);
});
