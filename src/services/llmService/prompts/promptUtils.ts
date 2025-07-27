// prompts/promptUtils.ts - Utilidades para cargar y gestionar prompts base

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Carga el prompt base compartido por todos los cerebros
 */
export async function cargarSystemPromptBase(): Promise<string> {
  try {
    const promptPath = join(__dirname, 'systemPromptBase.txt');
    const systemBase = await readFile(promptPath, 'utf-8');
    return systemBase.trim();
  } catch (error) {
    console.warn('[PromptUtils] No se pudo cargar systemPromptBase.txt, usando fallback');
    return `Eres parte del sistema CinemaAI. Genera contenido cinematográfico realista y factible con IA actual.`;
  }
}

/**
 * Construye un prompt completo combinando base + especialización
 */
export function construirPromptCompleto(
  systemBase: string, 
  especializacion: string, 
  contextoUsuario: string
): string {
  return `${systemBase}

${especializacion}

${contextoUsuario}`;
}

/**
 * Configuración estándar para llamadas LLM de cerebros
 */
export const CONFIG_CEREBROS = {
  model: 'openai/chatgpt-4o-latest',
  timeout: 60000,
  maxTokens: 2000
};
