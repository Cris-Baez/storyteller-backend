// src/services/klingService.ts
// Servicio para generar clips usando Kling Elements (Fal.ai)
import fetch from 'node-fetch';

const KLING_API_KEY = '7485997c-d8f7-4143-b755-7b5789c95aca:6b522f834f33decb1880d5eb1a265bdc';
const KLING_URL = 'https://api.fal.ai/v1.6/standard/elements/api';


interface KlingClipParams {
  prompt: string;
  background?: string;
  character?: string;
  duration: number;
  [key: string]: any;
}

interface KlingApiResponse {
  video_url?: string;
  [key: string]: any;
}

export async function generateKlingClip({ prompt, background, character, duration, ...rest }: KlingClipParams): Promise<string> {
  const body: KlingClipParams = {
    prompt,
    background,
    character,
    duration,
    ...rest
  };
  const res = await fetch(KLING_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${KLING_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Kling API error: ' + (await res.text()));
  const data = await res.json() as KlingApiResponse;
  if (!data?.video_url) throw new Error('Kling no devolvió video_url');
  return data.video_url;
}
