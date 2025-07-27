// metricsService.ts - Sistema de métricas para análisis y debugging
// 📊 NUEVO: Sistema completo de métricas por escena implementado

import { logger } from '../utils/logger.js';
import { logFeedback } from './feedbackService.js';
import { TimelineSecond, CarryoverLevel } from '../utils/types.js';

export interface SceneMetrics {
  escena: number;
  segundo: number;
  
  // Métricas de contenido
  usaLipSync: boolean;
  usaCarryover: boolean | CarryoverLevel;
  fondoGenerado?: string;
  actorGenerado?: string;
  musicaUsada?: string;
  sfxUsados: string[];
  
  // Métricas técnicas
  tiempoGeneracion: number;
  serviciosUsados: string[];
  errorOcurrido?: string;
  
  // Métricas de calidad
  resolucionVideo?: string;
  calidadAudio?: string;
  tamanioArchivo?: number;
  
  // Timestamp
  timestamp: string;
}

export interface SessionMetrics {
  sessionId: string;
  totalEscenas: number;
  duracionTotal: number;
  estilo: string;
  escenas: SceneMetrics[];
  
  // Resumen de sesión
  tiempoTotalGeneracion: number;
  serviciosUsados: string[];
  erroresEncontrados: number;
  exitoso: boolean;
  
  // Timestamp
  inicioSesion: string;
  finSesion?: string;
}

class MetricsCollector {
  private sessions: Map<string, SessionMetrics> = new Map();
  private currentSession: string | null = null;
  
  /**
   * Iniciar una nueva sesión de métricas
   */
  startSession(sessionId: string, estilo: string, duracionTotal: number): void {
    logger.info(`📊 [Metrics] Iniciando sesión: ${sessionId}`);
    
    const session: SessionMetrics = {
      sessionId,
      totalEscenas: 0,
      duracionTotal,
      estilo,
      escenas: [],
      tiempoTotalGeneracion: 0,
      serviciosUsados: [],
      erroresEncontrados: 0,
      exitoso: false,
      inicioSesion: new Date().toISOString()
    };
    
    this.sessions.set(sessionId, session);
    this.currentSession = sessionId;
    
    logFeedback({
      service: 'Metrics',
      action: 'startSession',
      success: true,
      params: { sessionId, estilo, duracionTotal }
    });
  }
  
  /**
   * Registrar métricas de una escena
   */
  recordScene(escena: number, segundo: number, metrics: Partial<SceneMetrics>): void {
    if (!this.currentSession) {
      logger.warn('⚠️ [Metrics] No hay sesión activa para registrar escena');
      return;
    }
    
    const session = this.sessions.get(this.currentSession);
    if (!session) return;
    
    const sceneMetrics: SceneMetrics = {
      escena,
      segundo,
      usaLipSync: metrics.usaLipSync || false,
      usaCarryover: metrics.usaCarryover || false,
      sfxUsados: metrics.sfxUsados || [],
      tiempoGeneracion: metrics.tiempoGeneracion || 0,
      serviciosUsados: metrics.serviciosUsados || [],
      timestamp: new Date().toISOString(),
      ...metrics
    };
    
    session.escenas.push(sceneMetrics);
    session.totalEscenas++;
    session.tiempoTotalGeneracion += sceneMetrics.tiempoGeneracion;
    
    // Agregar servicios únicos
    sceneMetrics.serviciosUsados.forEach(servicio => {
      if (!session.serviciosUsados.includes(servicio)) {
        session.serviciosUsados.push(servicio);
      }
    });
    
    // Contar errores
    if (sceneMetrics.errorOcurrido) {
      session.erroresEncontrados++;
    }
    
    logger.info(`📊 [Metrics] Escena ${escena} registrada:`, {
      lipSync: sceneMetrics.usaLipSync,
      carryover: sceneMetrics.usaCarryover,
      tiempo: `${sceneMetrics.tiempoGeneracion}ms`,
      servicios: sceneMetrics.serviciosUsados.length
    });
  }
  
  /**
   * Finalizar sesión y generar reporte
   */
  endSession(sessionId: string, exitoso: boolean = true): SessionMetrics | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`⚠️ [Metrics] Sesión no encontrada: ${sessionId}`);
      return null;
    }
    
    session.finSesion = new Date().toISOString();
    session.exitoso = exitoso;
    
    logger.info(`📊 [Metrics] Sesión finalizada: ${sessionId}`, {
      escenas: session.totalEscenas,
      tiempoTotal: `${session.tiempoTotalGeneracion}ms`,
      servicios: session.serviciosUsados.length,
      errores: session.erroresEncontrados,
      exitoso: session.exitoso
    });
    
    // Log del reporte completo para análisis
    logFeedback({
      service: 'Metrics',
      action: 'endSession',
      success: exitoso,
      params: {
        sessionId,
        resumen: this.generateSummary(session)
      }
    });
    
    this.currentSession = null;
    return session;
  }
  
  /**
   * Obtener métricas de una sesión
   */
  getSession(sessionId: string): SessionMetrics | null {
    return this.sessions.get(sessionId) || null;
  }
  
  /**
   * Generar resumen de métricas
   */
  private generateSummary(session: SessionMetrics): any {
    const escenasConLipSync = session.escenas.filter(e => e.usaLipSync).length;
    const escenasConCarryover = session.escenas.filter(e => e.usaCarryover !== false && e.usaCarryover !== 'none').length;
    const serviciosMasUsados = this.getMostUsedServices(session);
    const tiempoPromedioEscena = session.totalEscenas > 0 ? session.tiempoTotalGeneracion / session.totalEscenas : 0;
    
    return {
      rendimiento: {
        tiempoTotal: session.tiempoTotalGeneracion,
        tiempoPromedio: Math.round(tiempoPromedioEscena),
        escenasMasRapida: Math.min(...session.escenas.map(e => e.tiempoGeneracion)),
        escenaMasLenta: Math.max(...session.escenas.map(e => e.tiempoGeneracion))
      },
      tecnologias: {
        lipSyncUsage: `${escenasConLipSync}/${session.totalEscenas} escenas`,
        carryoverUsage: `${escenasConCarryover}/${session.totalEscenas} escenas`,
        serviciosPrincipales: serviciosMasUsados.slice(0, 3)
      },
      calidad: {
        exitoso: session.exitoso,
        errores: session.erroresEncontrados,
        tasaExito: ((session.totalEscenas - session.erroresEncontrados) / session.totalEscenas * 100).toFixed(1) + '%'
      }
    };
  }
  
  /**
   * Obtener servicios más utilizados
   */
  private getMostUsedServices(session: SessionMetrics): string[] {
    const serviceCount: Record<string, number> = {};
    
    session.escenas.forEach(escena => {
      escena.serviciosUsados.forEach(servicio => {
        serviceCount[servicio] = (serviceCount[servicio] || 0) + 1;
      });
    });
    
    return Object.entries(serviceCount)
      .sort(([,a], [,b]) => b - a)
      .map(([servicio]) => servicio);
  }
  
  /**
   * Limpiar sesiones antiguas (más de 24 horas)
   */
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionTime = new Date(session.inicioSesion).getTime();
      if (sessionTime < cutoff) {
        this.sessions.delete(sessionId);
        logger.info(`🧹 [Metrics] Sesión limpiada: ${sessionId}`);
      }
    }
  }
}

// Instancia singleton del collector
const metricsCollector = new MetricsCollector();

// Cleanup automático cada hora
setInterval(() => {
  metricsCollector.cleanup();
}, 60 * 60 * 1000);

/**
 * API públicas del servicio de métricas
 */
export function startMetricsSession(sessionId: string, estilo: string, duracionTotal: number): void {
  metricsCollector.startSession(sessionId, estilo, duracionTotal);
}

export function recordSceneMetrics(escena: number, segundo: number, metrics: Partial<SceneMetrics>): void {
  metricsCollector.recordScene(escena, segundo, metrics);
}

export function endMetricsSession(sessionId: string, exitoso: boolean = true): SessionMetrics | null {
  return metricsCollector.endSession(sessionId, exitoso);
}

export function getSessionMetrics(sessionId: string): SessionMetrics | null {
  return metricsCollector.getSession(sessionId);
}

/**
 * Helper para registrar métricas desde TimelineSecond
 */
export function recordTimelineMetrics(timelineSecond: TimelineSecond, additionalMetrics: Partial<SceneMetrics> = {}): void {
  const segundo = timelineSecond.segundo ?? timelineSecond.t ?? 0;
  
  const metrics: Partial<SceneMetrics> = {
    usaLipSync: timelineSecond.metricas?.usaLipSync || false,
    usaCarryover: timelineSecond.metricas?.usaCarryover || false,
    fondoGenerado: timelineSecond.metricas?.fondoGenerado,
    actorGenerado: timelineSecond.metricas?.actorGenerado,
    musicaUsada: timelineSecond.metricas?.musicaUsada,
    sfxUsados: timelineSecond.metricas?.sfxUsados || [],
    tiempoGeneracion: timelineSecond.metricas?.tiempoGeneracion || 0,
    errorOcurrido: timelineSecond.metricas?.errorOcurrido,
    ...additionalMetrics
  };
  
  recordSceneMetrics(segundo, segundo, metrics);
}

/**
 * Generar reporte de debugging para desarrollo
 */
export function generateDebugReport(sessionId: string): string {
  const session = metricsCollector.getSession(sessionId);
  if (!session) {
    return `⚠️ Sesión ${sessionId} no encontrada`;
  }
  
  const summary = metricsCollector['generateSummary'](session);
  
  return `
📊 REPORTE DE DEBUGGING - ${sessionId}
═══════════════════════════════════════════

🎬 INFORMACIÓN GENERAL:
• Estilo: ${session.estilo}
• Duración: ${session.duracionTotal}s
• Escenas: ${session.totalEscenas}
• Estado: ${session.exitoso ? '✅ Exitoso' : '❌ Fallido'}

⏱️ RENDIMIENTO:
• Tiempo total: ${summary.rendimiento.tiempoTotal}ms
• Tiempo promedio: ${summary.rendimiento.tiempoPromedio}ms
• Escena más rápida: ${summary.rendimiento.escenasMasRapida}ms
• Escena más lenta: ${summary.rendimiento.escenaMasLenta}ms

🔧 TECNOLOGÍAS USADAS:
• LipSync: ${summary.tecnologias.lipSyncUsage}
• Carryover: ${summary.tecnologias.carryoverUsage}
• Servicios: ${summary.tecnologias.serviciosPrincipales.join(', ')}

📈 CALIDAD:
• Tasa de éxito: ${summary.calidad.tasaExito}
• Errores: ${summary.calidad.errores}

🔍 DETALLES POR ESCENA:
${session.escenas.map(e => 
  `  ${e.escena}: ${e.tiempoGeneracion}ms | LipSync: ${e.usaLipSync} | Carryover: ${e.usaCarryover} | Servicios: ${e.serviciosUsados.length}`
).join('\n')}

═══════════════════════════════════════════
  `;
}
