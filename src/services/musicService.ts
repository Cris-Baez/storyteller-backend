import { logFeedback } from './feedbackService.js';
/**
 * getAdvancedMusic (public)
 * Genera música de fondo personalizada usando campos avanzados del VideoPlan
 */
export async function getAdvancedMusic(options: {
  musicaAvanzada?: string;
  music?: string;
  mezclaAudio?: string;
  balanceSonido?: string;
  motivoVisual?: string;
  sonidoAmbiente?: string;
  emotion?: string;
  region?: string;
  idioma?: string;
  style?: string;
  subtitulos?: string;
}) : Promise<Buffer> {
  // Construir el estilo de búsqueda combinando los campos relevantes
  let style = options.musicaAvanzada || options.music || options.style || 'cinematic';
  if (options.emotion) style += ` ${options.emotion}`;
  if (options.motivoVisual) style += ` ${options.motivoVisual}`;
  if (options.sonidoAmbiente) style += ` ${options.sonidoAmbiente}`;
  if (options.region) style += ` ${options.region}`;
  if (options.idioma) style += ` ${options.idioma}`;
  if (options.subtitulos && typeof options.subtitulos === 'string') {
    // Si hay subtítulos multilingües, agregar palabras clave para adaptar la música
    style += ` ${options.subtitulos.split(' ').slice(0, 5).join(' ')}`;
  }
  // Puedes agregar más lógica para mezclaAudio, balanceSonido, etc.
  logger.info(`🎵  Buscar música avanzada para: "${style}"`);
  const raw =
    (await fetchFromFreesound(style)) ??
    (await fetchFromArtlist(style));
  if (!raw) {
    logger.warn('⚠️  No se encontró música avanzada; devolviendo buffer vacío');
    logFeedback({
      service: 'Music',
      action: 'getAdvancedMusic',
      success: false,
      error: 'No se pudo generar la pista de música avanzada',
      params: { options }
    });
    throw new Error('No se pudo generar la pista de música avanzada');
  }
  const buf = await normalise(raw);
  if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
    logger.error('❌ La pista de música avanzada generada está vacía o es inválida');
    logFeedback({
      service: 'Music',
      action: 'getAdvancedMusic',
      success: false,
      error: 'La pista de música avanzada generada está vacía o es inválida',
      params: { options }
    });
    throw new Error('La pista de música avanzada generada está vacía o es inválida');
  }
  logger.info(`✅  Pista de música avanzada lista (${buf.length} bytes)`);
  return buf;
}
/**
 * Music Service v2
 * ----------------
 * • Busca tracks CC-0 en Freesound ➜ fallback Artlist API (si token)
 * • Filtra por duración ≥ 60 s y categoría “cinematic”
 * • Descarga en WAV 48 kHz, normaliza a -20 LUFS (EBU R128)
 * • Caching simple (TMP) para evitar reutilizar ancho de banda
 * • Timeout y retry integrados
 */

import axios               from 'axios';
import { env }             from '../config/env.js';
import { logger }          from '../utils/logger.js';
import { retry }           from '../utils/retry.js';
import fs                  from 'fs/promises';
import path                from 'path';
import { v4 as uuid }      from 'uuid';
import { spawn }           from 'child_process';
import ffmpegPath          from 'ffmpeg-static';

const TIMEOUT = 600_000; // 10 minutos para descargas de música
const CACHE_DIR = '/tmp/music_cache';

// Crear directorio de caché de forma síncrona
import { existsSync, mkdirSync } from 'fs';
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('music timeout')), ms))
  ]);
}

/* ─────────────────────────────
 * Freesound provider
 * ───────────────────────────── */
async function fetchFromFreesound(style: string): Promise<Buffer | null> {
  if (!env.FREESOUND_API_KEY) {
    throw new Error('FREESOUND_API_KEY is missing');
  }
  const query = encodeURIComponent(`${style} cinematic`);
  const url   = `https://freesound.org/apiv2/search/text/?query=${query}` +
                `&fields=id,name,previews,duration,license` +
                `&filter=duration:[60 TO 600] license:"Creative Commons 0"` +
                `&sort=score&token=${env.FREESOUND_API_KEY}`;

  logger.info(`🎵  Freesound query: ${style}`);
  const { data } = await withTimeout(retry(() => axios.get(url)));
  if (!data.results?.length) return null;

  // Selecciona el que tenga mayor score
  const track = data.results[0];
  const dlUrl = track.previews['preview-hq-mp3'];
  const cacheFile = path.join(CACHE_DIR, `${track.id}.mp3`);

  // Cache
  try {
    await fs.access(cacheFile);
    logger.debug(`Freesound cache hit: ${track.id}`);
    return fs.readFile(cacheFile);
  } catch { /* miss */ }

  const audio = await withTimeout(retry(() => axios.get(dlUrl, { responseType: 'arraybuffer' })));
  await fs.writeFile(cacheFile, audio.data);
  return Buffer.from(audio.data);
}

/* ─────────────────────────────
 * Artlist provider (opcional)
 * ───────────────────────────── */
async function fetchFromArtlist(style: string): Promise<Buffer | null> {
  if (!env.ARTLIST_TOKEN) return null;
  try {
    logger.info('🎵  Artlist fallback');
    const { data } = await withTimeout(
      retry(() => axios.get(
        `https://api.artlist.io/v3/search?licenseType=personal&keywords=${encodeURIComponent(style)}+cinematic`,
        { headers: { Authorization: `Bearer ${env.ARTLIST_TOKEN}` } }
      ))
    );
    const track = data.tracks?.[0];
    if (!track) return null;
    const audio = await withTimeout(
      retry(() => axios.get(track.directDownloadUrl, { responseType: 'arraybuffer' }))
    );
    return Buffer.from(audio.data);
  } catch (e: any) {
    logger.warn(`Artlist error: ${e.message}`);
    return null;
  }
}

/* ─────────────────────────────
 * Loudness normalisation (-20 LUFS, -1 dBTP)
 * ───────────────────────────── */
async function normalise(buf: Buffer): Promise<Buffer> {
  return new Promise((res, rej) => {
    if (typeof ffmpegPath !== 'string') {
      return rej(new Error('ffmpeg path not found'));
    }
    const ff = spawn(ffmpegPath, [
      '-i', 'pipe:0',
      '-af', 'loudnorm=I=-20:TP=-1.0',
      '-ar', '48000',
      '-f', 'mp3', 'pipe:1'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    ff.stdout?.on('data', (d: Buffer) => chunks.push(d));
    ff.on('error', rej);
    ff.on('close', () => res(Buffer.concat(chunks)));
    ff.stdin?.write(buf);
    ff.stdin?.end();
  });
}

/* ═════════════════════════════
 * getBackgroundMusic (public)
 * ═════════════════════════════ */
export async function getBackgroundMusic(style: string, previewMode?: boolean): Promise<Buffer> {
  logger.info(`🎵  Buscar música de fondo para "${style}"${previewMode ? ' [PREVIEW MODE]' : ''}`);
  if (typeof style !== 'string' || !style.trim()) {
    logger.error('[MusicService] Estilo de música inválido');
    logFeedback({
      service: 'Music',
      action: 'getBackgroundMusic',
      success: false,
      error: 'Estilo de música inválido',
      params: { style, previewMode }
    });
    throw new Error('Estilo de música inválido');
  }
  let raw;
  const start = Date.now();
  if (previewMode) {
    // En modo preview, usar un sample corto o compresión extra
    raw = await fetchFromFreesound('short ' + style) ?? await fetchFromArtlist('short ' + style);
  } else {
    raw = await fetchFromFreesound(style) ?? await fetchFromArtlist(style);
  }
  if (!raw) {
    logFeedback({
      service: 'Music',
      action: 'getBackgroundMusic',
      timeoutMs: TIMEOUT,
      elapsedMs: Date.now() - start,
      success: false
    });
    throw new Error('No se pudo generar la pista de música');
  } else {
    logFeedback({
      service: 'Music',
      action: 'getBackgroundMusic',
      timeoutMs: TIMEOUT,
      elapsedMs: Date.now() - start,
      success: true
    });
  }
  // En preview, podrías normalizar a menor bitrate o recortar
  let buf = await normalise(raw);
  if (previewMode && buf && Buffer.isBuffer(buf)) {
    buf = buf.subarray(0, Math.min(buf.length, 2000000)); // máx 2MB para preview
  }
  if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
    logger.error('❌ La pista de música generada está vacía o es inválida');
    throw new Error('La pista de música generada está vacía o es inválida');
  }

  return buf;
}
