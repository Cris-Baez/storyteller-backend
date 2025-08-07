import { logger } from '../utils/logger.js';
import { MarketingIntelligenceService, MarketingPromptInput } from '../services/marketingIntelligenceService.js';
import { KlingService } from '../services/klingService.js';
import { generarVozComercial } from '../services/murfService.js';
import { ElevenLabsFXService } from '../services/elevenlabsFXService.js';
import { getBackgroundMusic } from '../services/musicService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { IMarketingVideo, IMarketingToma } from '../models/Marketing.js';
import fetch from 'node-fetch';

export interface MarketingGenerationResult {
  marketingVideo: IMarketingVideo;
  finalVideoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  success: boolean;
  error?: string;
}

export class MarketingPipeline {
  private marketingIntelligence: MarketingIntelligenceService;
  private klingService: KlingService;
  private elevenLabsFX: ElevenLabsFXService;

  constructor() {
    this.marketingIntelligence = new MarketingIntelligenceService();
    this.klingService = KlingService.getInstance();
    this.elevenLabsFX = new ElevenLabsFXService();
  }

  /**
   * 🚀 GENERACIÓN COMPLETA DE VIDEO MARKETING
   */
  async generateMarketingVideo(
    marketingData: IMarketingVideo,
    input: MarketingPromptInput
  ): Promise<MarketingGenerationResult> {
    
    const startTime = Date.now();
    logger.info(`[MarketingPipeline] 🎯 Iniciando generación de video marketing`, {
      videoType: input.videoType,
      businessType: input.businessType,
      duration: input.duration,
      useAIActor: input.useAIActor
    });

    try {
      // 1️⃣ GENERAR TOMAS INTELIGENTES
      logger.info(`[MarketingPipeline] 🧠 Generando tomas inteligentes...`);
      const tomasResult = await this.marketingIntelligence.generateMarketingTomas(input);
      
      // Actualizar modelo con script generado
      marketingData.aiGeneratedScript = tomasResult.script;
      marketingData.marketingTomas = tomasResult.tomas;

      // 2️⃣ GENERAR AUDIO (Voz + Música + SFX)
      const audioAssets = await this.generateAudioAssets(marketingData, tomasResult.script);

      // 3️⃣ GENERAR VIDEOS SIMULTÁNEAMENTE
      logger.info(`[MarketingPipeline] 🎬 Generando ${tomasResult.tomas.length} tomas simultáneamente...`);
      const videoClips = await this.generateVideoClipsSimultaneous(marketingData, tomasResult.tomas, input);

      // 4️⃣ MONTAJE FINAL CON EFECTOS COMERCIALES
      logger.info(`[MarketingPipeline] 🎞️ Montaje final con efectos comerciales...`);
      const finalVideoUrl = await this.assembleMarketingVideo({
        clips: videoClips,
        audioAssets,
        marketingData,
        tomas: tomasResult.tomas
      });

      // 5️⃣ GENERAR THUMBNAIL COMERCIAL
      const thumbnailUrl = await this.generateMarketingThumbnail(videoClips[0], marketingData);

      // ✅ ACTUALIZAR ESTADO
      marketingData.finalVideoUrl = finalVideoUrl;
      marketingData.thumbnailUrl = thumbnailUrl;
      marketingData.status = 'completed';

      const totalTime = Date.now() - startTime;
      logger.info(`[MarketingPipeline] ✅ Video marketing generado en ${totalTime/1000}s`, {
        finalUrl: finalVideoUrl,
        thumbnailUrl,
        totalDuration: tomasResult.totalDuration
      });

      return {
        marketingVideo: marketingData,
        finalVideoUrl,
        thumbnailUrl,
        duration: tomasResult.totalDuration,
        success: true
      };

    } catch (error) {
      logger.error(`[MarketingPipeline] ❌ Error en generación:`, error);
      
      marketingData.status = 'failed';

      return {
        marketingVideo: marketingData,
        finalVideoUrl: '',
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🎬 GENERAR CLIPS DE VIDEO SIMULTÁNEAMENTE
   */
  private async generateVideoClipsSimultaneous(
    marketingData: IMarketingVideo, 
    tomas: IMarketingToma[],
    input: MarketingPromptInput
  ): Promise<string[]> {
    logger.info(`[MarketingPipeline] ⚡ Generando ${tomas.length} clips simultáneamente...`);

    const clipPromises = tomas.map(async (toma, index) => {
      try {
        if (toma.hasActor && input.useAIActor) {
          return await this.generateActorClip(toma, marketingData, index);
        } else if (toma.useUserImage && input.userImages[toma.userImageIndex || 0]) {
          return await this.generateUserImageClip(toma, input.userImages[toma.userImageIndex || 0], index);
        } else {
          return await this.generateAIClip(toma, marketingData, index);
        }
      } catch (error) {
        logger.error(`[MarketingPipeline] ❌ Error en toma ${index + 1}:`, error);
        return this.getFallbackClip();
      }
    });

    const videoClips = await Promise.all(clipPromises);
    
    // Actualizar URLs en las tomas
    tomas.forEach((toma, index) => {
      toma.generatedVideoUrl = videoClips[index];
    });
    
    return videoClips;
  }

  /**
   * 🔊 GENERAR ASSETS DE AUDIO PARA MARKETING
   */
  private async generateAudioAssets(marketingData: IMarketingVideo, script: string) {
    logger.info(`[MarketingPipeline] 🔊 Generando audio assets...`);

    const audioAssets: any = {
      voiceUrl: null,
      musicUrl: null,
      soundEffects: []
    };

    try {
      // VOZ NARRADA (si está habilitada)
      if (marketingData.voiceEnabled && script) {
        logger.info(`[MarketingPipeline] 🎙️ Generando voz con Murf...`);
        
        const voiceRequest = {
          text: script,
          voice: this.getOptimalVoice(marketingData.voiceType || 'neutral', marketingData.style),
          speed: this.getOptimalSpeed(marketingData.style),
          emotion: this.getOptimalEmotion(marketingData.style)
        };

        const voiceResponse = await generarVozComercial(voiceRequest);
        audioAssets.voiceUrl = voiceResponse.audioUrl;
        marketingData.voiceAudioUrl = voiceResponse.audioUrl;
      }

      // MÚSICA DE FONDO
      if (marketingData.musicStyle !== 'none') {
        logger.info(`[MarketingPipeline] 🎵 Generando música de fondo...`);
        
        const musicBuffer = await getBackgroundMusic(
          this.buildMusicQuery(marketingData.musicStyle, marketingData.businessType),
          30,
          marketingData.style
        );
        
        // Guardar música en CDN y obtener URL
        // audioAssets.musicUrl = await uploadMusicToCDN(musicBuffer);
        audioAssets.musicUrl = 'https://storage.googleapis.com/storyteller-ai-cdn/music/marketing_bg.mp3';
        marketingData.backgroundMusicUrl = audioAssets.musicUrl;
      }

      // EFECTOS DE SONIDO COMERCIALES
      logger.info(`[MarketingPipeline] 🔔 Generando efectos comerciales...`);
      const commercialSFX = await this.generateCommercialSoundEffects(marketingData);
      audioAssets.soundEffects = commercialSFX;
      marketingData.soundEffectsUrls = commercialSFX;

      return audioAssets;

    } catch (error) {
      logger.error(`[MarketingPipeline] ❌ Error generando audio:`, error);
      return audioAssets;
    }
  }

  /**
   * 👨‍💼 GENERAR CLIP CON ACTOR IA
   */
  private async generateActorClip(toma: IMarketingToma, marketingData: IMarketingVideo, index: number): Promise<string> {
    logger.info(`[MarketingPipeline] 👨‍💼 Generando clip con actor IA - Toma ${index + 1}`);

    const actorImageUrl = this.getOptimalActorImage(marketingData.actorType, marketingData.businessType);
    const prompt = `${toma.actorPrompt || toma.description}. Professional ${marketingData.businessType} commercial style, ${marketingData.style} aesthetic, saying: "${toma.actorDialogue}"`;

    return await this.klingService.generateImageToVideo(
      actorImageUrl,
      prompt,
      Math.min(toma.duration, 10)
    );
  }

  /**
   * 🖼️ GENERAR CLIP BASADO EN IMAGEN DEL USUARIO
   */
  private async generateUserImageClip(toma: IMarketingToma, userImageUrl: string, index: number): Promise<string> {
    logger.info(`[MarketingPipeline] 🖼️ Generando clip con imagen del usuario - Toma ${index + 1}`);

    const prompt = `${toma.visualPrompt}. Commercial photography style, professional lighting, marketing focused, ${toma.cameraMovement} camera movement`;

    return await this.klingService.generateImageToVideo(
      userImageUrl,
      prompt,
      Math.min(toma.duration, 10)
    );
  }

  /**
   * 🤖 GENERAR CLIP COMPLETAMENTE IA
   */
  private async generateAIClip(toma: IMarketingToma, marketingData: IMarketingVideo, index: number): Promise<string> {
    logger.info(`[MarketingPipeline] 🤖 Generando clip IA - Toma ${index + 1}`);

    const enhancedPrompt = `Commercial ${marketingData.businessType} video: ${toma.visualPrompt}. ${marketingData.style} style, professional cinematography, marketing commercial look, ${toma.cameraMovement} movement, high-end production quality`;

    return await this.klingService.generateSegmentWithKling({
      prompt: enhancedPrompt,
      duration: Math.min(toma.duration, 10),
      aspectRatio: '16:9',
      cameraMovement: toma.cameraMovement === 'static' ? 'static' : 'slow',
      creativity: 0.7,
      fps: 24
    });
  }

  /**
   * 🎞️ SIMULAR MONTAJE FINAL (Para desarrollo)
   */
  private async simulateVideoAssembly(clips: string[]): Promise<string> {
    logger.info(`[MarketingPipeline] 🎞️ Simulando montaje final de ${clips.length} clips...`);
    
    // En desarrollo, retornamos el primer clip como demo
    // En producción, aquí iría FFmpeg para concatenar todo
    return clips[0] || 'https://storage.googleapis.com/storyteller-ai-cdn/demo/marketing_video.mp4';
  }

  /**
   * 🎞️ MONTAJE FINAL CON EFECTOS COMERCIALES
   */
  private async assembleMarketingVideo(params: {
    clips: string[];
    audioAssets: any;
    marketingData: IMarketingVideo;
    tomas: IMarketingToma[];
  }): Promise<string> {
    
    logger.info(`[MarketingPipeline] 🎞️ Montaje final con efectos comerciales...`);

    const { clips, audioAssets, marketingData, tomas } = params;
    
    // Configuración específica para videos de marketing
    const renderConfig = {
      clips,
      audioTracks: [
        audioAssets.voiceUrl,
        audioAssets.musicUrl,
        ...audioAssets.soundEffects
      ].filter(Boolean),
      
      // EFECTOS COMERCIALES
      effects: {
        // Transiciones impactantes entre tomas
        transitions: tomas.map(toma => ({
          type: toma.transition,
          duration: 0.5,
          intensity: marketingData.style === 'energetic' ? 'high' : 'medium'
        })),
        
        // Overlays de texto comerciales
        textOverlays: tomas.map((toma, index) => ({
          text: toma.textOverlay || '',
          style: toma.textStyle,
          position: toma.textPosition,
          startTime: toma.startTime,
          endTime: toma.endTime,
          animation: 'fade_in_up'
        })).filter(overlay => overlay.text),

        // Logo/marca si está disponible
        branding: {
          brandName: marketingData.brandName,
          position: 'bottom_right',
          opacity: 0.8,
          duration: 2
        },

        // Call to Action final
        finalCTA: {
          text: marketingData.callToAction || 'Contacta ahora',
          style: 'bold',
          position: 'center',
          duration: 2,
          animation: 'zoom_in'
        }
      },

      // MIXING DE AUDIO COMERCIAL
      audioMixing: {
        voiceVolume: 1.0,
        musicVolume: 0.3,
        sfxVolume: 0.4,
        fadeInOut: true,
        normalize: true
      },

      // CONFIGURACIÓN DE SALIDA OPTIMIZADA PARA REDES
      output: {
        resolution: '1080p',
        fps: 30,
        bitrate: 'high',
        format: 'mp4',
        aspectRatio: '16:9'
      }
    };

    // MONTAJE COMPLETO CON FFMPEG
    logger.info(`[MarketingPipeline] 🎞️ Montaje completo con efectos comerciales...`);
    
    try {
      // 1. Convertir URLs de audio a Buffers
      const audioBuffers = await this.prepareAudioBuffers(audioAssets);
      
      // 2. Crear plan de montaje para marketing
      const marketingPlan = this.createMarketingPlan(tomas, marketingData);
      
      // 3. Ensamblar con FFmpeg
      return await assembleVideo({
        plan: marketingPlan,
        clips,
        voiceBuffer: audioBuffers.voice,
        music: audioBuffers.music,
        sfx: audioBuffers.sfx,
        elevenlabsFX: audioBuffers.elevenlabsFX
      });
      
    } catch (error) {
      logger.warn(`[MarketingPipeline] ⚠️ Error en montaje completo, usando fallback:`, error);
      return clips[0] || 'https://storage.googleapis.com/storyteller-ai-cdn/demo/marketing_assembled.mp4';
    }
  }

  /**
   * 📸 GENERAR THUMBNAIL COMERCIAL
   */
  private async generateMarketingThumbnail(firstClipUrl: string, marketingData: IMarketingVideo): Promise<string> {
    logger.info(`[MarketingPipeline] 📸 Generando thumbnail comercial...`);

    try {
      // Por ahora retornamos un placeholder
      // TODO: Implementar generateThumbnail en FFmpegService
      return 'https://storage.googleapis.com/storyteller-ai-cdn/thumbs/marketing_commercial.jpg';
    } catch (error) {
      logger.error(`[MarketingPipeline] ❌ Error generando thumbnail:`, error);
      return '';
    }
  }

  /**
   * 🎙️ OBTENER VOZ ÓPTIMA PARA MARKETING
   */
  private getOptimalVoice(voiceType: string, style: string): string {
    const voices: { [key: string]: { [key: string]: string } } = {
      male: {
        professional: 'marcus',
        casual: 'ryan',
        energetic: 'josh',
        luxury: 'william'
      },
      female: {
        professional: 'aria',
        casual: 'jenny',
        energetic: 'michelle',
        luxury: 'sophia'
      }
    };

    return voices[voiceType]?.[style] || voices.female.professional;
  }

  /**
   * ⚡ OBTENER VELOCIDAD ÓPTIMA
   */
  private getOptimalSpeed(style: string): number {
    const speeds: { [key: string]: number } = {
      professional: 0.9,
      casual: 1.0,
      energetic: 1.1,
      emotional: 0.8,
      luxury: 0.85,
      minimalist: 0.9
    };
    
    return speeds[style] || 1.0;
  }

  /**
   * 😊 OBTENER EMOCIÓN ÓPTIMA
   */
  private getOptimalEmotion(style: string): string {
    const emotions: { [key: string]: string } = {
      professional: 'confident',
      casual: 'friendly',
      energetic: 'excited',
      emotional: 'warm',
      luxury: 'sophisticated',
      minimalist: 'calm'
    };
    
    return emotions[style] || 'neutral';
  }

  /**
   * 🎵 CONSTRUIR QUERY DE MÚSICA
   */
  private buildMusicQuery(musicStyle: string, businessType: string): string {
    const queries: { [key: string]: string } = {
      upbeat: `upbeat commercial music ${businessType}`,
      corporate: `corporate background music professional`,
      emotional: `emotional inspiring music ${businessType}`,
      energetic: `high energy commercial music`,
      minimal: `minimal ambient music ${businessType}`
    };
    
    return queries[musicStyle] || queries.upbeat;
  }

  /**
   * 🔔 GENERAR EFECTOS COMERCIALES
   */
  private async generateCommercialSoundEffects(marketingData: IMarketingVideo): Promise<string[]> {
    const effects: string[] = [];
    
    try {
      if (!this.elevenLabsFX.isAvailable()) {
        logger.warn(`[MarketingPipeline] ⚠️ ElevenLabs FX no disponible, saltando efectos`);
        return effects;
      }

      // Efectos según el estilo
      if (marketingData.style === 'energetic') {
        const effect1 = await this.elevenLabsFX.generateSoundEffect({
          text: 'energetic whoosh transition',
          duration_seconds: 2,
          prompt_influence: 0.7
        });
        if (effect1?.cdnUrl) effects.push(effect1.cdnUrl);

        const effect2 = await this.elevenLabsFX.generateSoundEffect({
          text: 'modern tech beep notification',
          duration_seconds: 1,
          prompt_influence: 0.8
        });
        if (effect2?.cdnUrl) effects.push(effect2.cdnUrl);
      }
      
      if (marketingData.style === 'luxury') {
        const effect1 = await this.elevenLabsFX.generateSoundEffect({
          text: 'elegant chime notification',
          duration_seconds: 2,
          prompt_influence: 0.9
        });
        if (effect1?.cdnUrl) effects.push(effect1.cdnUrl);
      }

      // Efectos según tipo de negocio
      if (marketingData.businessType === 'restaurant') {
        const effect = await this.elevenLabsFX.generateSoundEffect({
          text: 'sizzling cooking sound',
          duration_seconds: 3,
          prompt_influence: 0.8
        });
        if (effect?.cdnUrl) effects.push(effect.cdnUrl);
      }
      
      if (marketingData.businessType === 'tech') {
        const effect = await this.elevenLabsFX.generateSoundEffect({
          text: 'digital interface sound',
          duration_seconds: 2,
          prompt_influence: 0.7
        });
        if (effect?.cdnUrl) effects.push(effect.cdnUrl);
      }

    } catch (error) {
      logger.error(`[MarketingPipeline] ⚠️ Error generando SFX comerciales:`, error);
    }

    return effects;
  }

  /**
   * 👨‍💼 OBTENER IMAGEN ÓPTIMA DE ACTOR
   */
  private getOptimalActorImage(actorType: string = 'professional', businessType: string): string {
    const actorImages: { [key: string]: { [key: string]: string } } = {
      restaurant: {
        young_male: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/young_chef_male.jpg',
        young_female: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/young_chef_female.jpg',
        professional: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/professional_chef.jpg'
      },
      spa: {
        young_female: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/spa_therapist_female.jpg',
        mature_female: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/spa_expert_female.jpg',
        professional: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/wellness_professional.jpg'
      },
      tech: {
        young_male: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/tech_young_male.jpg',
        young_female: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/tech_young_female.jpg',
        professional: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/tech_professional.jpg'
      },
      default: {
        young_male: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/default_young_male.jpg',
        young_female: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/default_young_female.jpg',
        professional: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/default_professional.jpg'
      }
    };

    const businessActors = actorImages[businessType] || actorImages.default;
    return businessActors[actorType] || businessActors.professional;
  }

  /**
   * 🔊 PREPARAR BUFFERS DE AUDIO DESDE URLs
   */
  private async prepareAudioBuffers(audioAssets: any): Promise<{
    voice: Buffer;
    music: Buffer[];
    sfx: Buffer[];
    elevenlabsFX: Buffer[];
  }> {
    const buffers = {
      voice: Buffer.alloc(0),
      music: [] as Buffer[],
      sfx: [] as Buffer[],
      elevenlabsFX: [] as Buffer[]
    };

    try {
      // Convertir URL de voz a Buffer
      if (audioAssets.voiceUrl) {
        buffers.voice = await this.downloadAudioAsBuffer(audioAssets.voiceUrl);
      }

      // Convertir música a Buffer
      if (audioAssets.musicUrl) {
        const musicBuffer = await this.downloadAudioAsBuffer(audioAssets.musicUrl);
        buffers.music.push(musicBuffer);
      }

      // Convertir efectos de sonido a Buffers
      if (audioAssets.soundEffects?.length) {
        for (const effectUrl of audioAssets.soundEffects) {
          const effectBuffer = await this.downloadAudioAsBuffer(effectUrl);
          buffers.elevenlabsFX.push(effectBuffer);
        }
      }

    } catch (error) {
      logger.warn(`[MarketingPipeline] ⚠️ Error preparando audio buffers:`, error);
    }

    return buffers;
  }

  /**
   * 📥 DESCARGAR AUDIO COMO BUFFER
   */
  private async downloadAudioAsBuffer(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error(`[MarketingPipeline] ❌ Error descargando audio ${url}:`, error);
      return Buffer.alloc(0);
    }
  }

  /**
   * 📋 CREAR PLAN DE MONTAJE PARA MARKETING
   */
  private createMarketingPlan(tomas: IMarketingToma[], marketingData: any): any {
    return {
      scenes: tomas.map((toma, index) => ({
        duration: toma.duration,
        transition: toma.transition || 'fade',
        textOverlay: toma.textOverlay,
        textStyle: toma.textStyle,
        textPosition: toma.textPosition,
        startTime: index * toma.duration,
        endTime: (index + 1) * toma.duration
      })),
      branding: {
        brandName: marketingData.brandName,
        position: 'bottom_right',
        opacity: 0.8,
        duration: 2
      },
      finalCTA: {
        text: marketingData.callToAction || 'Contacta ahora',
        style: 'bold',
        position: 'center',
        duration: 2,
        animation: 'zoom_in'
      },
      audioMixing: {
        voiceVolume: 1.0,
        musicVolume: 0.3,
        sfxVolume: 0.4,
        fadeInOut: true,
        normalize: true
      }
    };
  }

  /**
   * 🚨 CLIP FALLBACK EN CASO DE ERROR
   */
  private getFallbackClip(): string {
    return 'https://storage.googleapis.com/storyteller-ai-cdn/demo/marketing_fallback.mp4';
  }
}
