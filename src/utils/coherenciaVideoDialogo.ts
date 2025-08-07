// src/utils/coherenciaVideoDialogo.ts
/**
 * 🎯 MEJORAS DE COHERENCIA PARA DIÁLOGOS Y VIDEOS
 * ===============================================
 * 
 * Funciones auxiliares para mejorar la coherencia sin tocar código existente:
 * ✅ Validación de diálogos coherentes
 * ✅ Mejora de prompts de video 
 * ✅ Continuidad visual
 * ✅ Uso de sonidos/voces existentes
 */

import { logger } from './logger.js';
import { VideoPlan } from './types.js';

interface DialogueCoherenceOptions {
  previousDialogue?: string;
  sceneContext: string;
  emotion: string;
  characterName?: string;
  duration: number;
}

interface VideoCoherenceOptions {
  previousPrompt?: string;
  sceneTransition: 'cut' | 'fade' | 'dissolve';
  visualStyle: string;
  emotionalArc: string;
  timeOfDay?: string;
  location?: string;
}

/**
 * ✅ MEJORA COHERENCIA DE DIÁLOGOS
 * Valida y mejora diálogos para que tengan sentido secuencial
 */
export function mejorarCoherenciaDialogo(
  dialogoOriginal: string,
  options: DialogueCoherenceOptions
): string {
  
  if (!dialogoOriginal || typeof dialogoOriginal !== 'string') {
    logger.warn('[Coherencia] Diálogo inválido, usando fallback');
    return generarDialogoFallback(options);
  }

  // Validar longitud apropiada para duración
  const palabrasMinimas = Math.max(3, options.duration * 2); // 2 palabras por segundo mínimo
  const palabrasMaximas = options.duration * 4; // 4 palabras por segundo máximo
  
  const palabras = dialogoOriginal.split(' ');
  
  if (palabras.length < palabrasMinimas) {
    logger.info(`[Coherencia] Diálogo muy corto (${palabras.length} palabras), expandiendo...`);
    return expandirDialogo(dialogoOriginal, options);
  }
  
  if (palabras.length > palabrasMaximas) {
    logger.info(`[Coherencia] Diálogo muy largo (${palabras.length} palabras), recortando...`);
    return recortarDialogo(dialogoOriginal, palabrasMaximas);
  }

  // Verificar coherencia emocional
  if (!validarCoherenciaEmocional(dialogoOriginal, options.emotion)) {
    logger.info('[Coherencia] Ajustando tono emocional del diálogo...');
    return ajustarTonoEmocional(dialogoOriginal, options.emotion);
  }

  // Verificar continuidad con diálogo anterior
  if (options.previousDialogue) {
    if (!validarContinuidadDialogo(options.previousDialogue, dialogoOriginal)) {
      logger.info('[Coherencia] Mejorando transición entre diálogos...');
      return mejorarTransicionDialogo(dialogoOriginal, options);
    }
  }

  logger.info('[Coherencia] ✅ Diálogo coherente y validado');
  return dialogoOriginal;
}

/**
 * ✅ MEJORA COHERENCIA VISUAL DE VIDEOS
 * Optimiza prompts para continuidad visual
 */
export function mejorarCoherenciaVisual(
  promptOriginal: string,
  options: VideoCoherenceOptions
): string {
  
  if (!promptOriginal || typeof promptOriginal !== 'string') {
    logger.warn('[Coherencia] Prompt visual inválido, usando fallback');
    return generarPromptFallback(options);
  }

  let promptMejorado = promptOriginal;

  // Agregar consistencia de estilo visual
  promptMejorado = agregarConsistenciaEstilo(promptMejorado, options.visualStyle);

  // Agregar continuidad de locación y tiempo
  if (options.location) {
    promptMejorado = asegurarConsistenciaUbicacion(promptMejorado, options.location);
  }

  if (options.timeOfDay) {
    promptMejorado = asegurarConsistenciaTiempo(promptMejorado, options.timeOfDay);
  }

  // Mejorar transiciones visuales
  if (options.previousPrompt) {
    promptMejorado = mejorarTransicionVisual(
      promptMejorado, 
      options.previousPrompt, 
      options.sceneTransition
    );
  }

  // Asegurar coherencia con arco emocional
  promptMejorado = alinearConArcoEmocional(promptMejorado, options.emotionalArc);

  logger.info('[Coherencia] ✅ Prompt visual mejorado para continuidad');
  return promptMejorado;
}

/**
 * ✅ REUTILIZAR VOCES/SONIDOS EXISTENTES
 * Mapea a voces y sonidos que ya funcionan bien
 */
export function mapearVocesExistentes(
  personaje: string,
  genero: 'male' | 'female',
  estilo: string
): { voiceId: string; provider: 'murf' | 'elevenlabs' } {
  
  // Mapeo de voces que ya funcionan bien (basado en tus configuraciones)
  const vocesExitosas = {
    cinematic: {
      female: { voiceId: 'spanish_female', provider: 'murf' as const },
      male: { voiceId: 'spanish_male', provider: 'murf' as const }
    },
    commercial: {
      female: { voiceId: 'en-US-sarah', provider: 'murf' as const },
      male: { voiceId: 'en-US-mark', provider: 'murf' as const }
    },
    anime: {
      female: { voiceId: 'anime_girl_voice', provider: 'elevenlabs' as const },
      male: { voiceId: 'anime_boy_voice', provider: 'elevenlabs' as const }
    }
  };

  const estiloMap = vocesExitosas[estilo as keyof typeof vocesExitosas];
  if (estiloMap) {
    const voz = estiloMap[genero];
    logger.info(`[Coherencia] ✅ Usando voz existente exitosa: ${voz.voiceId} (${voz.provider})`);
    return voz;
  }

  // Fallback a voces por defecto que ya funcionan
  const fallbackVoices = {
    female: { voiceId: 'spanish_female', provider: 'murf' as const },
    male: { voiceId: 'spanish_male', provider: 'murf' as const }
  };

  logger.info(`[Coherencia] 🔄 Usando voz fallback probada: ${fallbackVoices[genero].voiceId}`);
  return fallbackVoices[genero];
}

/**
 * ✅ VALIDAR PLAN COMPLETO PARA COHERENCIA
 * Revisa todo el plan de video para asegurar coherencia
 */
export function validarCoherenciaPlan(plan: VideoPlan): {
  esCoherente: boolean;
  problemas: string[];
  sugerencias: string[];
} {
  
  const problemas: string[] = [];
  const sugerencias: string[] = [];

  if (!plan.timeline || plan.timeline.length === 0) {
    problemas.push('Plan sin timeline o timeline vacío');
    return { esCoherente: false, problemas, sugerencias };
  }

  // Validar coherencia de diálogos
  for (let i = 0; i < plan.timeline.length; i++) {
    const segmento = plan.timeline[i];
    
    if (segmento.voz || segmento.dialogo) {
      const texto = segmento.voz || segmento.dialogo || '';
      
      if (texto.length < 10) {
        problemas.push(`Segmento ${i + 1}: Diálogo muy corto`);
        sugerencias.push(`Expandir diálogo del segmento ${i + 1}`);
      }
      
      if (texto.length > segmento.duracion * 20) {
        problemas.push(`Segmento ${i + 1}: Diálogo muy largo para la duración`);
        sugerencias.push(`Reducir diálogo del segmento ${i + 1} o aumentar duración`);
      }
    }

    // Validar prompts de video
    if (segmento.prompt) {
      if (segmento.prompt.length < 20) {
        problemas.push(`Segmento ${i + 1}: Prompt de video muy corto`);
        sugerencias.push(`Expandir descripción visual del segmento ${i + 1}`);
      }
    }
  }

  // Validar duración total
  const duracionTotal = plan.timeline.reduce((sum, seg) => sum + (seg.duracion || 5), 0);
  const duracionEsperada = plan.metadata?.duration || 30;
  
  if (Math.abs(duracionTotal - duracionEsperada) > 5) {
    problemas.push(`Duración total (${duracionTotal}s) no coincide con esperada (${duracionEsperada}s)`);
    sugerencias.push('Ajustar duraciones de segmentos para coincidir con duración objetivo');
  }

  const esCoherente = problemas.length === 0;
  
  if (esCoherente) {
    logger.info('[Coherencia] ✅ Plan validado - Totalmente coherente');
  } else {
    logger.warn(`[Coherencia] ⚠️ Plan con ${problemas.length} problemas de coherencia`);
  }

  return { esCoherente, problemas, sugerencias };
}

// ===== FUNCIONES AUXILIARES =====

function generarDialogoFallback(options: DialogueCoherenceOptions): string {
  const dialogosPorEmocion = {
    happy: "Esto es increíble",
    sad: "Es difícil de aceptar", 
    angry: "No puede ser",
    surprised: "No lo esperaba",
    calm: "Todo está bien",
    dramatic: "Esto cambia todo"
  };

  return dialogosPorEmocion[options.emotion as keyof typeof dialogosPorEmocion] || "Entiendo";
}

function expandirDialogo(dialogo: string, options: DialogueCoherenceOptions): string {
  const expansionesPorEmocion = {
    happy: ["Es fantástico", "Me encanta"],
    sad: ["Es doloroso", "Duele mucho"],
    angry: ["Estoy furioso", "No es justo"],
    surprised: ["¡Increíble!", "¡Vaya sorpresa!"],
    calm: ["Con tranquilidad", "Sin prisa"],
    dramatic: ["¡Esto es crucial!", "¡Decisivo!"]
  };

  const expansiones = expansionesPorEmocion[options.emotion as keyof typeof expansionesPorEmocion] || ["Claro", "Por supuesto"];
  const expansion = expansiones[Math.floor(Math.random() * expansiones.length)];
  
  return `${dialogo}. ${expansion}`;
}

function recortarDialogo(dialogo: string, maxPalabras: number): string {
  const palabras = dialogo.split(' ');
  return palabras.slice(0, maxPalabras).join(' ') + (palabras.length > maxPalabras ? '...' : '');
}

function validarCoherenciaEmocional(dialogo: string, emocion: string): boolean {
  const palabrasEmocionales = {
    happy: ['increíble', 'fantástico', 'genial', 'maravilloso', 'perfecto'],
    sad: ['triste', 'doloroso', 'difícil', 'lamento', 'duele'],
    angry: ['furioso', 'enojado', 'injusto', 'terrible', 'indignante'],
    surprised: ['increíble', 'sorprendente', 'inesperado', '¡vaya!', 'asombroso'],
    calm: ['tranquilo', 'sereno', 'pacífico', 'relajado', 'calmado'],
    dramatic: ['crucial', 'importante', 'decisivo', 'crítico', 'vital']
  };

  const palabrasRelevantes = palabrasEmocionales[emocion as keyof typeof palabrasEmocionales] || [];
  const textoLower = dialogo.toLowerCase();
  
  return palabrasRelevantes.some(palabra => textoLower.includes(palabra));
}

function ajustarTonoEmocional(dialogo: string, emocion: string): string {
  const prefijosEmocionales = {
    happy: "¡Qué maravilloso! ",
    sad: "Es triste pero ",
    angry: "¡Es indignante! ",
    surprised: "¡No puedo creerlo! ",
    calm: "Con tranquilidad, ",
    dramatic: "¡Esto es crucial! "
  };

  const prefijo = prefijosEmocionales[emocion as keyof typeof prefijosEmocionales] || "";
  return prefijo + dialogo;
}

function validarContinuidadDialogo(dialogoAnterior: string, dialogoActual: string): boolean {
  // Lógica simple: no repetir palabras clave del diálogo anterior
  const palabrasAnteriores = dialogoAnterior.toLowerCase().split(' ');
  const palabrasActuales = dialogoActual.toLowerCase().split(' ');
  
  const repeticiones = palabrasActuales.filter(palabra => 
    palabra.length > 4 && palabrasAnteriores.includes(palabra)
  );
  
  return repeticiones.length <= 1; // Máximo 1 palabra repetida
}

function mejorarTransicionDialogo(dialogo: string, options: DialogueCoherenceOptions): string {
  const conectores = ["Además", "Por otro lado", "Sin embargo", "Entonces", "Pero"];
  const conector = conectores[Math.floor(Math.random() * conectores.length)];
  
  return `${conector}, ${dialogo.toLowerCase()}`;
}

// Funciones para coherencia visual
function generarPromptFallback(options: VideoCoherenceOptions): string {
  return `${options.visualStyle} style scene, ${options.emotionalArc} mood, professional cinematography`;
}

function agregarConsistenciaEstilo(prompt: string, visualStyle: string): string {
  if (!prompt.toLowerCase().includes(visualStyle.toLowerCase())) {
    return `${visualStyle} style, ${prompt}`;
  }
  return prompt;
}

function asegurarConsistenciaUbicacion(prompt: string, location: string): string {
  if (!prompt.toLowerCase().includes(location.toLowerCase())) {
    return `${prompt}, set in ${location}`;
  }
  return prompt;
}

function asegurarConsistenciaTiempo(prompt: string, timeOfDay: string): string {
  const tiempos = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'];
  const tieneHora = tiempos.some(tiempo => prompt.toLowerCase().includes(tiempo));
  
  if (!tieneHora) {
    return `${prompt}, ${timeOfDay} lighting`;
  }
  return prompt;
}

function mejorarTransicionVisual(prompt: string, promptAnterior: string, transicion: string): string {
  const transiciones: { [key: string]: string } = {
    cut: "seamless cut from previous scene,",
    fade: "gentle fade transition,",
    dissolve: "smooth dissolve transition,"
  };
  
  const transicionTexto = transiciones[transicion] || transiciones['cut'];
  return `${transicionTexto} ${prompt}`;
}

function alinearConArcoEmocional(prompt: string, arcoEmocional: string): string {
  const descriptoresEmocionales = {
    ascending: "uplifting, hopeful",
    descending: "melancholic, somber", 
    stable: "consistent, balanced",
    dramatic: "intense, powerful"
  };
  
  const descriptor = descriptoresEmocionales[arcoEmocional as keyof typeof descriptoresEmocionales] || "balanced";
  
  if (!prompt.includes(descriptor.split(',')[0])) {
    return `${prompt}, ${descriptor}`;
  }
  return prompt;
}
