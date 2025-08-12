// 🎬 RENDER PIPELINE SIMPLIFICADO Y LIMPIO
// Solo mantiene la lógica esencial, delegando todo a servicios existentes

import { generateUnifiedAudioForPipeline } from '../services/sceneAudioService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { uploadToCDN } from '../services/cdnService.js';
// import { generateMarketingClip, type MarketingRequest, type MarketingResponse } from '../services/marketingService.js';
import { dispatchCerebros, RequestGeneracion, ResponseGeneracion } from '../services/llmService/dispatcher.js';
import { RenderRequest, VideoPlan } from '../utils/types.js';
import { validarRenderRequest } from '../utils/validadores.js';
import { EstiloVisualPrincipal, normalizarEstilo } from '../types/estilos.js';
import { generateKlingClip } from '../services/klingService.js'; // ✅ CORRECTO: Ya usa fal.ai internamente
import { applyLipSyncToPlan } from '../services/lipSyncService.js';
import { CinemaProgressService } from '../services/cinemaProgressService.js'; // ✅ NUEVO: Estados específicos
import { CinemaProjectStore } from '../models/CinemaProject.js'; // ✅ NUEVO: Actualizar proyecto
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
// 🎯 INTEGRACIÓN AUTOMÁTICA DE COHERENCIA
import { coherenciaAutomatica } from '../middleware/coherenciaAutomatic.js';

/**
 * 🎬 PIPELINE PRINCIPAL SIMPLIFICADO
 * Usa toda la funcionalidad existente sin duplicar código
 */
export async function renderVideoSimplificado(
  req: RenderRequest,
  reportProgress: (message: string, progress: number, status?: string) => void = () => {}
): Promise<{
  url: string;
  plan: VideoPlan;
  metadata: any;
}> {
  
  logger.info('[PipelineSimplificado] 🎬 Iniciando renderizado');
  
  // ✅ CREAR REPORTER ESPECÍFICO PARA CINEMA SI HAY PROYECTO
  const projectId = (req as any).projectId;
  let cinemaReporter = reportProgress;
  
  if (projectId) {
    cinemaReporter = CinemaProgressService.createProgressReporter(projectId);
    await CinemaProgressService.reportProgress(projectId, 'procesando_tomas', 'Iniciando procesamiento', 5);
  }

  cinemaReporter('Validando solicitud', 5, 'procesando_tomas');

  try {
    // ✅ PASO 1: Validación
    validarRenderRequest(req);
    
    // ✅ PASO 2: Determinar tipo de renderizado
    if ((req as any).imagenes || (req as any).productImages) {
      return await procesarMarketingAI(req as any, cinemaReporter);
    }
    
  // ✅ PASO 3: Generar plan cinematográfico con información de usuario
  cinemaReporter('Generando plan cinematográfico', 15, 'procesando_tomas');
  const videoPlan = await generarPlan(req);
  
  // ✅ ENRIQUECER METADATA CON INFORMACIÓN DEL USUARIO
  if ((req as any).userId) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({
        where: { id: (req as any).userId }
      });
      
      if (user) {
        videoPlan.metadata = {
          ...videoPlan.metadata,
          userPlan: user.plan,
          userId: user.id,
          userEmail: user.email
        };
        logger.info(`[Pipeline] Plan de usuario: ${user.plan}`);
      }
      
      await prisma.$disconnect();
    } catch (error) {
      logger.warn('[Pipeline] No se pudo obtener información del usuario:', error);
    }
  }    // 🎯 PASO 3.5: APLICAR MEJORAS AUTOMÁTICAS DE COHERENCIA
    cinemaReporter('Aplicando mejoras de coherencia', 25, 'procesando_tomas');
    const planMejorado = await coherenciaAutomatica.mejorarPlanAutomaticamente(videoPlan, {
      visualStyle: req.visualStyle,
      duration: req.duration
    });
    
    // ✅ PASO 4: Generar audio unificado
    reportProgress('Generando locución y audio', 40, 'procesando_audio');
    const audioData = await generarAudioCompleto(planMejorado, req);
    
    // ✅ PASO 5: Usar lógica existente para clips
    reportProgress('Procesando tomas de video', 60, 'procesando_tomas');
    const { clips } = await generarClipsExistente(planMejorado, req, reportProgress);
    
    // ✅ PASO 6: Aplicar lip-sync a los clips si es necesario
    reportProgress('Aplicando sincronización labial', 75, 'procesando_audio');
    const lipSyncResult = await aplicarLipSyncAPlan(planMejorado, clips, audioData, reportProgress);
    
    // ✅ PASO 7: Ensamblar
    cinemaReporter('Montando video final', 90, 'montando');
    const videoFinal = await ensamblarConFFmpeg(planMejorado, lipSyncResult.processedClips, audioData);
    
    // ✅ PASO 8: Renderizar
    cinemaReporter('Renderizando video', 95, 'renderizando');
    
    // ✅ PASO 9: CDN
    cinemaReporter('Subiendo a almacenamiento', 98, 'subiendo');
    const urlFinal = await uploadToCDN(videoFinal, `videos/${planMejorado.id}/${planMejorado.id}.mp4`);
    
    cinemaReporter('Video completado exitosamente', 100, 'completado');
    
    // ✅ ACTUALIZAR PROYECTO SI EXISTE
    if (projectId) {
      await CinemaProjectStore.complete(projectId, urlFinal, {
        duracion: planMejorado.metadata?.duration || req.duration,
        estilo: req.visualStyle,
        serviciosUsados: audioData.metadata?.serviciosUsados || []
      });
    }
    
    return {
      url: urlFinal,
      plan: planMejorado,
      metadata: {
        duracion: planMejorado.metadata?.duration || req.duration,
        estilo: req.visualStyle,
        serviciosUsados: audioData.metadata?.serviciosUsados || [],
        // 🎯 ESTADÍSTICAS DE COHERENCIA APLICADAS
        coherencia: coherenciaAutomatica.obtenerEstadisticas(),
        lipSync: {
          aplicado: lipSyncResult.successful > 0,
          exitosos: lipSyncResult.successful,
          fallidos: lipSyncResult.failed,
          tecnologia: (lipSyncResult as any).technology || 'unknown',
          warnings: lipSyncResult.metadata.warnings
        },
        fechaCreacion: new Date()
      }
    };

  } catch (error) {
    logger.error('[PipelineSimplificado] Error:', error);
    
    // ✅ MARCAR PROYECTO COMO FALLIDO SI EXISTE
    if (projectId) {
      try {
        await CinemaProjectStore.updateEstado(projectId, 'fallido');
        await CinemaProgressService.reportProgress(projectId, 'fallido', 'Error en el procesamiento', 0);
      } catch (updateError) {
        logger.error('[PipelineSimplificado] Error actualizando estado fallido:', updateError);
      }
    }
    
    throw error;
  }
}

/**
 * Marketing AI usando servicio existente
 * TODO: Integrar con nuevo sistema MarketingPipeline
 */
async function procesarMarketingAI(
  req: any, // MarketingRequest, 
  reportProgress: (message: string, progress: number) => void
): Promise<any> {
  
  reportProgress('Procesando marketing AI', 30);
  
  // TODO: Integrar con nuevo MarketingPipeline
  // const resultado: MarketingResponse = await generateMarketingClip(req);
  
  reportProgress('Marketing AI temporalmente deshabilitado', 100);
  
  return {
    url: 'https://storage.googleapis.com/storyteller-ai-cdn/demo/marketing_placeholder.mp4',
    plan: {},
    metadata: { status: 'placeholder' }
  };
}

/**
 * Aplicar lip-sync usando el nuevo servicio integrado
 */
async function aplicarLipSyncAPlan(
  plan: VideoPlan,
  clips: string[],
  audioData: any,
  reportProgress: (message: string, progress: number) => void
) {
  
  // Verificar si necesita lip-sync
  const requiresLipSync = plan.timeline?.some(sec => 
    sec.lipSync && sec.lipSync !== 'none' && sec.lipSync !== ''
  ) || false;
  
  if (!requiresLipSync || !audioData.voiceBuffer || audioData.voiceBuffer.length < 1000) {
    logger.info('[Pipeline] Lip-sync omitido - no requerido o sin audio de voz');
    return {
      processedClips: clips,
      successful: clips.length,
      failed: 0,
      metadata: { warnings: ['Lip-sync omitido'] }
    };
  }
  
  // Guardar audio temporal para lip-sync
  const audioPath = path.join(process.cwd(), 'tmp', `voice_${Date.now()}.wav`);
  await fs.writeFile(audioPath, audioData.voiceBuffer);
  
  try {
    const result = await applyLipSyncToPlan(plan, clips, audioPath);
    
    reportProgress(`Lip-sync: ${result.successful}/${clips.length} exitosos`, 80);
    
    if (result.failed > 0) {
      logger.warn(`[Pipeline] ${result.failed} clips mantuvieron estado original por errores en lip-sync`);
    }
    
    return result;
    
  } finally {
    // Limpiar archivo temporal
    try {
      await fs.unlink(audioPath);
    } catch (error) {
      logger.warn('[Pipeline] Error limpiando archivo temporal de audio:', error);
    }
  }
}

/**
 * Generar plan usando dispatcher existente
 */
async function generarPlan(req: RenderRequest): Promise<VideoPlan> {
  const estilo = normalizarEstilo(req.visualStyle);
  
  const request: RequestGeneracion = {
    prompt: req.prompt,
    duracion: req.duration,
    estilo: estilo as EstiloVisualPrincipal
  };
  
  const response: ResponseGeneracion = await dispatchCerebros(request);
  
  if (!response.success) {
    throw new Error(`Error generando plan: ${response.error}`);
  }
  
  // Convertir tomasReales a timeline para compatibilidad
  const timeline = response.tomasReales?.map((toma, index) => ({
    segundo: index === 0 ? 0 : response.tomasReales!.slice(0, index).reduce((acc, t) => acc + t.duracion, 0),
    duracion: toma.duracion,
    descripcion: toma.descripcion,
    prompt: toma.descripcion,
    fondo: toma.fondo || 'escenas/realista/casa/fachada/día/frontal.png',
    actor: toma.actor || '',
    movimiento_camara: toma.movimientoCamara || 'static',
    transicion: 'fade',
    audio: {
      musica: toma.musica || 'cinematic',
      efectos: toma.efectos || [],
      ambiente: toma.ambiente || 'neutral'
    }
  })) || [];

  // Convertir a VideoPlan usando la estructura existente
  const plan: VideoPlan = {
    id: `video_${Date.now()}`,
    timeline: timeline,
    metadata: {
      duration: req.duration,
      visualStyle: req.visualStyle,
      voiceManual: req.voice,
      musicManual: req.music,
      ...response.metadata
    },
    tomasReales: response.tomasReales
  };
  
  return plan;
}

/**
 * Generar audio usando servicio existente optimizado
 */
async function generarAudioCompleto(plan: VideoPlan, req: RenderRequest): Promise<any> {
  // Asegurar que metadata existe con la estructura correcta
  if (!plan.metadata) {
    plan.metadata = {
      visualStyle: req.visualStyle,
      duration: req.duration
    };
  }
  
  // Configurar assets manuales
  if (req.voice) plan.metadata.voiceManual = req.voice;
  if (req.music) plan.metadata.musicManual = req.music;
  
  // Usar servicio optimizado existente
  return await generateUnifiedAudioForPipeline(plan);
}

/**
 * Generar clips usando lógica existente del pipeline original
 */
async function generarClipsExistente(
  plan: VideoPlan, 
  req: RenderRequest,
  reportProgress: (message: string, progress: number) => void
): Promise<{ clips: string[] }> {
  
  if (!plan.timeline || plan.timeline.length === 0) {
    throw new Error('Plan sin timeline válido');
  }
  
  const clips: string[] = [];
  const totalEscenas = plan.timeline.length;
  
  // ✅ Generar clips SIMULTÁNEAMENTE para mayor velocidad
  logger.info(`🚀 [Pipeline] Generando ${totalEscenas} clips simultáneamente`);
  
  try {
    const clipPromises = plan.timeline.map(async (escena, i) => {
      const clipUrl = await generateKlingClip({
        prompt: escena.prompt || escena.descripcion || `Escena ${i + 1}`,
        input_image_urls: [
          escena.fondo?.ruta || '',
          escena.actor?.archivo || ''
        ].filter(Boolean),
        duration: escena.duracion || 5,
        aspectRatio: '16:9'
      });
      
      logger.info(`✅ [Pipeline] Clip ${i + 1}/${totalEscenas} completado`);
      return clipUrl;
    });
    
    // Esperar a que se completen todos los clips
    const generatedClips = await Promise.all(clipPromises);
    clips.push(...generatedClips);
    
    reportProgress(`Todos los clips generados simultáneamente`, 85);
      
  } catch (error) {
    logger.error(`Error generando clips simultáneamente:`, error);
    throw new Error(`Error en generación simultánea: ${error}`);
  }
  
  return { clips };
}

/**
 * Ensamblar usando FFmpegService existente
 */
async function ensamblarConFFmpeg(
  plan: VideoPlan,
  clips: string[],
  audioData: any
): Promise<string> {
  
  return await assembleVideo({
    plan,
    clips,
    voiceBuffer: audioData.voiceBuffer || Buffer.alloc(0),
    music: [audioData.musicBuffer].filter(Boolean),
    ambience: [],
    sfx: [audioData.sfxBuffer].filter(Boolean),
    elevenlabsFX: audioData.efectosFX || []
  });
}

// ===== EXPORTAR FUNCIONES PRINCIPALES =====

export async function renderCinemaAI(
  req: RenderRequest,
  reportProgress: (message: string, progress: number, status?: string) => void = () => {}
): Promise<any> {
  return await renderVideoSimplificado(req, reportProgress);
}

export async function renderMarketingAI(
  req: any, // MarketingRequest,
  reportProgress: (message: string, progress: number, status?: string) => void = () => {}
): Promise<any> {
  return await procesarMarketingAI(req, reportProgress);
}

export async function renderAutomatic(
  req: any,
  reportProgress: (message: string, progress: number, status?: string) => void = () => {}
): Promise<any> {
  return await renderVideoSimplificado(req, reportProgress);
}
