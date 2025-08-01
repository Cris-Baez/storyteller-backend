// src/services/murfService.ts - Servicio especializado para voz comercial con Murf

import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

interface MurfVoiceRequest {
  text: string;
  voice: string;
  style?: 'commercial' | 'professional' | 'energetic' | 'calm';
  speed?: number;
  pitch?: number;
}

interface MurfVoiceResponse {
  audioUrl?: string;
  audioBuffer?: Buffer;
  duration?: number;
  success: boolean;
  error?: string;
}

/**
 * Voces comerciales disponibles en Murf
 */
const VOCES_COMERCIALES = {
  'en-US-mark': {
    nombre: 'Mark',
    genero: 'masculino',
    estilo: 'profesional',
    descripcion: 'Voz masculina profesional, ideal para corporativo'
  },
  'en-US-samantha': {
    nombre: 'Samantha',
    genero: 'femenino',
    estilo: 'energetico',
    descripcion: 'Voz femenina energética, perfecta para productos juveniles'
  },
  'en-US-david': {
    nombre: 'David',
    genero: 'masculino',
    estilo: 'confiable',
    descripcion: 'Voz masculina confiable, excelente para servicios'
  },
  'en-US-lisa': {
    nombre: 'Lisa',
    genero: 'femenino',
    estilo: 'profesional',
    descripcion: 'Voz femenina profesional, ideal para presentaciones'
  }
};

/**
 * Genera voz comercial usando Murf AI
 */
export async function generarVozComercial(request: MurfVoiceRequest): Promise<MurfVoiceResponse> {
  const apiKey = process.env.MURF_API_KEY;
  
  if (!apiKey) {
    logger.error('[MurfService] API key no configurada');
    return {
      success: false,
      error: 'Murf API key no configurada'
    };
  }

  try {
    logger.info('[MurfService] Generando voz comercial', {
      voice: request.voice,
      textLength: request.text.length,
      style: request.style
    });

    // Preparar datos para Murf API
    const murfData = {
      text: optimizarTextoParaVoz(request.text),
      voice_id: request.voice,
      voice_style: mapearEstiloMurf(request.style || 'commercial'),
      speed: request.speed || 1.0,
      pitch: request.pitch || 0,
      output_format: 'mp3',
      sample_rate: 44100
    };

    // Realizar petición a Murf API
    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(murfData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Murf API error: ${response.status} - ${errorText}`);
    }

    const resultado = await response.json() as any;

    if (!resultado.audio_url && !resultado.audio_data) {
      throw new Error('Murf no devolvió audio válido');
    }

    let audioBuffer: Buffer | undefined;
    let audioUrl: string | undefined;

    // Descargar audio si se proporciona URL
    if (resultado.audio_url) {
      audioUrl = resultado.audio_url;
      const audioResponse = await fetch(resultado.audio_url);
      if (audioResponse.ok) {
        audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      }
    } else if (resultado.audio_data) {
      // Si viene en base64
      audioBuffer = Buffer.from(resultado.audio_data, 'base64');
    }

    if (!audioBuffer) {
      throw new Error('No se pudo obtener el buffer de audio');
    }

    // Guardar archivo temporal
    const tempPath = await guardarAudioTemporal(audioBuffer);

    logger.info('[MurfService] Voz comercial generada exitosamente', {
      voice: request.voice,
      duration: resultado.duration || 'unknown',
      audioSize: audioBuffer.length
    });

    return {
      audioUrl: audioUrl,
      audioBuffer: audioBuffer,
      duration: resultado.duration,
      success: true
    };

  } catch (error) {
    logger.error('[MurfService] Error generando voz comercial:', error);
    
    // Fallback a voz por defecto
    return await generarVozFallback(request.text);
  }
}

/**
 * Optimiza el texto para mejor pronunciación en voz comercial
 */
function optimizarTextoParaVoz(texto: string): string {
  let textoOptimizado = texto;
  
  // Agregar pausas naturales
  textoOptimizado = textoOptimizado.replace(/\./g, '... ');
  textoOptimizado = textoOptimizado.replace(/,/g, ', ');
  textoOptimizado = textoOptimizado.replace(/!/g, '! ');
  textoOptimizado = textoOptimizado.replace(/\?/g, '? ');
  
  // Enfatizar palabras clave de marketing
  const palabrasClave = ['descubre', 'único', 'excepcional', 'extraordinario', 'perfecto', 'excelencia'];
  palabrasClave.forEach(palabra => {
    const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
    textoOptimizado = textoOptimizado.replace(regex, `<emphasis level="strong">${palabra}</emphasis>`);
  });
  
  // Agregar ritmo comercial
  if (!textoOptimizado.endsWith('.')) {
    textoOptimizado += '.';
  }
  
  return textoOptimizado;
}

/**
 * Mapea estilos internos a estilos de Murf
 */
function mapearEstiloMurf(estilo: string): string {
  const mapeoEstilos: Record<string, string> = {
    'commercial': 'professional',
    'professional': 'professional',
    'energetic': 'energetic',
    'calm': 'calm',
    'corporate': 'professional'
  };
  
  return mapeoEstilos[estilo] || 'professional';
}

/**
 * Guarda audio temporal para procesamiento
 */
async function guardarAudioTemporal(audioBuffer: Buffer): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const filename = `murf_voice_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
  const tempPath = path.join(tempDir, filename);
  
  await fs.writeFile(tempPath, audioBuffer);
  
  return tempPath;
}

/**
 * Genera voz de fallback cuando Murf no está disponible
 */
async function generarVozFallback(texto: string): Promise<MurfVoiceResponse> {
  try {
    logger.warn('[MurfService] Usando voz de fallback');
    
    // Intentar con ElevenLabs como fallback
    if (process.env.ELEVENLABS_API_KEY) {
      return await generarVozElevenLabs(texto);
    }
    
    // Si no hay ElevenLabs, usar voz sintética básica o archivo pre-grabado
    const audioFallback = await obtenerAudioFallback();
    
    return {
      audioBuffer: audioFallback,
      success: true,
      duration: 10 // Duración estimada
    };
    
  } catch (error) {
    logger.error('[MurfService] Error en voz de fallback:', error);
    
    return {
      success: false,
      error: 'No se pudo generar voz de fallback'
    };
  }
}

/**
 * Genera voz usando ElevenLabs como fallback
 */
async function generarVozElevenLabs(texto: string): Promise<MurfVoiceResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key no disponible');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: texto,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    logger.info('[MurfService] Voz de fallback generada con ElevenLabs');
    
    return {
      audioBuffer,
      success: true,
      duration: Math.ceil(texto.length / 10) // Estimación básica
    };

  } catch (error) {
    throw new Error(`ElevenLabs fallback failed: ${error}`);
  }
}

/**
 * Obtiene audio de fallback pre-grabado
 */
async function obtenerAudioFallback(): Promise<Buffer> {
  // En un entorno real, tendrías archivos de audio pre-grabados
  const audiosFallback = [
    'corporate_voice_01.mp3',
    'corporate_voice_02.mp3',
    'corporate_voice_03.mp3'
  ];
  
  const audioSeleccionado = audiosFallback[Math.floor(Math.random() * audiosFallback.length)];
  const audioPath = path.join(process.cwd(), 'assets', 'audio', 'fallback', audioSeleccionado);
  
  try {
    return await fs.readFile(audioPath);
  } catch (error) {
    // Si no existe el archivo, crear un buffer vacío (silencio)
    logger.warn('[MurfService] Archivo de fallback no encontrado, usando silencio');
    return Buffer.alloc(44100 * 10); // 10 segundos de silencio
  }
}

/**
 * Obtiene lista de voces comerciales disponibles
 */
export function obtenerVocesComerciales(): typeof VOCES_COMERCIALES {
  return VOCES_COMERCIALES;
}

/**
 * Valida configuración de Murf
 */
export function validarConfiguracionMurf(): boolean {
  return !!process.env.MURF_API_KEY;
}

/**
 * Estima duración de texto en segundos
 */
export function estimarDuracionTexto(texto: string): number {
  // Estimación: ~150 palabras por minuto en inglés comercial
  const palabras = texto.split(' ').length;
  const minutos = palabras / 150;
  return Math.ceil(minutos * 60);
}
