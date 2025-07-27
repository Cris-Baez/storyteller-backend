import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
// LLMService especializado para estilo Realista
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateRealisticVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  console.log('[Realistic] Iniciando generación de VideoPlan realista...');
  if (!req.metadata) {
    console.warn('[Realistic] metadata faltante, creando objeto vacío.');
    req.metadata = {};
  }
  if (!req.metadata.visualStyle) {
    console.warn('[Realistic] visualStyle faltante, usando "realistic" por defecto.');
    req.metadata.visualStyle = req.visualStyle || 'realistic';
  }
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'realistic';
  console.log(`[Realistic] Duración solicitada: ${duration}, Estilo: ${style}`);
  const { env } = await import('../../config/env.js');
  const CDN_BASE = env.CDN_BUCKET_URL.endsWith('/') ? env.CDN_BUCKET_URL : env.CDN_BUCKET_URL + '/';
  const fs = await import('fs/promises');
  const path = await import('path');
  let assetsIndex: Array<{ tipo: string; ruta: string; nombre: string; completitud: string; estilo: string; }> = [];
  console.log('[Realistic] Cargando assets desde assets_index.json...');
  try {
    assetsIndex = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'assets_index.json'), 'utf-8'));
  } catch (e) {
    assetsIndex = [];
  }
  if (assetsIndex.length === 0) console.error('[Realistic] No se pudieron cargar assets, el índice está vacío.');
  const fondos = assetsIndex.filter(a => a.tipo === 'escenas' && a.completitud === 'completa' && a.estilo === style);
  const actores = assetsIndex.filter(a => a.tipo === 'actores' && a.completitud === 'completa' && a.estilo === style);
  console.log(`[Realistic] Fondos encontrados: ${fondos.length}, Actores encontrados: ${actores.length}`);
  if (fondos.length === 0) console.warn('[Realistic] No hay fondos completos para el estilo solicitado.');
  if (actores.length === 0) console.warn('[Realistic] No hay actores completos para el estilo solicitado.');
  const fondoDefault = fondos[0] ? CDN_BASE + fondos[0].ruta : '';
  const actorDefault = actores[0] ? CDN_BASE + actores[0].ruta : '';
  const fondosList = fondos.map(a => `- ${a.nombre}: ${CDN_BASE + a.ruta}`).join('\n');
  const actoresList = actores.map(a => `- ${a.nombre}: ${CDN_BASE + a.ruta}`).join('\n');
  const systemPrompt = `Eres un generador de planes de video para producciones cinematográficas de estilo realista. Tu tarea es crear un objeto JSON llamado VideoPlan que contenga una timeline de escenas detalladas, cada una con los siguientes campos: t (segundo), visual (descripción de la acción y ambiente), background (URL de fondo), character (URL de actor), camera (objeto con shot y movement), lighting (descripción de la luz). El campo visualStyle debe ser \"realistic\".\n\nFondos disponibles:\n${fondosList}\n\nActores disponibles:\n${actoresList}\n\nNo incluyas texto adicional, solo el JSON. Respeta la duración solicitada y no dejes segundos vacíos. Elige SIEMPRE los assets de las listas proporcionadas.`;
  const userPrompt = `Genera un VideoPlan realista para ${duration} segundos usando únicamente los fondos y actores de las listas proporcionadas y el estilo solicitado. El output debe ser estrictamente el JSON con los campos timeline y visualStyle.`;
  console.log('[Realistic] Prompt para LLM construido correctamente.');
  const models = [
    req.metadata?.llmModel,
    'openai/chatgpt-4o-latest',
    'openai/gpt-4',
    'openai/gpt-3.5-turbo',
    'google/gemini-pro',
    'anthropic/claude-3-opus',
    'mistral/mistral-large',
  ].filter(Boolean);
  console.log(`[Realistic] Modelos a probar: ${models.join(', ')}`);
  // ...inicialización y logs ya presentes arriba...
  let llmResponse: string | undefined;
  let lastError: any;
  const timeout = 300000; // 300 segundos (5 minutos)
  let videoPlan: VideoPlan | undefined;
  // Intentos con LLM y fallback
  for (let attempt = 0; attempt < 3; attempt++) {
    console.log(`[Realistic] Intento LLM #${attempt+1}`);
    for (const model of models) {
      console.log(`[Realistic] Probando modelo: ${model}`);
        // ...existing code...
      try {
        llmResponse = await callOpenRouter(systemPrompt, userPrompt, model, timeout);
        if (!llmResponse) throw new Error('Respuesta vacía del modelo: ' + model);
        const rawResponse = llmResponse as string;
        // Segunda llamada para forzar JSON válido
        const transformSystemPrompt = `Solo responde con un objeto JSON válido con los campos timeline y visualStyle.`;
        const transformUserPrompt = rawResponse;
        const rectifyResponse = await callOpenRouter(transformSystemPrompt, transformUserPrompt, model, timeout);
        videoPlan = extractFirstJsonBlock(rectifyResponse as string, { returnParsed: true, debug: true }) as VideoPlan;
        if (!videoPlan) throw new Error('No se encontró bloque JSON en la respuesta del modelo.');
        // Blindaje y normalización
        if (!videoPlan.visualStyle) videoPlan.visualStyle = style;
        if (!videoPlan.timeline && (videoPlan as any).videoPlan) {
          videoPlan.timeline = (videoPlan as any).videoPlan;
          delete (videoPlan as any).videoPlan;
        }
        if (!videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) throw new Error('El modelo no devolvió un timeline válido y con contenido.');
        if (!videoPlan.visualStyle) videoPlan.visualStyle = style;
        videoPlan.metadata = req.metadata;
        return videoPlan;
      } catch (err) {
        console.error(`[Realistic] Error en modelo ${model}:`, err);
        lastError = err;
        continue;
      }
    }
  }
  // Fallback local si todos los intentos fallan
  console.warn('[Realistic] Todos los intentos LLM fallaron, usando fallback local.');
  const timeline: any[] = [];
  for (let t = 0; t < duration; t++) {
    // ...existing code...
    const fondo = fondos[t % fondos.length] ? CDN_BASE + fondos[t % fondos.length].ruta : fondoDefault;
    const actor = actores[t % actores.length] ? CDN_BASE + actores[t % actores.length].ruta : actorDefault;
    timeline.push({
      t,
      visual: `Escena ${t+1}: acción y ambiente para el estilo ${style}`,
      background: fondo,
      character: actor,
      camera: { shot: 'wide', movement: 'pan' },
      lighting: 'luz neutra'
    });
  }
  console.log('[Realistic] VideoPlan generado correctamente (LLM o fallback).');
  return {
    timeline,
    visualStyle: style,
    metadata: req.metadata
  };
}
