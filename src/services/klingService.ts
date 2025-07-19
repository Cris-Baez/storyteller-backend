
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

export interface KlingApiResponse {
  video?: {
    url: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function generateKlingClip(params: KlingClipParams): Promise<string> {
  const {
    prompt,
    input_image_urls,
    duration,
    aspect_ratio,
    negative_prompt,
    ...rest
  } = params;

  // Normalizar duration y aspect_ratio a los literales requeridos
  const durationStr: DurationType = String(duration) === '10' ? '10' : '5';
  const aspectRatioStr: AspectRatioType = (aspect_ratio === '1:1' || aspect_ratio === '9:16') ? aspect_ratio as AspectRatioType : '16:9';
  const negativePromptStr = negative_prompt || 'blur, distort, and low quality';

  const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/elements", {
    input: {
      prompt,
      input_image_urls,
      duration: durationStr,
      aspect_ratio: aspectRatioStr,
      negative_prompt: negativePromptStr,
      ...rest
    },
    logs: true
  });
  if (!result?.data?.video?.url) throw new Error('Kling no devolvió video.url');
  return result.data.video.url;
}

