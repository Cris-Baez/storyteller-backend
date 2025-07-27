import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateCinematicVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  console.log('[Cinematic] Iniciando generación de VideoPlan cinematográfico...');
  
  // Validación e inicialización básica
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'cinematic';
  
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'cinematic';
  
  console.log(`[Cinematic] Duración: ${duration}s, Estilo: ${style}`);

  // Cargar assets desde assets_index.json
  const fs = await import('fs/promises');
  const path = await import('path');
  
  interface AssetIndexItem {
    nombre: string;
    ruta: string;
    tipo: 'escenas' | 'actores';
    estilo: string;
    completitud: 'completa' | 'parcial';
    lugar?: string;
    variante?: string;
    ambiente?: string;
    angulo?: string;
  }

  console.log('[Cinematic] Cargando assets desde assets_index.json...');
  let assetsIndex: AssetIndexItem[] = [];
  try {
    assetsIndex = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'assets_index.json'), 'utf-8'));
  } catch (e) {
    console.error('[Cinematic] Error cargando assets:', e);
    assetsIndex = [];
  }

  // Filtrar assets cinematográficos (usa assets realistic para cinematic)
  const fondos = assetsIndex.filter(a => 
    a.tipo === 'escenas' && 
    a.completitud === 'completa' && 
    a.estilo === 'realistic'
  );
  const actores = assetsIndex.filter(a => 
    a.tipo === 'actores' && 
    a.completitud === 'completa' && 
    a.estilo === 'realistic'
  );

  console.log(`[Cinematic] Fondos encontrados: ${fondos.length}, Actores encontrados: ${actores.length} (usando assets realistic)`);
  if (fondos.length === 0) console.warn('[Cinematic] No hay fondos realistic completos disponibles.');
  if (actores.length === 0) console.warn('[Cinematic] No hay actores realistic completos disponibles.');

  // Preparar las listas de assets para el prompt del LLM (solo rutas relativas)
  const fondoDefault = fondos[0] ? fondos[0].ruta : '';
  const actorDefault = actores[0] ? actores[0].ruta : '';
  const fondosList = fondos.map(a => `- ${a.nombre}: ${a.ruta}`).join('\n');
  const actoresList = actores.map(a => `- ${a.nombre}: ${a.ruta}`).join('\n');

  const systemPrompt = `Eres un generador de planes de video para producciones cinematográficas de estilo cinematico. Tu tarea es crear un objeto JSON llamado VideoPlan que contenga una timeline de escenas detalladas, cada una con los siguientes campos: t (segundo), visual (descripción cinematográfica de la acción), background (URL de fondo), character (URL de actor), camera (objeto con shot y movement), lighting (descripción de iluminación cinematográfica), emotion, music, fx, transition, carryover, audioCarryover, faceAnimation, lipSync. El campo visualStyle debe ser "cinematic".

CARACTERÍSTICAS CINEMATOGRÁFICAS:
- Movimientos de cámara profesionales: dolly, crane, steadicam, tracking
- Iluminación dramática con contrastes y sombras
- Transiciones fluidas: fade, dissolve, match cuts
- Música orquestal que evoluciona con la narrativa
- Diálogos en momentos clave emocionales

Fondos disponibles:
${fondosList}

Actores disponibles:
${actoresList}

No incluyas texto adicional, solo el JSON. Respeta la duración solicitada y no dejes segundos vacíos. Elige SIEMPRE los assets de las listas proporcionadas.`;

  const userPrompt = `Genera un VideoPlan cinematográfico para ${duration} segundos usando únicamente los fondos y actores de las listas proporcionadas y el estilo cinematográfico solicitado. El output debe ser estrictamente el JSON con los campos timeline y visualStyle.

Historia a desarrollar: "${req.prompt}"

Crear experiencia cinematográfica con movimientos de cámara profesionales, iluminación dramática y música orquestal.`;

  // Modelos LLM a probar en orden
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
  const timeout = 300000; // 5 minutos

  // Intentar con diferentes modelos LLM
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const model of models) {
      try {
        console.log(`[Cinematic] Intento ${attempt + 1} con modelo: ${model}`);
        llmResponse = await callOpenRouter(systemPrompt, userPrompt, model, timeout);
        if (!llmResponse) throw new Error('Respuesta vacía del modelo: ' + model);

        // Transformar respuesta a JSON válido
        const transformSystemPrompt = `Solo responde con un objeto JSON válido con los campos timeline y visualStyle.`;
        const transformUserPrompt = llmResponse;
        const rectifyResponse = await callOpenRouter(transformSystemPrompt, transformUserPrompt, model, timeout);
        let videoPlan = extractFirstJsonBlock(rectifyResponse as string, { returnParsed: true, debug: true }) as VideoPlan;
        if (!videoPlan) throw new Error('No se encontró bloque JSON en la respuesta del modelo.');

        // Blindaje y normalización
        if (!videoPlan.visualStyle) videoPlan.visualStyle = style;
        if (!videoPlan.timeline && (videoPlan as any).videoPlan) {
          videoPlan.timeline = (videoPlan as any).videoPlan;
          delete (videoPlan as any).videoPlan;
        }
        if (!videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) throw new Error('El modelo no devolvió un timeline válido y con contenido.');

        videoPlan.metadata = req.metadata;

        // Validar con menteFondos para corregir rutas
        const { corregirFondosActoresInvalidos } = await import('../../utils/menteFondos.js');
        const resultado = corregirFondosActoresInvalidos(videoPlan, assetsIndex);
        videoPlan = resultado.videoPlan;
        
        console.log(`[Cinematic] VideoPlan generado exitosamente con ${resultado.sugerencias.length} correcciones`);
        return videoPlan;

      } catch (err) {
        console.error(`[Cinematic] Error con modelo ${model}:`, err);
        continue;
      }
    }
  }

  // Fallback cinematográfico simple
  console.warn('[Cinematic] Todos los intentos LLM fallaron, usando fallback local.');
  const timeline: any[] = [];
  for (let t = 0; t < duration; t++) {
    // Seleccionar assets del índice por su ruta relativa (menteFondos corregirá después)
    const fondoAsset = fondos[t % fondos.length];
    const actorAsset = actores[t % actores.length];
    const fondo = fondoAsset ? fondoAsset.ruta : fondoDefault;
    const actor = actorAsset ? actorAsset.ruta : actorDefault;
    
    timeline.push({
      t,
      visual: `Escena cinematográfica ${t+1}: acción dramática con iluminación profesional`,
      background: fondo,
      character: actor,
      camera: { shot: 'medium', movement: 'dolly-in' },
      lighting: 'dramatic side lighting',
      emotion: 'determined',
      music: t === 0 ? 'orchestral-epic' : 'continue',
      fx: ['ambient'],
      transition: t === 0 ? 'fade-in' : 'cut',
      carryover: false,
      audioCarryover: false,
      faceAnimation: 'determined',
      lipSync: ''
    });
  }

  console.log('[Cinematic] VideoPlan generado correctamente (fallback local).');
  
  const fallbackPlan: VideoPlan = {
    timeline: Array.isArray(timeline) ? timeline : [],
    visualStyle: style,
    metadata: req.metadata || {}
  };
  
  // Validar fallback con menteFondos para garantizar URLs correctas
  try {
    const { corregirFondosActoresInvalidos } = await import('../../utils/menteFondos.js');
    const resultado = corregirFondosActoresInvalidos(fallbackPlan, assetsIndex);
    console.log(`[Cinematic] Fallback corregido con ${resultado.sugerencias.length} sugerencias`);
    
    return resultado.videoPlan;
  } catch (e) {
    console.error('[Cinematic] Error en corrección de fallback:', e);
    return fallbackPlan;
  }
}
