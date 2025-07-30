
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
  
  // Validación estricta de campos requeridos según flujo profesional
  const { prompt, input_image_urls, duration, aspect_ratio, negative_prompt } = params;
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

  try {
    const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/elements", {
      input: payload,
      logs: true
    });
    
    // Logging seguro de la respuesta
    if (hasLargeBase64(result)) {
      safeLog('[KlingService] [Respuesta] Respuesta de Fal.ai recibida (contiene datos base64):', { 
        hasVideo: !!result?.data?.video, 
        videoUrl: result?.data?.video?.url ? 'URL recibida' : 'No URL',
        dataKeys: result?.data ? Object.keys(result.data) : [],
        resultKeys: result ? Object.keys(result) : []
      });
    } else {
      safeLog('[KlingService] [Respuesta] Respuesta de Fal.ai recibida:', { 
        hasVideo: !!result?.data?.video, 
        videoUrl: result?.data?.video?.url ? 'URL recibida' : 'No URL' 
      });
    }
    
    if (!result?.data?.video?.url) {
      console.log('[KlingService] [Error] Kling no devolvió video.url:', { 
        hasData: !!result?.data,
        dataKeys: result?.data ? Object.keys(result.data) : [],
        resultKeys: result ? Object.keys(result) : [],
        resultType: typeof result
      });
      throw new Error('Kling no devolvió video.url');
    }
    safeLog('[KlingService] [Success] Video generado exitosamente:', { 
      hasUrl: !!result.data.video.url,
      urlPrefix: result.data.video.url.substring(0, 50) + '...'
    });
    return result.data.video.url;
  } catch (error: any) {
    const errorData = {
      status: error.status,
      message: error.message,
      body: error.body,
      fieldErrors: error.fieldErrors || 'No field errors',
      detail: error.body?.detail
    };
    
    safeLog('[KlingService] [Error] Error detallado de Fal.ai:', errorData);
    console.error('❌ Error detallado de Fal.ai:', errorData.message || 'Error desconocido');
    throw error;
  }
}



