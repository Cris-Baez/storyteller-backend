
// src/services/klingService.ts
// Servicio para generar clips usando Kling Elements (Fal.ai)

import { fal } from '@fal-ai/client';

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

export async function generateKlingClip(params: KlingClipParams): Promise<string> {
  console.log('[KlingService] [Validación] Iniciando generación de clip profesional:', { 
    promptLength: params.prompt?.length || 0, 
    imageCount: params.input_image_urls?.length || 0,
    duration: params.duration,
    flujo: 'fondo → actor → Kling → Kontext → voz/música → edición → exportar'
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
  
  const durationLiteral: "5" | "10" = String(duration) === '10' ? '10' : '5';
  const allowedAspectRatios: AspectRatioType[] = ['16:9', '1:1', '9:16'];
  const aspectRatioStr: AspectRatioType = allowedAspectRatios.includes(aspect_ratio as AspectRatioType) ? aspect_ratio as AspectRatioType : '16:9';
  const negativePromptStr = negative_prompt || 'blur, distort, and low quality';
  console.log('[KlingService] [Parámetros] Parámetros procesados:', { 
    duration: durationLiteral, 
    aspectRatio: aspectRatioStr, 
    negativePrompt: negativePromptStr.substring(0, 50) + '...' 
  });

  // Construir el payload incluyendo campos avanzados si están presentes
  const payload: any = {
    prompt,
    input_image_urls,
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

  // Log del payload para debug
  console.log('🔍 Kling payload siendo enviado:', JSON.stringify(payload, null, 2));
  console.log('[KlingService] [Fal.ai] Enviando solicitud a Fal.ai Kling Elements:', { model: "fal-ai/kling-video/v1.6/pro/elements" });

  try {
    const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/elements", {
      input: payload,
      logs: true
    });
    console.log('[KlingService] [Respuesta] Respuesta de Fal.ai recibida:', { 
      hasVideo: !!result?.data?.video, 
      videoUrl: result?.data?.video?.url ? 'URL recibida' : 'No URL' 
    });
    
    if (!result?.data?.video?.url) {
      console.log('[KlingService] [Error] Kling no devolvió video.url:', { result: JSON.stringify(result, null, 2) });
      throw new Error('Kling no devolvió video.url');
    }
    console.log('[KlingService] [Success] Video generado exitosamente:', { url: result.data.video.url.substring(0, 50) + '...' });
    return result.data.video.url;
  } catch (error: any) {
    console.log('[KlingService] [Error] Error detallado de Fal.ai:', {
      status: error.status,
      message: error.message,
      body: error.body,
      fieldErrors: error.fieldErrors || 'No field errors',
      detail: error.body?.detail
    });
    console.error('❌ Error detallado de Fal.ai:', {
      status: error.status,
      message: error.message,
      body: error.body,
      fieldErrors: error.fieldErrors || 'No field errors',
      detail: error.body?.detail
    });
    throw error;
  }
}



