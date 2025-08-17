import { logger } from '../utils/logger.js';
import { EnhancedMarketingIntelligenceService, MarketingPromptInput } from '../services/enhancedMarketingIntelligenceService.js';
import { KlingService } from '../services/klingService.js';
import { generarVozComercial } from '../services/murfService.js';
import { ElevenLabsFXService } from '../services/elevenlabsFXService.js';
import { getBackgroundMusic } from '../services/musicService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { IMarketingVideo, IMarketingToma } from '../models/Marketing.js';
import fetch from 'node-fetch';

// 🚀 FASE 4: SISTEMA DUAL ENGINE - NUEVOS IMPORTS
import { selectOptimalEngine, trackEnginePerformance } from '../services/videoGeneration/engineSelector.js';
import { buildRunwayCommercialPrompt, submitRunwayRequest, waitForRunwayCompletion } from '../services/videoGeneration/runwayCommercial.js';
import { buildKlingCommercialPrompt, submitKlingRequest, waitForKlingCompletion } from '../services/videoGeneration/klingCommercial.js';
import { convertirImagenesEstaticasADinamicas, ConceptoVisual } from '../services/llmService/estilos/marketing/creativeDirector.js';

// Cerebros de marketing
import { analyzeBusinessFromImages } from '../services/llmService/estilos/marketing/businessAnalyst.js';
import { createCompleteStrategy } from '../services/llmService/estilos/marketing/contentStrategist.js';

// Interface simplificada usando nuestros cerebros
export interface MarketingVideoRequest {
  businessImages: string[];
  businessDescription: string;
  videoType: 'commercial' | 'social' | 'explainer' | 'testimonial';
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube';
  duration: number;
  voiceStyle?: 'professional' | 'casual' | 'energetic' | 'conversational';
  useAIActor?: boolean;
}

export class MarketingPipeline {
  private klingService: KlingService;
  private elevenLabsFX: ElevenLabsFXService;

  constructor() {
    this.klingService = KlingService.getInstance();
    this.elevenLabsFX = new ElevenLabsFXService();
    logger.info('[MarketingPipeline] ✨ Inicializado con cerebros de marketing + Sistema Dual Engine (Runway + Kling)');
  }

  /**
   * 🎯 PIPELINE COMPLETO DE MARKETING CON CEREBROS + DUAL ENGINE
   * FASE 4: Usa selector inteligente para elegir entre Runway Gen-4 Turbo y Kling Elements
   */
  async generateMarketingVideo(request: MarketingVideoRequest): Promise<any> {
    const startTime = Date.now();
    logger.info(`[MarketingPipeline] 🚀 Iniciando generación de video ${request.videoType} para ${request.platform}`);

    // Crear objeto para tracking
    const marketingData = {
      userId: 'pipeline-user',
      title: `${request.videoType} video`,
      description: request.businessDescription,
      businessType: 'other' as const,
      videoType: request.videoType === 'commercial' ? 'promotional' as const : 
                  request.videoType === 'social' ? 'social_media' as const : 'promotional' as const,
      style: 'professional' as const,
      duration: request.duration as (15 | 30 | 45 | 60),
      userImages: request.businessImages,
      useAIActor: request.useAIActor || false,
      voiceEnabled: true,
      musicStyle: 'corporate' as const,
      status: 'procesando_tomas' as const,
      isAgentMode: false,
      marketingTomas: [] as IMarketingToma[],
      aiGeneratedScript: '',
      finalVideoUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // 1️⃣ USAR CEREBROS DE MARKETING (reemplaza MarketingIntelligenceService)
      logger.info(`[MarketingPipeline] 🧠 Ejecutando cerebros de marketing...`);
      const enhancedService = new EnhancedMarketingIntelligenceService();
      const marketingResult = await enhancedService.generateMarketingTomas({
        businessType: request.businessDescription,
        videoType: request.videoType,
        style: 'commercial',
        duration: request.duration,
        userImages: request.businessImages,
        useAIActor: request.useAIActor || false
      });
      
      // Actualizar modelo con datos de cerebros
      marketingData.aiGeneratedScript = marketingResult.script;
      marketingData.marketingTomas = marketingResult.tomas;

      // 2️⃣ GENERAR AUDIO (Voz + Música + SFX)
      const audioAssets = await this.generateAudioAssets(marketingResult.script);

      // 3️⃣ GENERAR VIDEO CLIPS
      logger.info(`[MarketingPipeline] 🎬 Generando ${marketingResult.tomas.length} tomas simultáneamente...`);
      const videoClips = await this.generateVideoClipsSimultaneous(marketingResult.tomas, request);

      // 4️⃣ ENSAMBLAR VIDEO FINAL
      const finalVideoPath = await assembleVideo({
        plan: {
          timeline: marketingResult.tomas.map((toma: any, index: number) => ({
            segundo: index * 5,
            t: index * 5,
            visual: toma.prompt,
            hasVoice: true,
            volume: 1.0
          })),
          metadata: {
            visualStyle: 'cinematic' as const,
            duration: request.duration as (15 | 30 | 45 | 60),
            prompt: request.businessDescription
          }
        },
        clips: videoClips.map(clip => clip.videoPath),
        voiceBuffer: audioAssets.voice?.audioBuffer || Buffer.from(''),
        music: audioAssets.music ? [audioAssets.music] : [],
        elevenlabsFX: audioAssets.sfx ? [audioAssets.sfx] : undefined
      });

      // COMPLETADO
      marketingData.status = 'completado' as any;
      marketingData.finalVideoUrl = finalVideoPath;

      logger.info(`[MarketingPipeline] ✅ Video completado: ${finalVideoPath}`);
      
      return marketingData;

    } catch (error: any) {
      logger.error(`[MarketingPipeline] ❌ Error: ${error.message}`);
      marketingData.status = 'fallido' as any;
      
      return {
        ...marketingData,
        duration: request.duration as (15 | 30 | 45 | 60),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🎵 GENERAR AUDIO COMPLETO (Voz + Música + SFX)
   */
  private async generateAudioAssets(script: string) {
    logger.info(`[MarketingPipeline] 🎵 Generando audio assets...`);

    // Voz principal con Murf
    const voiceAudio = await generarVozComercial({
      text: script,
      voice: 'en-US-mark',
      style: 'commercial'
    });

    // Música de fondo
    const backgroundMusic = await getBackgroundMusic('commercial');

    // SFX con ElevenLabsFX 🔥
    const sfxAudio = await this.elevenLabsFX.generateSoundEffect({
      text: `Commercial sound effects for marketing video`,
      duration_seconds: 5
    });

    return {
      voice: voiceAudio,
      music: backgroundMusic,
      sfx: sfxAudio?.audio
    };
  }

  /**
   * 🚀 NUEVO MÉTODO - GENERACIÓN CON SISTEMA DUAL ENGINE (FASE 4)
   * Usa selector inteligente para elegir entre Runway Gen-4 Turbo y Kling Elements
   */
  async generateMarketingVideoWithDualEngine(request: {
    businessImages: string[];
    businessDescription: string;
    videoType: 'commercial' | 'social' | 'explainer' | 'testimonial';
    platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube';
    duration: number;
  }): Promise<any> {
    const startTime = Date.now();
    logger.info(`[MarketingPipeline] 🎬 DUAL ENGINE - Iniciando generación ${request.videoType} para ${request.platform}`);

    try {
      // 1️⃣ ANÁLISIS DE NEGOCIO CON CEREBROS
      logger.info(`[MarketingPipeline] 🧠 Ejecutando cerebros de marketing...`);
      
      const businessAnalysis = await analyzeBusinessFromImages(
        request.businessImages, 
        request.businessDescription
      );
      
      const contentStrategy = await createCompleteStrategy(businessAnalysis);

      // 2️⃣ GENERAR CONCEPTOS VISUALES CON CAMERA MOVEMENTS
      logger.info(`[MarketingPipeline] 🎨 Generando conceptos visuales cinematográficos...`);
      
      const conceptosVisuales = await convertirImagenesEstaticasADinamicas(
        request.businessImages,
        contentStrategy,
        businessAnalysis
      );

      // 3️⃣ GENERAR VIDEOS CON SELECTOR INTELIGENTE
      logger.info(`[MarketingPipeline] ⚡ Generando videos con sistema dual engine...`);
      
      const videosGenerados = await this.generateVideosWithDualEngine({
        conceptosVisuales,
        businessAnalysis,
        imagenesFuente: request.businessImages,
        platform: request.platform
      });

      // 4️⃣ GENERAR AUDIO ASSETS
      const script = this.generateScriptFromConcepts(conceptosVisuales, businessAnalysis);
      const audioAssets = await this.generateAudioAssets(script);

      // 5️⃣ ENSAMBLAR VIDEO FINAL
      const finalVideoPath = await this.assembleMultiEngineVideo(
        videosGenerados, 
        audioAssets, 
        conceptosVisuales
      );

      const totalTime = Date.now() - startTime;
      logger.info(`[MarketingPipeline] ✅ DUAL ENGINE completado en ${Math.round(totalTime / 1000)}s`);

      return {
        success: true,
        finalVideoUrl: finalVideoPath,
        metadata: {
          enginesUsed: videosGenerados.map(v => v.engineUsed),
          businessAnalysis,
          conceptosVisuales,
          processingTime: totalTime,
          totalClips: videosGenerados.length
        }
      };

    } catch (error: any) {
      logger.error(`[MarketingPipeline] ❌ DUAL ENGINE Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🎬 GENERACIÓN CON DUAL ENGINE - CORAZÓN DEL SISTEMA
   */
  private async generateVideosWithDualEngine(request: {
    conceptosVisuales: ConceptoVisual[];
    businessAnalysis: any;
    imagenesFuente: string[];
    platform: string;
  }): Promise<any[]> {
    const videos: any[] = [];
    
    logger.info(`[MarketingPipeline] 🔄 Procesando ${request.conceptosVisuales.length} conceptos visuales...`);

    // Procesar cada concepto visual
    for (let i = 0; i < request.conceptosVisuales.length; i++) {
      const concepto = request.conceptosVisuales[i];
      const imagen = request.imagenesFuente[i];
      
      try {
        logger.info(`[MarketingPipeline] 📋 Concepto ${i + 1}: ${concepto.transformacionesImagen.movimientoCamara}`);
        
        // 🧠 SELECTOR INTELIGENTE DE ENGINE
        const engineRecommendation = selectOptimalEngine(concepto, request.businessAnalysis);
        
        logger.info(`[MarketingPipeline] 🎯 Engine seleccionado: ${engineRecommendation.selectedEngine.toUpperCase()} (confianza: ${Math.round(engineRecommendation.confidence * 100)}%)`);
        
        let videoUrl: string;
        let processingTime: number;
        const clipStartTime = Date.now();
        
        if (engineRecommendation.selectedEngine === 'runway') {
          // 🚀 RUNWAY GEN-4 TURBO
          const runwayRequest = buildRunwayCommercialPrompt(imagen, concepto, request.businessAnalysis);
          const taskId = await submitRunwayRequest(runwayRequest);
          videoUrl = await waitForRunwayCompletion(taskId);
          processingTime = Date.now() - clipStartTime;
          
          logger.info(`[MarketingPipeline] 🚀 Runway completado en ${Math.round(processingTime / 1000)}s`);
          
        } else {
          // 🎬 KLING ELEMENTS
          const klingRequest = buildKlingCommercialPrompt(imagen, concepto, request.businessAnalysis);
          const taskId = await submitKlingRequest(klingRequest);
          videoUrl = await waitForKlingCompletion(taskId);
          processingTime = Date.now() - clipStartTime;
          
          logger.info(`[MarketingPipeline] 🎬 Kling completado en ${Math.round(processingTime / 1000)}s`);
        }
        
        // Registrar métricas para ML futuro
        trackEnginePerformance({
          engineUsed: engineRecommendation.selectedEngine,
          processingTime: processingTime / 1000, // seconds
          qualityScore: engineRecommendation.confidence,
          costEfficiency: engineRecommendation.costEstimate.recommended,
          businessType: request.businessAnalysis.businessType || 'unknown',
          contentType: concepto.transformacionesImagen.movimientoCamara
        });
        
        videos.push({
          videoUrl,
          concepto,
          engineUsed: engineRecommendation.selectedEngine,
          processingTime,
          confidence: engineRecommendation.confidence,
          cost: engineRecommendation.costEstimate.recommended
        });
        
      } catch (error: any) {
        logger.error(`[MarketingPipeline] ❌ Error en concepto ${i + 1}: ${error.message}`);
        // Continuar con el siguiente concepto
      }
    }
    
    logger.info(`[MarketingPipeline] ✅ Generados ${videos.length}/${request.conceptosVisuales.length} videos`);
    return videos;
  }

  /**
   * 🎵 GENERAR SCRIPT DESDE CONCEPTOS
   */
  private generateScriptFromConcepts(conceptos: ConceptoVisual[], businessAnalysis: any): string {
    const businessType = businessAnalysis.businessType || 'business';
    const brandPersonality = businessAnalysis.brandPersonality || 'professional';
    
    // Script adaptado al tipo de negocio
    const scripts = {
      concierge: brandPersonality === 'luxury' 
        ? "Experience the pinnacle of luxury concierge services. Where excellence meets expectation."
        : "Professional concierge services that save you time and deliver results you can trust.",
      restaurant: "Discover culinary excellence that transforms every meal into an unforgettable experience.",
      boutique: "Fashion that speaks your language. Style that tells your story.",
      services: "Expert solutions tailored to your business needs. Results you can rely on."
    };
    
    return scripts[businessType as keyof typeof scripts] || 
           "Professional excellence that makes the difference. Discover what sets us apart.";
  }

  /**
   * 🎬 ENSAMBLAR VIDEO MULTI-ENGINE
   */
  private async assembleMultiEngineVideo(
    videos: any[], 
    audioAssets: any, 
    conceptos: ConceptoVisual[]
  ): Promise<string> {
    logger.info(`[MarketingPipeline] 🎞️ Ensamblando video final con ${videos.length} clips...`);
    
    // Crear timeline basado en conceptos y videos
    const timeline = videos.map((video, index) => ({
      segundo: index * 5, // 5 segundos por clip
      t: index * 5,
      visual: conceptos[index]?.overlayTextos[0]?.texto || `Scene ${index + 1}`,
      hasVoice: true,
      volume: 1.0
    }));
    
    const finalVideoPath = await assembleVideo({
      plan: {
        timeline,
        metadata: {
          visualStyle: 'cinematic' as const,
          duration: videos.length * 5 as (15 | 30 | 45 | 60),
          prompt: 'Multi-engine marketing video'
        }
      },
      clips: videos.map(video => video.videoUrl),
      voiceBuffer: audioAssets.voice?.audioBuffer || Buffer.from(''),
      music: audioAssets.music ? [audioAssets.music] : [],
      elevenlabsFX: audioAssets.sfx ? [audioAssets.sfx] : undefined
    });
    
    return finalVideoPath;
  }

  /**
   * 🎬 GENERAR CLIPS DE VIDEO SIMULTÁNEOS
   */
  private async generateVideoClipsSimultaneous(
    tomas: any[], 
    request: MarketingVideoRequest
  ) {
    const clipPromises = tomas.map((toma, index) => 
      this.generateSingleClip(toma, index, request)
    );

    return await Promise.all(clipPromises);
  }

  /**
   * 🎥 GENERAR UN CLIP INDIVIDUAL
   */
  private async generateSingleClip(toma: any, index: number, request: MarketingVideoRequest) {
    try {
      // Usar Kling para generar video
      if (toma.hasActor && request.useAIActor) {
        return await this.generateAIActorClip(toma, index);
      } else if (toma.useUserImage && request.businessImages[toma.userImageIndex || 0]) {
        return await this.generateUserImageClip(toma, request.businessImages[toma.userImageIndex || 0], index);
      } else {
        return await this.generateStandardClip(toma, index);
      }
    } catch (error: any) {
      logger.error(`[MarketingPipeline] ❌ Error en toma ${index}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🤖 GENERAR CLIP CON ACTOR AI
   */
  private async generateAIActorClip(toma: any, index: number) {
    logger.info(`[MarketingPipeline] 🤖 Generando clip con actor AI - Toma ${index + 1}`);

    const klingResponse = await this.klingService.generateSegmentWithKling({
      prompt: `${toma.prompt} with AI actor speaking professionally`,
      duration: toma.duration,
      aspectRatio: "16:9",
      creativity: 0.7,
      fps: 24,
      cameraMovement: toma.cameraMovement || "static"
    });

    return {
      tomaId: toma.tomaId,
      videoPath: klingResponse,
      duration: toma.duration,
      hasActor: true
    };
  }

  /**
   * 📸 GENERAR CLIP CON IMAGEN DE USUARIO
   */
  private async generateUserImageClip(toma: any, userImage: string, index: number) {
    logger.info(`[MarketingPipeline] 📸 Generando clip con imagen de usuario - Toma ${index + 1}`);

    const klingResponse = await this.klingService.generateImageToVideo(
      userImage, 
      toma.prompt, 
      toma.duration
    );

    return {
      tomaId: toma.tomaId,
      videoPath: klingResponse,
      duration: toma.duration,
      useUserImage: true
    };
  }

  /**
   * 🎨 GENERAR CLIP ESTÁNDAR
   */
  private async generateStandardClip(toma: any, index: number) {
    logger.info(`[MarketingPipeline] 🎨 Generando clip estándar - Toma ${index + 1}`);

    const klingResponse = await this.klingService.generateSegmentWithKling({
      prompt: toma.prompt,
      duration: toma.duration,
      aspectRatio: "16:9",
      creativity: 0.6,
      fps: 24,
      cameraMovement: toma.cameraMovement || "static"
    });

    return {
      tomaId: toma.tomaId,
      videoPath: klingResponse,
      duration: toma.duration,
      standard: true
    };
  }

  /**
   * 📊 STATUS CHECK
   */
  async getStatus(marketingId: string): Promise<any> {
    // Implementar lógica de estado
    return {
      status: 'processing',
      progress: 75
    };
  }
}

export default MarketingPipeline;
