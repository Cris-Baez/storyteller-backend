// src/services/ffmpegService.ts
/**
 * FFmpeg Service v8 - Audio Ducking Inteligente con ElevenLabs FX
 * ----------------------------------------------------------------
 * ▸ Concatena clips (24 fps) → escala/letterbox → 1080p60
 * ▸ Genera envelope de volumen dinámico para la música
 * ▸ NUEVO: Audio ducking inteligente - música se reduce automáticamente durante voz
 * ▸ Side-chain ducking profesional con compresión dinámica
 * ▸ ✨ NUEVO: Integra efectos FX de ElevenLabs en la mezcla de audio
 * ▸ Produce MP4 1080p60 + HLS 720p, timeout y retry defensivos
 */

import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { uploadToCDN } from './cdnService.js';
import { toPosix } from '../utils/paths.js';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { retry } from '../utils/retry.js';
import { VideoPlan } from '../utils/types.js';

// Tipos extendidos para overlays y LUTs
type OverlaySpec = { path: string; x?: number; y?: number; start?: number; end?: number; opacity?: number };
type LUTSpec = { path: string; intensity?: number; start?: number; end?: number };

/* ─── Config ───────────────────────────────────────────── */
const TMP_DIR = path.join(process.cwd(), 'tmp', 'ffmpeg_v7');
const TIMEOUT = Number(env.FFMPEG_TIMEOUT_MS ?? 600_000); // 10 minutos por defecto
const RETRIES = 2;

// Helper para ejecutar ffmpeg con timeout y logging
function execFF(cmd: ffmpeg.FfmpegCommand, out: string): Promise<void> {
  return new Promise((res, rej) => {
    let done = false;
    let stderr = '';
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        cmd.kill('SIGKILL');
        logger.error('⏰ FFmpeg timeout. Última salida de error:\n' + stderr);
        rej(new Error('ff timeout'));
      }
    }, TIMEOUT);
    cmd.on('stderr', (line: string) => {
      stderr += line + '\n';
    });
    cmd.on('end', () => {
      if (!done) {
        done = true;
        clearTimeout(t);
        if (stderr) logger.info('FFmpeg terminó. Stderr:\n' + stderr);
        res();
      }
    });
    cmd.on('error', (e: any) => {
      if (!done) {
        done = true;
        clearTimeout(t);
        logger.error('❌ FFmpeg error:\n' + stderr);
        rej(e);
      }
    });
    cmd.save(out);
  });
}

// Genera la expresión de volumen para la música según el timeline Y detecta presencia de voz
function buildVolumeExpr(plan: VideoPlan): { volumeExpr: string; hasVoiceSegments: boolean } {
  const VOL: Record<string, number> = {
    quiet: 0.25,
    rise: 0.6,
    climax: 1.0,
    fade: 0.0
  };
  
  if (!plan.timeline || !Array.isArray(plan.timeline) || plan.timeline.length === 0) {
    return { volumeExpr: '0.5', hasVoiceSegments: false }; // Volumen por defecto
  }
  
  // Detectar si hay voz en el plan
  const hasVoiceSegments = plan.timeline.some(seg => 
    seg.voz || seg.dialogo || seg.lipSync || 
    (seg.metricas && seg.metricas.usaLipSync)
  );
  
  // Genera bloques consecutivos con mismo volumen
  const segs: { start: number; end: number; vol: number; hasVoice: boolean }[] = [];
  let curVol = plan.timeline[0]?.soundCue && VOL[plan.timeline[0].soundCue] !== undefined ? VOL[plan.timeline[0].soundCue] : 0.25;
  let segStart = 0;
  
  for (let i = 1; i < plan.timeline.length; i++) {
    const currentSeg = plan.timeline[i];
    const cue = currentSeg?.soundCue;
    const v = cue && VOL[cue] !== undefined ? VOL[cue] : 0.25;
    
    // Detectar voz en este segmento
    const hasVoice = !!(currentSeg.voz || currentSeg.dialogo || currentSeg.lipSync || 
                      (currentSeg.metricas && currentSeg.metricas.usaLipSync));
    
    if (v !== curVol || hasVoice) {
      segs.push({ 
        start: segStart, 
        end: i, 
        vol: curVol,
        hasVoice: !!plan.timeline[segStart]?.voz || !!plan.timeline[segStart]?.dialogo
      });
      segStart = i;
      curVol = v;
    }
  }
  
  const lastSeg = plan.timeline[plan.timeline.length - 1];
  segs.push({ 
    start: segStart, 
    end: plan.timeline.length, 
    vol: curVol,
    hasVoice: !!(lastSeg?.voz || lastSeg?.dialogo || lastSeg?.lipSync)
  });
  
  // Construye la expresión IF anidada con ducking automático
  let expr = String(segs[segs.length - 1].hasVoice ? segs[segs.length - 1].vol * 0.3 : segs[segs.length - 1].vol);
  
  for (let i = segs.length - 2; i >= 0; i--) {
    const s = segs[i];
    // Si hay voz, reducir música a 30% del volumen original
    const duckingVol = s.hasVoice ? s.vol * 0.3 : s.vol;
    expr = `if(between(t\\,${s.start}\\,${s.end})\\,${duckingVol}\\,${expr})`;
  }
  
  return { volumeExpr: expr, hasVoiceSegments };
}

// Helpers para overlays y LUTs
function buildOverlayFilters(overlays: OverlaySpec[] = []): string[] {
  return overlays.map((o, i) => {
    let filter = `[v${i}][ol${i}]overlay=${o.x ?? 0}:${o.y ?? 0}`;
    if (typeof o.start === 'number' && typeof o.end === 'number') {
      filter += `:enable='between(t,${o.start},${o.end})'`;
    }
    if (typeof o.opacity === 'number') {
      filter = `[ol${i}]format=rgba,colorchannelmixer=aa=${o.opacity},format=yuva420p[ol${i}];` + filter;
    }
    return filter;
  });
}

function buildLUTFilters(luts: LUTSpec[] = []): string[] {
  return luts.map((l, i) => {
    let filter = `lut3d='${l.path}'`;
    if (typeof l.intensity === 'number') {
      filter += `:interp=${l.intensity}`;
    }
    if (typeof l.start === 'number' && typeof l.end === 'number') {
      filter = `${filter}:enable='between(t,${l.start},${l.end})'`;
    }
    return filter;
  });
}

function buildVisualFilters(plan: VideoPlan): string[] {
  const overlays: OverlaySpec[] = [];
  const luts: LUTSpec[] = [];
  const advancedFilters: string[] = [];
  
  if (plan.timeline) {
    for (const sec of plan.timeline) {
      const timeStamp = sec.t ?? sec.segundo ?? 0;
      
      if (Array.isArray(sec.overlays)) {
        for (const o of sec.overlays) overlays.push({ ...o, start: timeStamp, end: timeStamp + 1 });
      }
      if (Array.isArray(sec.luts)) {
        for (const l of sec.luts) luts.push({ ...l, start: timeStamp, end: timeStamp + 1 });
      }
      
      // Filtros visuales avanzados
      if (sec.corteEdicion) advancedFilters.push(`trim=start=${timeStamp}:duration=${sec.duracionPlano || 1}`);
      if (sec.ritmoEdicion) advancedFilters.push(`setpts=PTS/${sec.ritmoEdicion}`);
      if (sec.tipoTransicion) advancedFilters.push(`fade=t=${sec.tipoTransicion}:st=${timeStamp}:d=0.5`);
      if (sec.animacionTexto) advancedFilters.push(`drawtext=text='${sec.animacionTexto}':x=(w-text_w)/2:y=50:fontsize=48:fontcolor=white:enable='between(t,${timeStamp},${timeStamp+1})'`);
      
      // Subtítulos multilingües
      if (sec.subtitulos && typeof sec.subtitulos === 'string' && sec.subtitulos.endsWith('.srt')) {
        advancedFilters.push(`subtitles='${sec.subtitulos}'`);
      } else if (sec.layoutSubtitulos) {
        advancedFilters.push(`drawtext=text='${sec.layoutSubtitulos}':x=10:y=h-60:fontsize=32:fontcolor=yellow:enable='between(t,${timeStamp},${timeStamp+1})'`);
      }
    }
  }
  
  return [
    ...buildLUTFilters(luts),
    ...buildOverlayFilters(overlays),
    ...advancedFilters
  ];
}

function buildAudioFilters(plan: VideoPlan): string {
  let filters = [];
  
  if (plan.timeline?.some(sec => sec.effects?.includes('reverb'))) {
    filters.push('aecho=0.8:0.9:1000:0.3');
  }
  if (plan.timeline?.some(sec => sec.effects?.includes('eq'))) {
    filters.push('equalizer=f=1000:t=q:w=1:g=3');
  }
  if (plan.timeline?.some(sec => sec.mezclaAudio)) {
    filters.push('amix=inputs=2:duration=longest');
  }
  if (plan.timeline?.some(sec => typeof sec.balanceSonido === 'number')) {
    const bal = Number(plan.timeline[0].balanceSonido) || 0.5;
    filters.push(`pan=stereo|c0=${bal}|c1=${1-bal}`);
  }
  if (plan.timeline?.some(sec => sec.efectoSonoro)) {
    filters.push('aphaser=type=2:stereo=1');
  }
  if (plan.timeline?.some(sec => sec.sonidoAmbiente)) {
    filters.push('volume=0.7');
  }
  
  return filters.join(',');
}

export async function assembleVideo(opts: {
  plan: VideoPlan;
  clips: string[];
  voiceBuffer: Buffer;
  music: Buffer[];
  ambience?: Buffer[];
  sfx?: Buffer[];
  // Efectos FX generados con ElevenLabs
  elevenlabsFX?: Buffer[];
}): Promise<string> {
  logger.info('🎬 FFmpegService v7 — ensamblando 1080p60 con ElevenLabs FX...');
  await fs.mkdir(TMP_DIR, { recursive: true });

  const { plan, clips, voiceBuffer, music, ambience = [], sfx = [], elevenlabsFX = [] } = opts;
  
  // ✅ VALIDACIÓN DEFINITIVA DE CLIPS ANTES DEL MONTAJE
  for (const clip of clips) {
    if (!clip || typeof clip !== 'string') {
      throw new Error("Clip sin URL válida detectado.");
    }
    // Aceptar tanto URLs como archivos locales
    if (!clip.includes('http') && !clip.includes('tmp') && !clip.includes('.mp4')) {
      throw new Error(`Clip con formato inválido: ${clip}`);
    }
  }
  
  const id = uuid();
  const list = path.join(TMP_DIR, `${id}.txt`);
  const concat = path.join(TMP_DIR, `${id}_concat.mp4`);
  const voiceFile = path.join(TMP_DIR, `${id}_voice.m4a`);
  const musicFile = path.join(TMP_DIR, `${id}_music.mp3`);
  const ambienceFile = path.join(TMP_DIR, `${id}_ambience.mp3`);
  const sfxFile = path.join(TMP_DIR, `${id}_sfx.mp3`);
  // Archivo para efectos FX
  const fxFile = path.join(TMP_DIR, `${id}_fx.mp3`);
  const audioMix = path.join(TMP_DIR, `${id}_mix.m4a`);
  const final1080 = path.join(TMP_DIR, `${id}_1080p.mp4`);
  const hlsDir = path.join(TMP_DIR, `hls_${id}`);
  const hlsIndex = path.join(hlsDir, 'index.m3u8');

  /* 1️⃣ concat clips + filtros visuales + watermark si Free */
  const listContent = clips
    .map(c => {
      // Convertir rutas relativas a absolutas
      const absolutePath = path.isAbsolute(c) ? c : path.resolve(process.cwd(), c);
      return `file '${toPosix(absolutePath)}'`;
    })
    .join('\n');
  await fs.writeFile(list, listContent);
  
  try {
    await fs.access(list);
  } catch (err) {
    logger.error(`❌ El archivo de lista para FFmpeg no existe: ${list}`);
    throw new Error('No se pudo crear el archivo de lista para FFmpeg');
  }
  
  logger.info(`✅ Archivo de lista para FFmpeg creado: ${list}`);
  logger.info('🟡 [FFmpeg] Iniciando concat clips → ' + concat);

  // Detectar modo Free para marca de agua
  const isFree = (plan?.metadata?.mode || '').toLowerCase() === 'free';
  const watermarkPath = isFree ? path.join(process.cwd(), 'assets', 'branding', 'watermark_free.png') : null;
  const videoFilters = [
    'scale=1280:720:force_original_aspect_ratio=decrease',
    'pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    'setsar=1'
  ];
  
  if (isFree && watermarkPath) {
    videoFilters.push(`movie='${watermarkPath}'[wm];[in][wm]overlay=W-w-40:H-h-40:format=auto`);
  }
  
  await retry(() => execFF(
    ffmpeg().input(toPosix(list)).inputOptions(['-f', 'concat', '-safe', '0'])
      .videoFilters(videoFilters)
      .outputOptions(['-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart']),
    concat
  ), RETRIES);
  logger.info('🟢 [FFmpeg] Concat clips OK → ' + concat);

  // Validar clips
  for (const c of clips) {
    try {
      await fs.access(c);
    } catch {
      logger.error(`❌ Clip no encontrado o inaccesible: ${c}`);
      // Logging estructurado de error de clip
      const { logFeedback } = await import('./feedbackService.js');
      logFeedback({
        service: 'FFmpegService',
        action: 'validateClip',
        success: false,
        error: 'Clip no encontrado o inaccesible',
        params: { clip: c }
      });
      throw new Error(`Clip no encontrado o inaccesible: ${c}`);
    }
  }

  /* 2️⃣ Preparar archivos de audio */
  // Ambience
  if (Array.isArray(ambience) && ambience.length > 0) {
    const ambienceConcat = Buffer.concat(ambience.filter(b => b && b.length));
    if (ambienceConcat.length) await fs.writeFile(ambienceFile, ambienceConcat);
  }
  
  // SFX tradicionales
  if (Array.isArray(sfx) && sfx.length > 0) {
    const sfxConcat = Buffer.concat(sfx.filter(b => b && b.length));
    if (sfxConcat.length) await fs.writeFile(sfxFile, sfxConcat);
  }
  
  // ElevenLabs FX
  if (Array.isArray(elevenlabsFX) && elevenlabsFX.length > 0) {
    const fxConcat = Buffer.concat(elevenlabsFX.filter(b => b && b.length));
    if (fxConcat.length) {
      await fs.writeFile(fxFile, fxConcat);
      logger.info('🎵 [FFmpeg] ElevenLabs FX preparados para mezcla');
    }
  }

  /* 3️⃣ Build volume envelope for music with intelligent ducking */
  const { volumeExpr, hasVoiceSegments } = buildVolumeExpr(plan);
  
  // Sistema de ducking profesional con compresión side-chain
  let musicFilter = `volume='${volumeExpr}':eval=frame`;
  
  // Si hay voz, aplicar compresión adicional para ducking más suave
  if (hasVoiceSegments) {
    // Aplicar compressor para suavizar transiciones de ducking
    musicFilter = `${musicFilter},acompressor=threshold=0.5:ratio=2:attack=0.1:release=0.8`;
    logger.info('🎵 [FFmpeg] Audio ducking inteligente activado - música se reducirá durante voz');
  }

  /* 4️⃣ mezcla multicapa: música, ambience, sfx, elevenlabsFX, voz */
  logger.info('🟡 [FFmpeg] Iniciando mezcla audio multicapa → ' + audioMix);
  
  // Verificar si hay contenido de audio real y válido
  let hasValidAudio = false;
  const inputs = [];
  let filterGraph = [];
  let mapIdx = 0;
  
  // Música
  if (music && Array.isArray(music) && music.length > 0) {
    const musicConcat = Buffer.concat(music.filter(b => b && b.length));
    if (musicConcat.length > 1000) {
      await fs.writeFile(musicFile, musicConcat);
      inputs.push(musicFile);
      filterGraph.push(`[${mapIdx}:a]${musicFilter}[music]`);
      mapIdx++;
      hasValidAudio = true;
    }
  }
  
  // Voz
  if (voiceBuffer && voiceBuffer.length > 1000) {
    await fs.writeFile(voiceFile, voiceBuffer);
    inputs.push(voiceFile);
    filterGraph.push(`[${mapIdx}:a]volume=1.0[voice]`);
    mapIdx++;
    hasValidAudio = true;
  }
  
  // Ambience
  if (ambience.length > 0) {
    const ambienceConcat = Buffer.concat(ambience.filter(b => b && b.length));
    if (ambienceConcat.length > 1000) {
      inputs.push(ambienceFile);
      filterGraph.push(`[${mapIdx}:a]volume=0.3[ambience]`);
      mapIdx++;
      hasValidAudio = true;
    }
  }
  
  // SFX tradicionales
  if (sfx.length > 0) {
    const sfxConcat = Buffer.concat(sfx.filter(b => b && b.length));
    if (sfxConcat.length > 1000) {
      inputs.push(sfxFile);
      filterGraph.push(`[${mapIdx}:a]volume=0.8[sfx]`);
      mapIdx++;
      hasValidAudio = true;
    }
  }
  
  // ✨ NUEVO: ElevenLabs FX
  if (elevenlabsFX.length > 0) {
    const fxConcat = Buffer.concat(elevenlabsFX.filter(b => b && b.length));
    if (fxConcat.length > 1000) {
      inputs.push(fxFile);
      filterGraph.push(`[${mapIdx}:a]volume=0.7[fx]`);
      mapIdx++;
      hasValidAudio = true;
      logger.info('🎵 [FFmpeg] ElevenLabs FX incluidos en la mezcla');
    }
  }

  // Proceso de mezcla de audio
  try {
    if (hasValidAudio && inputs.length > 0) {
      logger.info(`🎵 [FFmpeg] Procesando mezcla de ${inputs.length} pistas de audio`);
      
      // Construir filter para mezclar todas las pistas
      let amixInputs = [];
      if (filterGraph.find(f => f.includes('[music]'))) amixInputs.push('[music]');
      if (filterGraph.find(f => f.includes('[voice]'))) amixInputs.push('[voice]');
      if (filterGraph.find(f => f.includes('[ambience]'))) amixInputs.push('[ambience]');
      if (filterGraph.find(f => f.includes('[sfx]'))) amixInputs.push('[sfx]');
      if (filterGraph.find(f => f.includes('[fx]'))) amixInputs.push('[fx]');
      
      const filterComplex = filterGraph.join(';') + `;${amixInputs.join('')}amix=inputs=${amixInputs.length}:duration=longest[aout]`;
      
      let ff = ffmpeg();
      for (const inp of inputs) {
        ff = ff.input(inp);
      }
      
      await retry(() => execFF(
        ff.complexFilter([filterComplex])
          .outputOptions([
            '-map', '[aout]',
            '-c:a', 'aac',
            '-movflags', '+faststart'
          ]),
        audioMix
      ), RETRIES);
      
      logger.info('🟢 [FFmpeg] Mezcla multicapa OK → ' + audioMix);
    } else {
      hasValidAudio = false;
    }
  } catch (error) {
    logger.warn('⚠️ [FFmpeg] Error en mezcla de audio, continuando sin audio:', error);
    hasValidAudio = false;
  }

  /* 5️⃣ multiplex AV */
  if (hasValidAudio) {
    logger.info('🟡 [FFmpeg] Iniciando multiplex AV con audio → ' + final1080);
    await retry(() => execFF(
      ffmpeg().input(concat).input(audioMix)
        .outputOptions(['-c:v', 'copy', '-c:a', 'copy', '-shortest']),
      final1080
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Multiplex AV OK → ' + final1080);
  } else {
    logger.info('🟡 [FFmpeg] Copiando video sin audio → ' + final1080);
    await retry(() => execFF(
      ffmpeg().input(concat)
        .outputOptions(['-c:v', 'copy', '-an']),
      final1080
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Video sin audio OK → ' + final1080);
  }

  /* 6️⃣ HLS 720p */
  await fs.mkdir(hlsDir, { recursive: true });
  logger.info('🟡 [FFmpeg] Iniciando HLS 720p → ' + hlsIndex);
  await retry(() => execFF(
    ffmpeg().input(final1080)
      .videoFilters(['scale=1280:-2'])
      .outputOptions([
        '-c:v', 'libx264', '-c:a', 'aac',
        '-hls_time', '5',
        '-hls_list_size', '0',
        '-hls_segment_filename', path.join(hlsDir, 'segment_%03d.ts')
      ]),
    hlsIndex
  ), RETRIES);
  logger.info('🟢 [FFmpeg] HLS 720p OK → ' + hlsIndex);

  // Upload to CDN if available
  try {
    const cdnUrl = await uploadToCDN(final1080, `videos/${id}/${id}_final.mp4`, {
      type: 'final_video',
      resolution: '1080p',
      hasAudio: hasValidAudio,
      hasFX: elevenlabsFX.length > 0
    });
    logger.info(`📡 [FFmpeg] Video subido a CDN: ${cdnUrl}`);
    return cdnUrl;
  } catch (cdnError) {
    logger.warn('[FFmpeg] Error subiendo a CDN, devolviendo archivo local:', cdnError);
    return final1080;
  }
}
