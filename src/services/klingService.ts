
// src/services/klingService.ts
// Servicio para generar clips usando Kling Elements (Fal.ai)

import { fal } from '@fal-ai/client';
import fetch from 'node-fetch';
import { safeLog, hasLargeBase64 } from '../utils/logger.js';

fal.config({ credentials: process.env.FAL_KEY });

type DurationType = '5' | '10';
type AspectRatioType = '16:9' | '1:1' | '9:16';

export interface KlingClipParams {
  prompt: string;
  input_image_urls: string[];
  duration: number | DurationType;
  aspect_ratio?: string | AspectRatioType;
  negative_prompt?: string;
  [key: string]: any;
}

/**
 * Convierte una URL de imagen a base64 con logging seguro
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    safeLog('[KlingService] Convirtiendo URL a base64:', { 
      url: url.substring(0, 80) + '...',
      length: url.length 
    });
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Determinar tipo MIME basado en la extensión
    let mimeType = 'image/jpeg'; // por defecto
    if (url.toLowerCase().includes('.png')) mimeType = 'image/png';
    else if (url.toLowerCase().includes('.webp')) mimeType = 'image/webp';
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    safeLog('[KlingService] ✅ Conversión exitosa:', { 
      sizeKB: Math.round(base64.length / 1024),
      mimeType 
    });
    
    return dataUrl;
  } catch (error) {
    console.error(`[KlingService] ❌ Error convirtiendo URL a base64:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo convertir la imagen ${url} a base64: ${errorMessage}`);
  }
}

export async function generateKlingClip(params: KlingClipParams): Promise<string> {
  console.log('[KlingService] [Validación] Iniciando generación de clip profesional:', { 
    promptLength: params.prompt?.length || 0, 
    imageCount: params.input_image_urls?.length || 0,
    duration: params.duration,
    flujo: 'fondo → actor → base64 → Kling → Kontext → voz/música → edición → exportar'
  });
  
  // ✅ VALIDACIONES DEFINITIVAS AGREGADAS
  const { prompt, input_image_urls, duration, aspect_ratio, negative_prompt } = params;
  
  // Validar que existen URLs de background y actor
  if (!input_image_urls || input_image_urls.length < 2) {
    throw new Error('Se requieren al menos 2 URLs de imagen (background y actor)');
  }
  
  const [background, actor] = input_image_urls;
  
  // Validar background con URL válida
  if (!background?.startsWith("https://")) {
    throw new Error("🎨 Background no tiene URL válida.");
  }
  
  // Validar actor con URL válida  
  if (!actor?.startsWith("https://")) {
    throw new Error("🧍 Actor no tiene URL válida.");
  }
  
  // Validar prompt visual
  if (!prompt || prompt.length < 20) {
    throw new Error("🧠 Prompt visual demasiado corto o inválido.");
  }
  
  // Validación estricta de campos requeridos según flujo profesional
  if (!prompt || typeof prompt !== 'string') {
    console.log('[KlingService] [Error] Prompt inválido:', { prompt });
    throw new Error('El campo prompt es requerido y debe ser string');
  }
  if (!Array.isArray(input_image_urls) || input_image_urls.length < 2 || !input_image_urls.every(url => typeof url === 'string')) {
    console.log('[KlingService] [Error] URLs de imagen inválidas (deben ser fondo y actor):', { input_image_urls });
    throw new Error('input_image_urls debe ser un array de al menos dos strings (fondo y actor)');
  }
  
  // Validar que las URLs sean accesibles públicamente
  for (const url of input_image_urls) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log('[KlingService] [Error] URL no pública detectada:', { url });
      throw new Error(`URL de imagen no es accesible públicamente: ${url}. Fal.ai necesita URLs públicas.`);
    }
  }
  console.log('[KlingService] [Validación] URLs validadas correctamente:', { count: input_image_urls.length });
  
  // ✅ RESTAURADO: Convertir URLs a base64 (requerido por Fal.ai)
  safeLog('[KlingService] 🔄 Convirtiendo imágenes a base64 (requerido por Fal.ai)...');
  const input_images_base64: string[] = [];
  
  for (let i = 0; i < input_image_urls.length; i++) {
    const url = input_image_urls[i];
    try {
      const base64 = await urlToBase64(url);
      input_images_base64.push(base64);
      safeLog(`[KlingService] ✅ Imagen ${i + 1}/${input_image_urls.length} convertida`);
    } catch (error) {
      console.error(`[KlingService] ❌ Error convirtiendo imagen ${i + 1}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Fallo al procesar imagen ${i + 1}: ${errorMessage}`);
    }
  }
  
  const durationLiteral: "5" | "10" = String(duration) === '10' ? '10' : '5';
  const allowedAspectRatios: AspectRatioType[] = ['16:9', '1:1', '9:16'];
  const aspectRatioStr: AspectRatioType = allowedAspectRatios.includes(aspect_ratio as AspectRatioType) ? aspect_ratio as AspectRatioType : '16:9';
  const negativePromptStr = negative_prompt || 'blur, distort, and low quality';
  console.log('[KlingService] [Parámetros] Parámetros procesados:', { 
    duration: durationLiteral, 
    aspectRatio: aspectRatioStr, 
    negativePrompt: negativePromptStr.substring(0, 50) + '...' 
  });

  // Construir el payload usando imágenes en base64
  const payload: any = {
    prompt,
    input_image_urls: input_images_base64, // ✅ RESTAURADO: Usar base64 requerido por Fal.ai
    duration: durationLiteral,
    aspect_ratio: aspectRatioStr,
    negative_prompt: negativePromptStr
  };

  // Campos avanzados para edición, dirección de arte, clima, motivo visual, audio, etc.
  const extraFields = [
    'camera', 'visual', 'effects', 'emotion', 'music', 'multitude', 'voz', 'lipSync', 'parametrosVoz',
    'presentador', 'miradaACamara', 'expresionFacial', 'textoNoticia', 'capasVisuales', 'filtros', 'subtitulos',
    'transicionesEditor', 'resolucion', 'formato', 'marcaAgua', 'plan', 'limitesPlan', 'metricaDuracion',
    'metricaEstilo', 'metricaPopularidad', 'blenderHook', 'loraCustom', 'controlTotal', 'detalleGestual',
    'reaccionEmocional', 'cambioLuz', 'expresionFacialActor', 'ritmoEdicion', 'duracionPlano', 'tipoTransicion',
    'convencionGenero', 'feedbackUsuario', 'idioma', 'region', 'localizacionDialogo', 'animacionTexto',
    'efectoEntrada', 'layoutSubtitulos', 'mezclaAudio', 'balanceSonido', 'efectoSonoro', 'perfilUsuario',
    'validacionFinal', 'lente', 'texturaRealismo', 'direccionArte', 'movimientoCamara', 'animacionSutil',
    'climaAtmosferico', 'corteEdicion', 'sonidoAmbiente', 'microaccion', 'motivoVisual'
  ];
  for (const field of extraFields) {
    if (params[field] !== undefined) {
      payload[field] = params[field];
    }
  }

  // Log del payload para debug (seguro)
  safeLog('🔍 Kling payload siendo enviado:', {
    prompt: payload.prompt?.substring(0, 100) + '...',
    imageCount: payload.input_image_urls?.length || 0,
    duration: payload.duration,
    aspect_ratio: payload.aspect_ratio,
    hasImages: payload.input_image_urls?.length > 0,
    extraFieldsCount: Object.keys(payload).filter(k => !['prompt', 'input_image_urls', 'duration', 'aspect_ratio', 'negative_prompt'].includes(k)).length
  });
  console.log('[KlingService] [Fal.ai] Enviando solicitud a Fal.ai Kling Elements:', { model: "fal-ai/kling-video/v1.6/pro/elements" });

  // ✅ MEJORADO: Polling inteligente con queue status
  const TIMEOUT_MS = 1500000; // 90 segundos
  const MAX_RETRIES = 2;
  const POLL_INTERVAL = 5000; // Revisar cada 5 segundos
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[KlingService] [Intento ${attempt}/${MAX_RETRIES}] Enviando a Fal.ai con polling...`);
      
      // Iniciar la generación de video
      const result: any = await fal.queue.submit("fal-ai/kling-video/v1.6/pro/elements", {
        input: payload
      });
      
      const requestId = result.request_id;
      console.log(`[KlingService] [Queue] Video en cola con ID: ${requestId}`);
      
      // Polling para verificar el estado
      let status = 'IN_QUEUE';
      let videoResult = null;
      const startTime = Date.now();
      
      while (status === 'IN_QUEUE' || status === 'IN_PROGRESS') {
        // Verificar timeout
        if (Date.now() - startTime > TIMEOUT_MS) {
          throw new Error(`Timeout después de ${TIMEOUT_MS/1000} segundos`);
        }
        
        // Esperar antes de la siguiente verificación
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        
        // Verificar estado
        try {
          const statusResult: any = await fal.queue.status("fal-ai/kling-video/v1.6/pro/elements", {
            requestId: requestId,
            logs: true
          });
          
          status = statusResult.status;
          console.log(`[KlingService] [Polling] Estado: ${status} - Tiempo transcurrido: ${Math.round((Date.now() - startTime)/1000)}s`);
          
          if (status === 'COMPLETED') {
            videoResult = statusResult.data;
            break;
          } else if (status === 'FAILED') {
            throw new Error(`Fal.ai failed: ${statusResult.error || 'Unknown error'}`);
          }
        } catch (pollError) {
          console.warn(`[KlingService] [Polling] Error verificando estado: ${pollError}`);
          // Continuar polling si es un error temporal
        }
      }
      
      // ✅ VALIDACIÓN DEFINITIVA DEL RESULTADO
      console.log("🔍 Resultado completo de Kling:", videoResult);
      
      if (!videoResult?.video?.url) {
        console.error("❌ Kling falló. Resultado:", videoResult);
        throw new Error("Kling no devolvió video_url");
      }
      
      // Validar resultado original
      if (!videoResult?.video?.url) {
        console.log('[KlingService] [Error] Kling no devolvió video.url:', { 
          hasData: !!videoResult,
          dataKeys: videoResult ? Object.keys(videoResult) : [],
          status,
          attempt
        });
        throw new Error('Kling no devolvió video.url válido');
      }
      
      safeLog('[KlingService] [Success] Video generado exitosamente:', { 
        hasUrl: !!videoResult.video.url,
        urlPrefix: videoResult.video.url.substring(0, 50) + '...',
        attempt,
        totalTime: Math.round((Date.now() - startTime)/1000) + 's'
      });
      
      return videoResult.video.url;
      
    } catch (error: any) {
      const errorData = {
        status: error.status,
        message: error.message,
        body: error.body,
        fieldErrors: error.fieldErrors || 'No field errors',
        detail: error.body?.detail,
        attempt,
        isTimeout: error.message?.includes('Timeout'),
        isQueueError: error.message?.includes('queue') || error.message?.includes('Queue')
      };
      
      safeLog(`[KlingService] [Error] Intento ${attempt}/${MAX_RETRIES} falló:`, errorData);
      
      // Si es el último intento o no es un error recuperable, no reintentar
      if (attempt === MAX_RETRIES || (!errorData.isTimeout && !errorData.isQueueError && error.status !== 408 && error.status !== 429 && error.status !== 503)) {
        console.error('❌ Error final de Fal.ai después de', attempt, 'intentos:', errorData.message || 'Error desconocido');
        throw error;
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      const waitMs = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
      console.log(`[KlingService] [Retry] Esperando ${waitMs}ms antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
  
  // Esta línea nunca debería alcanzarse debido al throw en el último intento
  throw new Error('Todos los intentos fallaron');
}



