import cron from 'node-cron';
import { safeLog } from '../utils/logger.js';
import { 
  executeInstagramSyncJob, 
  executeWeeklyReportJob, 
  executeContentMonitorJob 
} from './marketingJobs.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  schedules: {
    instagramSync: string;      // Cada 6 horas
    weeklyReports: string;      // Lunes a las 9 AM
    contentMonitor: string;     // Cada 2 horas
  };
}

const config: SchedulerConfig = {
  enabled: process.env.MARKETING_SCHEDULER_ENABLED === 'true',
  timezone: process.env.TIMEZONE || 'America/New_York',
  schedules: {
    instagramSync: '0 */6 * * *',     // Cada 6 horas
    weeklyReports: '0 9 * * 1',       // Lunes a las 9 AM
    contentMonitor: '0 */2 * * *'     // Cada 2 horas
  }
};

// Registro de trabajos activos
const activeJobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Inicia el programador de trabajos de marketing
 */
export function startMarketingScheduler(): void {
  if (!config.enabled) {
    safeLog('📅 Marketing Scheduler deshabilitado por configuración');
    return;
  }

  safeLog('🚀 Iniciando Marketing Scheduler...');

  // Trabajo de sincronización de Instagram (cada 6 horas)
  const instagramSyncTask = cron.schedule(
    config.schedules.instagramSync,
    async () => {
      safeLog('📱 Ejecutando sincronización de Instagram automática');
      await executeScheduledInstagramSync();
    },
    {
      timezone: config.timezone
    }
  );

  // Trabajo de reportes semanales (lunes a las 9 AM)
  const weeklyReportsTask = cron.schedule(
    config.schedules.weeklyReports,
    async () => {
      safeLog('📊 Ejecutando generación de reportes semanales');
      await executeScheduledWeeklyReports();
    },
    {
      timezone: config.timezone
    }
  );

  // Trabajo de monitoreo de contenido (cada 2 horas)
  const contentMonitorTask = cron.schedule(
    config.schedules.contentMonitor,
    async () => {
      safeLog('🔍 Ejecutando monitoreo de contenido');
      await executeScheduledContentMonitor();
    },
    {
      timezone: config.timezone
    }
  );

  // Registrar trabajos
  activeJobs.set('instagramSync', instagramSyncTask);
  activeJobs.set('weeklyReports', weeklyReportsTask);
  activeJobs.set('contentMonitor', contentMonitorTask);

  // Iniciar trabajos
  instagramSyncTask.start();
  weeklyReportsTask.start();
  contentMonitorTask.start();

  safeLog(`✅ Marketing Scheduler iniciado con ${activeJobs.size} trabajos programados`);
}

/**
 * Detiene el programador de trabajos de marketing
 */
export function stopMarketingScheduler(): void {
  safeLog('🛑 Deteniendo Marketing Scheduler...');

  activeJobs.forEach((task, jobName) => {
    task.stop();
    task.destroy();
    safeLog(`🗑️ Trabajo '${jobName}' detenido y destruido`);
  });

  activeJobs.clear();
  safeLog('✅ Marketing Scheduler detenido completamente');
}

/**
 * Obtiene el estado de los trabajos programados
 */
export function getSchedulerStatus(): any {
  return {
    enabled: config.enabled,
    timezone: config.timezone,
    activeJobs: Array.from(activeJobs.keys()),
    schedules: config.schedules,
    nextRuns: {
      instagramSync: getNextRunTime(config.schedules.instagramSync),
      weeklyReports: getNextRunTime(config.schedules.weeklyReports),
      contentMonitor: getNextRunTime(config.schedules.contentMonitor)
    }
  };
}

// Funciones auxiliares para trabajos programados
async function executeScheduledInstagramSync(): Promise<void> {
  try {
    // Obtener todos los usuarios con cuentas de Instagram activas
    const users = await prisma.user.findMany({
      where: {
        socialAccounts: {
          some: {
            platform: 'INSTAGRAM',
            isActive: true
          }
        }
      },
      include: {
        socialAccounts: {
          where: { 
            platform: 'INSTAGRAM',
            isActive: true 
          }
        }
      }
    });

    safeLog(`📱 Sincronizando Instagram para ${users.length} usuarios`);

    for (const user of users) {
      for (const account of user.socialAccounts) {
        try {
          await executeInstagramSyncJob({
            userId: user.id,
            accountId: account.id
          });
          
          safeLog(`✅ Sincronización completada para usuario ${user.id}, cuenta ${account.username}`);
        } catch (error) {
          safeLog(`❌ Error sincronizando cuenta ${account.username}:`, error);
        }
      }
    }
  } catch (error) {
    safeLog('❌ Error en sincronización programada de Instagram:', { error });
  }
}

async function executeScheduledWeeklyReports(): Promise<void> {
  try {
    // Obtener todos los usuarios activos
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      }
    });

    safeLog(`📊 Generando reportes semanales para ${users.length} usuarios`);

    for (const user of users) {
      try {
        await executeWeeklyReportJob({
          userId: user.id
        });
        
        safeLog(`✅ Reporte semanal generado para usuario ${user.id}`);
      } catch (error) {
        safeLog(`❌ Error generando reporte para usuario ${user.id}:`, { error });
      }
    }
  } catch (error) {
    safeLog('❌ Error en generación programada de reportes:', { error });
  }
}

async function executeScheduledContentMonitor(): Promise<void> {
  try {
    // Obtener usuarios con monitoreo habilitado
    const users = await prisma.user.findMany({
      where: {
        // Asumiendo que hay un campo para habilitar monitoreo
        isActive: true
      }
    });

    safeLog(`🔍 Monitoreando contenido para ${users.length} usuarios`);

    for (const user of users) {
      try {
        await executeContentMonitorJob();
        
        safeLog(`✅ Monitoreo completado para usuario ${user.id}`);
      } catch (error) {
        safeLog(`❌ Error monitoreando usuario ${user.id}:`, { error });
      }
    }
  } catch (error) {
    safeLog('❌ Error en monitoreo programado de contenido:', { error });
  }
}

// Función auxiliar para calcular próxima ejecución
function getNextRunTime(cronExpression: string): string {
  try {
    // Esta es una aproximación, en un caso real usarías una librería como 'cron-parser'
    return 'Próxima ejecución calculada por cron';
  } catch (error) {
    return 'Error calculando próxima ejecución';
  }
}

// Auto-inicio si el módulo es ejecutado directamente
if (process.env.AUTO_START_SCHEDULER === 'true') {
  startMarketingScheduler();
}
