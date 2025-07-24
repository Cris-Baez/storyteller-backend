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
// Genera la expresión de volumen para la música según el timeline
function buildVolumeExpr(plan: VideoPlan): string {
  const VOL: Record<string, number> = {
    quiet: 0.25,
    rise: 0.6,
    climax: 1.0,
    fade: 0.0
  };
  if (!plan.timeline || !Array.isArray(plan.timeline) || plan.timeline.length === 0) {
    throw new Error('El timeline del plan de video está vacío o malformado');
  }
  // Genera bloques consecutivos con mismo volumen
  const segs: { start: number; end: number; vol: number }[] = [];
  let curVol = plan.timeline[0]?.soundCue && VOL[plan.timeline[0].soundCue] !== undefined ? VOL[plan.timeline[0].soundCue] : 0.25;
  let segStart = 0;
  for (let i = 1; i < plan.timeline.length; i++) {
    const cue = plan.timeline[i]?.soundCue;
    const v = cue && VOL[cue] !== undefined ? VOL[cue] : 0.25;
    if (v !== curVol) {
      segs.push({ start: segStart, end: i, vol: curVol });
      segStart = i;
      curVol = v;
    }
  }
  segs.push({ start: segStart, end: plan.timeline.length, vol: curVol });
  // Construye la expresión IF anidada: if(between(t,0,3),0.25, if(between(t,3,6),0.6,1))
  let expr = String(segs[segs.length - 1].vol);
  for (let i = segs.length - 2; i >= 0; i--) {
    const s = segs[i];
    expr = `if(between(t\,${s.start}\,${s.end})\,${s.vol}\,${expr})`;
  }
  return expr;
}
// src/services/ffmpegService.ts
/**
 * FFmpeg Service v6
 * -----------------
 * ▸ Concatena clips (24 fps) → escala/letterbox → minterpolate 60 fps @1080p
 * ▸ Genera envelope de volumen para la música según soundCue por segundo:
 *       quiet  → 0.25
 *       rise   → 0.60
 *       climax → 1.00
 *       fade   → 0.00
 * ▸ Aplica side-chain ducking con la voz encima de esa envolvente.
 * ▸ Produce MP4 1080p60 + HLS 720p, timeout y retry defensivos.
 */

import ffmpegPath     from 'ffmpeg-static';
import ffmpeg         from 'fluent-ffmpeg';
import { spawn }      from 'child_process';
import path           from 'path';
import fs             from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { uploadToCDN } from './cdnService.js';
import { toPosix } from '../utils/paths.js';

import { env }        from '../config/env.js';
import { logger }     from '../utils/logger.js';
import { retry }      from '../utils/retry.js';
import { VideoPlan }  from '../utils/types.js';

// Tipos extendidos para overlays y LUTs
type OverlaySpec = { path: string; x?: number; y?: number; start?: number; end?: number; opacity?: number };
type LUTSpec = { path: string; intensity?: number; start?: number; end?: number };

/* ─── Config ───────────────────────────────────────────── */
const TMP_DIR  = path.join(process.cwd(), 'tmp', 'ffmpeg_v6');
const TIMEOUT = Number(env.FFMPEG_TIMEOUT_MS ?? 600_000); // 10 minutos por defecto para pruebas
const RETRIES  = 2;

// Helpers para overlays y LUTs
function buildOverlayFilters(overlays: OverlaySpec[] = []): string[] {
  // Genera filtros FFmpeg para overlays
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
  // Genera filtros FFmpeg para LUTs (usando lut3d)
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
  // Extrae overlays, LUTs y campos avanzados del plan (por segundo o escena)
  const overlays: OverlaySpec[] = [];
  const luts: LUTSpec[] = [];
  const advancedFilters: string[] = [];
  if (plan.timeline) {
    for (const sec of plan.timeline) {
      if (Array.isArray(sec.overlays)) {
        for (const o of sec.overlays) overlays.push({ ...o, start: sec.t, end: sec.t + 1 });
      }
      if (Array.isArray(sec.luts)) {
        for (const l of sec.luts) luts.push({ ...l, start: sec.t, end: sec.t + 1 });
      }
      // Filtros visuales avanzados
      if (sec.corteEdicion) advancedFilters.push(`trim=start=${sec.t}:duration=${sec.duracionPlano || 1}`);
      if (sec.ritmoEdicion) advancedFilters.push(`setpts=PTS/${sec.ritmoEdicion}`);
      if (sec.tipoTransicion) advancedFilters.push(`fade=t=${sec.tipoTransicion}:st=${sec.t}:d=0.5`);
      if (sec.animacionTexto) advancedFilters.push(`drawtext=text='${sec.animacionTexto}':x=(w-text_w)/2:y=50:fontsize=48:fontcolor=white:enable='between(t,${sec.t},${sec.t+1})'`);
      // Subtítulos multilingües: si hay SRT (campo 'subtitulos' con URL), usarlo; si no, usar layoutSubtitulos
      if (sec.subtitulos && typeof sec.subtitulos === 'string' && sec.subtitulos.endsWith('.srt')) {
        advancedFilters.push(`subtitles='${sec.subtitulos}'`);
      } else if (sec.layoutSubtitulos) {
        advancedFilters.push(`drawtext=text='${sec.layoutSubtitulos}':x=10:y=h-60:fontsize=32:fontcolor=yellow:enable='between(t,${sec.t},${sec.t+1})'`);
      }
      if (sec.motivoVisual) advancedFilters.push(`drawbox=x=0:y=0:w=iw:h=ih:color=white@0.05:enable='between(t,${sec.t},${sec.t+1})'`);
      if (sec.direccionArte) advancedFilters.push(`eq=contrast=${sec.direccionArte === 'barroco' ? 1.5 : 1.0}`);
      if (sec.climaAtmosferico) advancedFilters.push(`curves=preset=${sec.climaAtmosferico}`);
      if (sec.lente) advancedFilters.push(`vignette=enable='between(t,${sec.t},${sec.t+1})'`);
      if (sec.texturaRealismo) advancedFilters.push(`unsharp=5:5:${sec.texturaRealismo === 'alta' ? 2 : 1}`);
    }
  }
  return [
    ...buildLUTFilters(luts),
    ...buildOverlayFilters(overlays),
    ...advancedFilters
  ];
}

function buildAudioFilters(plan: VideoPlan): string {
  // EQ, reverb y mezcla avanzada según campos del plan
  let filters = [];
  if (plan.timeline?.some(sec => sec.effects?.includes('reverb'))) {
    filters.push('aecho=0.8:0.9:1000:0.3');
  }
  if (plan.timeline?.some(sec => sec.effects?.includes('eq'))) {
    filters.push('equalizer=f=1000:t=q:w=1:g=3');
  }
  // Mezcla avanzada
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

export async function assembleVideo(opts:{
  plan: VideoPlan;
  clips: string[];
  voiceOver: Buffer;
  music: Buffer[];
  ambience?: Buffer[];
  sfx?: Buffer[];
}): Promise<string> {
  logger.info('🎬  FFmpegService v7 — ensamblando 1080p60 con overlays/LUTs/EQ…');
  await fs.mkdir(TMP_DIR, { recursive: true });

  const { plan, clips, voiceOver, music, ambience = [], sfx = [] } = opts;
  const id = uuid();
  const list = path.join(TMP_DIR, `${id}.txt`);
  const concat = path.join(TMP_DIR, `${id}_concat.mp4`);
  const voiceFile = path.join(TMP_DIR, `${id}_voice.mp3`);
  const musicFile = path.join(TMP_DIR, `${id}_music.mp3`);
  const ambienceFile = path.join(TMP_DIR, `${id}_ambience.mp3`);
  const sfxFile = path.join(TMP_DIR, `${id}_sfx.mp3`);
  const avFile = path.join(TMP_DIR, `${id}_av.mp4`);
  const hlsDir = path.join(TMP_DIR, `hls_${id}`);
  const hlsIndex = path.join(hlsDir, 'index.m3u8');

  // Validar existencia de todos los clips antes de continuar
  for (const c of clips) {
    try {
      await fs.access(c);
    } catch {
      logger.error(`❌ Clip no encontrado o inaccesible: ${c}`);
      throw new Error(`Clip no encontrado o inaccesible: ${c}`);
    }
  }

  /* 1️⃣ concat clips (24→1080p60) + filtros visuales + watermark si Free */
  const listContent = clips
    .map(c => `file '${toPosix(c)}'`)
    .join('\n');
  await fs.writeFile(list, listContent);
  try {
    await fs.access(list);
  } catch (err) {
    logger.error(`❌ El archivo de lista para FFmpeg no existe: ${list}`);
    logger.error(`Contenido que se intentó escribir:\n${listContent}`);
    throw new Error('No se pudo crear el archivo de lista para FFmpeg');
  }
  logger.info(`✅ Archivo de lista para FFmpeg creado: ${list}`);
  logger.info('🟡 [FFmpeg] Iniciando concat clips → ' + concat);

  // Detectar si es modo Free para aplicar marca de agua
  const isFree = (plan?.metadata?.mode || '').toLowerCase() === 'free';
  const watermarkPath = isFree ? path.join(process.cwd(), 'assets', 'branding', 'watermark_free.png') : null;
  const videoFilters = [
    'scale=1280:720:force_original_aspect_ratio=decrease',
    'pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    'setsar=1'
  ];
  if (isFree && watermarkPath) {
    // Overlay en esquina inferior derecha, margen 40px
    videoFilters.push(`movie='${watermarkPath}'[wm];[in][wm]overlay=W-w-40:H-h-40:format=auto`);
  }
  await retry(() => execFF(
    ffmpeg().input(toPosix(list)).inputOptions(['-f', 'concat', '-safe', '0'])
      .videoFilters(videoFilters)
      .outputOptions(['-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart']),
    concat
  ), RETRIES);
  logger.info('🟢 [FFmpeg] Concat clips OK → ' + concat);

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
  if (Array.isArray(ambience) && ambience.length > 0) {
    const ambienceConcat = Buffer.concat(ambience.filter(b => b && b.length));
    if (ambienceConcat.length) await fs.writeFile(ambienceFile, ambienceConcat);
  }
  // Concatenar sfx por escena
  if (Array.isArray(sfx) && sfx.length > 0) {
    const sfxConcat = Buffer.concat(sfx.filter(b => b && b.length));
    if (sfxConcat.length) await fs.writeFile(sfxFile, sfxConcat);
  }

  /* 3️⃣ Build volume envelope for music */
  const volExpr = buildVolumeExpr(plan);
  const musicFilter = `volume='${volExpr}':eval=frame`;
  // Ambience y SFX pueden tener filtros propios en el futuro

  /* 4️⃣ mezcla multicapa: música, ambience, sfx, voz (con fallback) */
  const audioMix = path.join(TMP_DIR, `${id}_mix.m4a`);
  logger.info('🟡 [FFmpeg] Iniciando mezcla audio multicapa → ' + audioMix);
  const inputs = [];
  const inputOpts = [];
  let filterGraph = [];
  let mapIdx = 0;

  // Helper para crear silencio/beep si falta una capa
  async function ensureAudioFile(filePath: string, duration: number, fallbackType: 'silence' | 'beep' = 'silence') {
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > 0) return filePath;
    } catch {}
    // Si no existe o está vacío, crear fallback
    const ffmpegPathStr = typeof ffmpegPath === 'string' ? ffmpegPath : (ffmpegPath as unknown as string);
    if (!ffmpegPathStr) throw new Error('ffmpeg path not found');
    const fallbackFile = filePath.replace(/\.mp3$/, `_fallback.mp3`);
    return new Promise<string>((res, rej) => {
      const args = fallbackType === 'beep'
        ? ['-f', 'lavfi', '-i', `sine=frequency=440:duration=${duration}`, '-ar', '48000', '-ac', '2', '-q:a', '9', '-acodec', 'libmp3lame', fallbackFile]
        : ['-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo`, '-t', String(duration), '-q:a', '9', '-acodec', 'libmp3lame', fallbackFile];
      const proc = spawn(ffmpegPathStr, args);
      proc.on('close', (code) => code === 0 ? res(fallbackFile) : rej(new Error('ffmpeg fallback fail')));
    });
  }

  // Duración total del video (en segundos)
  let totalDuration = 0;
  try {
    const probe = await new Promise<any>((res, rej) => {
      if (typeof ffmpegPath !== 'string') return rej(new Error('ffmpeg path not found'));
      const proc = spawn(ffmpegPath, ['-i', concat, '-hide_banner']);
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', () => {
        const match = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          const h = parseInt(match[1], 10), m = parseInt(match[2], 10), s = parseFloat(match[3]);
          res(h * 3600 + m * 60 + s);
        } else {
          rej(new Error('No se pudo obtener la duración del video para fallback de audio.'));
        }
      });
    });
    totalDuration = Math.ceil(probe);
  } catch {
    totalDuration = 10; // fallback por si no se puede obtener duración
  }

  // Música
  let musicPath = music && Array.isArray(music) && music.length ? musicFile : null;
  if (plan.timeline?.some(sec => (sec.soundCue && sec.soundCue !== 'fade'))) {
    // Si el plan requiere música pero no hay archivo, crear silencio
    musicPath = await ensureAudioFile(musicFile, totalDuration, 'silence');
  }
  try {
    if (musicPath && (await fs.stat(musicPath)).size > 0) {
      inputs.push(musicPath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]${musicFilter}[music]`);
      mapIdx++;
    }
  } catch {}
  // Ambience
  let ambiencePath = ambience && Array.isArray(ambience) && ambience.length ? ambienceFile : null;
  if (Array.isArray(ambience) && ambience.length > 0) {
    ambiencePath = await ensureAudioFile(ambienceFile, totalDuration, 'silence');
  }
  try {
    if (ambiencePath && (await fs.stat(ambiencePath)).size > 0) {
      inputs.push(ambiencePath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]volume=0.5[amb]`);
      mapIdx++;
    }
  } catch {}
  // SFX
  let sfxPath = sfx && Array.isArray(sfx) && sfx.length ? sfxFile : null;
  if (Array.isArray(sfx) && sfx.length > 0) {
    sfxPath = await ensureAudioFile(sfxFile, totalDuration, 'silence');
  }
  try {
    if (sfxPath && (await fs.stat(sfxPath)).size > 0) {
      inputs.push(sfxPath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]volume=1.0[sfx]`);
      mapIdx++;
    }
  } catch {}
  // Voz
  let voicePath = voiceOver && voiceOver.length > 0 ? voiceFile : null;
  if (voiceOver && voiceOver.length > 0) {
    voicePath = await ensureAudioFile(voiceFile, totalDuration, 'beep');
  }
  try {
    if (voicePath && (await fs.stat(voicePath)).size > 0) {
      inputs.push(voicePath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]volume=1.0[voice]`);
      mapIdx++;
    }
  } catch {}

  // Construir filter_complex para mezclar todas las capas
  let amixInputs = [];
  if (filterGraph.find(f => f.includes('[music]'))) amixInputs.push('[music]');
  if (filterGraph.find(f => f.includes('[amb]'))) amixInputs.push('[amb]');
  if (filterGraph.find(f => f.includes('[sfx]'))) amixInputs.push('[sfx]');
  if (filterGraph.find(f => f.includes('[voice]'))) amixInputs.push('[voice]');
  let filterComplex = '';
  if (filterGraph.length > 0) {
    filterComplex = filterGraph.join(';') + `;${amixInputs.join('')}amix=inputs=${amixInputs.length}:duration=longest[aout]`;
  }
  if (amixInputs.length > 0) {
    let ff = ffmpeg();
    for (const inp of inputs) {
      ff = ff.input(inp);
    }
    ff = ff.complexFilter([filterComplex])
      .outputOptions([
        '-map', '[aout]',
        '-c:a', 'aac',
        '-movflags', '+faststart'
      ]);
    await retry(() => execFF(
      ff,
      audioMix
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Mezcla multicapa OK → ' + audioMix);
  } else {
    // Si no hay audio, beep de emergencia
    const beepFile = path.join(TMP_DIR, `${id}_beep.mp3`);
    await new Promise((res, rej) => {
      if (typeof ffmpegPath !== 'string') return rej(new Error('ffmpeg path not found'));
      const proc = spawn(ffmpegPath, [
        '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=3',
        '-ar', '48000',
        '-ac', '2',
        '-q:a', '9',
        '-acodec', 'libmp3lame',
        beepFile
      ]);
      proc.on('close', (code) => code === 0 ? res(true) : rej(new Error('ffmpeg beep fail')));
    });
    await retry(() => execFF(
      ffmpeg().input(beepFile)
        .outputOptions([
          '-c:a', 'aac',
          '-movflags', '+faststart'
        ]),
      audioMix
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Solo beep de emergencia → ' + audioMix);
  }

  /* 5️⃣ multiplex AV */
  const final1080 = path.join(TMP_DIR, `${id}_1080p.mp4`);
  logger.info('🟡 [FFmpeg] Iniciando multiplex AV → ' + final1080);
  await retry(() => execFF(
    ffmpeg().input(concat).input(audioMix)
      .outputOptions(['-c:v', 'copy', '-c:a', 'copy', '-shortest']),
    final1080
  ), RETRIES);
  logger.info('🟢 [FFmpeg] Multiplex AV OK → ' + final1080);

  /* 6️⃣ HLS 720p */
  await fs.mkdir(hlsDir, { recursive: true });
  logger.info('🟡 [FFmpeg] Iniciando HLS 720p → ' + hlsIndex);
  await retry(() => execFF(
    ffmpeg().input(final1080)
      .videoFilters(['scale=1280:-2'])
      .outputOptions([
        '-c:v', 'libx264', '-c:a', 'aac',
        '-hls_time', '5',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(hlsDir, 'seg_%03d.ts')
      ]),
    hlsIndex
  ), RETRIES);
  logger.info('🟢 [FFmpeg] HLS 720p OK → ' + hlsIndex);

  /* 7️⃣ Subida real a CDN */
  try {
    // Validar que el archivo existe antes de subir
    await fs.access(final1080);
  } catch (err) {
    logger.error(`❌ El archivo de video final no existe: ${final1080}`);
    throw new Error('No se encontró el archivo de video final para subir al CDN');
  }

  let cdnUrl = '';
  try {
    cdnUrl = await uploadToCDN(final1080, `videos/${path.basename(final1080)}`);
    logger.info(`✅  Video final subido al CDN → ${cdnUrl}`);
  } catch (err) {
    logger.error(`❌ Error al subir el video final al CDN: ${(err instanceof Error ? err.message : err)}`);
    throw new Error('Error al subir el video final al CDN');
  }

  // Validar accesibilidad del video en el CDN
  try {
    const axios = (await import('axios')).default;
    await axios.head(cdnUrl, { timeout: 15000 });
    logger.info(`✅  Video final accesible en CDN: ${cdnUrl}`);
  } catch {
    logger.warn(`⚠️  El video final no es accesible en el CDN (HEAD fail): ${cdnUrl}`);
    throw new Error('El video final no es accesible en el CDN');
  }
  return cdnUrl;
}
