import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
// LLMService especializado para estilo Gaming
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateGameVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  // Inicialización defensiva
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'game';
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'game';
  console.log(`[Game] Duración solicitada: ${duration}, Estilo: ${style}`);
  const { env } = await import('../../config/env.js');
  const CDN_BASE = env.CDN_BUCKET_URL.endsWith('/') ? env.CDN_BUCKET_URL : env.CDN_BUCKET_URL + '/';
  const fs = await import('fs/promises');
  const path = await import('path');
  let assetsIndex: Array<{ tipo: string; ruta: string; nombre: string; completitud: string; estilo: string; }> = [];
  console.log('[Game] Cargando assets desde assets_index.json...');
  try {
    assetsIndex = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'assets_index.json'), 'utf-8'));
  } catch (e) {
    assetsIndex = [];
  }
  if (assetsIndex.length === 0) console.error('[Game] No se pudieron cargar assets, el índice está vacío.');
  const fondos = assetsIndex.filter(a => a.tipo === 'escenas' && a.completitud === 'completa' && a.estilo === style);
  const actores = assetsIndex.filter(a => a.tipo === 'actores' && a.completitud === 'completa' && a.estilo === style);
  console.log(`[Game] Fondos encontrados: ${fondos.length}, Actores encontrados: ${actores.length}`);
  if (fondos.length === 0) console.warn('[Game] No hay fondos completos para el estilo solicitado.');
  if (actores.length === 0) console.warn('[Game] No hay actores completos para el estilo solicitado.');
  const fondoDefault = fondos[0] ? CDN_BASE + fondos[0].ruta : '';
  const actorDefault = actores[0] ? CDN_BASE + actores[0].ruta : '';
  const fondosList = fondos.map(a => `- ${a.nombre}: ${CDN_BASE + a.ruta}`).join('\n');
  const actoresList = actores.map(a => `- ${a.nombre}: ${CDN_BASE + a.ruta}`).join('\n');
  const systemPrompt = `Eres un generador de planes de video para cinemáticas de videojuegos. Tu tarea es crear un objeto JSON llamado VideoPlan que contenga una timeline de escenas detalladas, cada una con los siguientes campos: t, visual, background, character, camera, lighting, emotion, music, fx, transition, carryover, audioCarryover, faceAnimation, lipSync. El campo visualStyle debe ser "game".\n\nFondos disponibles:\n${fondosList}\n\nActores disponibles:\n${actoresList}\n\nNo incluyas texto adicional, solo el JSON. Respeta la duración solicitada y no dejes segundos vacíos. Elige SIEMPRE los assets de las listas proporcionadas.`;
  const userPrompt = `Genera un VideoPlan game para ${duration} segundos usando únicamente los fondos y actores de las listas proporcionadas y el estilo solicitado. El output debe ser estrictamente el JSON con los campos timeline y visualStyle.`;
  const models = [
    req.metadata?.llmModel,
    'openai/chatgpt-4o-latest',
    'openai/gpt-4',
    'openai/gpt-3.5-turbo',
    'google/gemini-pro',
    'anthropic/claude-3-opus',
    'mistral/mistral-large',
  ].filter(Boolean);
  let llmResponse: string | undefined;
  const timeout = 300000; // 300 segundos (5 minutos)
  let videoPlan: VideoPlan | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const model of models) {
      try {
        llmResponse = await callOpenRouter(systemPrompt, userPrompt, model, timeout);
        if (!llmResponse) throw new Error('Respuesta vacía del modelo: ' + model);
        const rawResponse = llmResponse as string;
        const transformSystemPrompt = `Solo responde con un objeto JSON válido con los campos timeline y visualStyle.`;
        const transformUserPrompt = rawResponse;
        const rectifyResponse = await callOpenRouter(transformSystemPrompt, transformUserPrompt, model, timeout);
        const parsedPlan = extractFirstJsonBlock(rectifyResponse as string, { returnParsed: true, debug: true }) as VideoPlan | undefined;
        if (parsedPlan && parsedPlan.timeline && Array.isArray(parsedPlan.timeline) && parsedPlan.timeline.length > 0) {
          parsedPlan.visualStyle = parsedPlan.visualStyle || style;
          parsedPlan.metadata = req.metadata;
          return parsedPlan;
        }
      } catch (err) {
        // Continúa con el siguiente modelo
      }
    }
  }
  // Fallback local robusto
  console.warn('[Game] Todos los intentos LLM fallaron, usando fallback local.');
  const timeline: any[] = [];
  for (let t = 0; t < duration; t++) {
    const fondo = fondos[t % fondos.length] ? CDN_BASE + fondos[t % fondos.length].ruta : fondoDefault;
    const actor = actores[t % actores.length] ? CDN_BASE + actores[t % actores.length].ruta : actorDefault;
    timeline.push({
      t,
      visual: `Escena ${t+1}: acción y ambiente para el estilo ${style}`,
      background: fondo,
      character: actor,
      camera: { shot: 'wide', movement: 'pan' },
      lighting: 'neutra',
      emotion: '',
      music: '',
      fx: [],
      transition: '',
      carryover: false,
      audioCarryover: false,
      faceAnimation: '',
      lipSync: ''
    });
  }
  return {
    timeline,
    visualStyle: style,
    metadata: req.metadata
  };
}
