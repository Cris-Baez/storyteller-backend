
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
  // Validación estricta de campos requeridos
  const { prompt, input_image_urls, duration, aspect_ratio, negative_prompt } = params;
  
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('El campo prompt es requerido y debe ser string');
  }
  if (!Array.isArray(input_image_urls) || input_image_urls.length === 0 || !input_image_urls.every(url => typeof url === 'string')) {
    throw new Error('input_image_urls debe ser un array de strings no vacío');
  }
  
  // Validar que las URLs sean accesibles públicamente
  for (const url of input_image_urls) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      throw new Error(`URL de imagen no es accesible públicamente: ${url}. Fal.ai necesita URLs públicas.`);
    }
  }
  
  const durationLiteral: "5" | "10" = String(duration) === '10' ? '10' : '5';
  const allowedAspectRatios: AspectRatioType[] = ['16:9', '1:1', '9:16'];
  const aspectRatioStr: AspectRatioType = allowedAspectRatios.includes(aspect_ratio as AspectRatioType) ? aspect_ratio as AspectRatioType : '16:9';
  const negativePromptStr = negative_prompt || 'blur, distort, and low quality';

  // Construir el payload estrictamente
  const payload = {
    prompt,
    input_image_urls,
    duration: durationLiteral,
    aspect_ratio: aspectRatioStr,
    negative_prompt: negativePromptStr
  };

  // Log del payload para debug
  console.log('🔍 Kling payload siendo enviado:', JSON.stringify(payload, null, 2));

  try {
    const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/elements", {
      input: payload,
      logs: true
    });
    
    if (!result?.data?.video?.url) {
      throw new Error('Kling no devolvió video.url');
    }
    return result.data.video.url;
  } catch (error: any) {
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



