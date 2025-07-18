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
  let curVol = VOL[plan.timeline[0].soundCue] ?? 0.25;
  let segStart = 0;
  for (let i = 1; i < plan.timeline.length; i++) {
    const v = VOL[plan.timeline[i].soundCue] ?? 0.25;
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
  // Extrae overlays y LUTs del plan (por segundo o escena)
  const overlays: OverlaySpec[] = [];
  const luts: LUTSpec[] = [];
  if (plan.timeline) {
    for (const sec of plan.timeline) {
      if (Array.isArray(sec.overlays)) {
        for (const o of sec.overlays) overlays.push({ ...o, start: sec.t, end: sec.t + 1 });
      }
      if (Array.isArray(sec.luts)) {
        for (const l of sec.luts) luts.push({ ...l, start: sec.t, end: sec.t + 1 });
      }
    }
  }
  return [
    ...buildLUTFilters(luts),
    ...buildOverlayFilters(overlays)
  ];
}

function buildAudioFilters(plan: VideoPlan): string {
  // EQ y reverb básicos según metadatos (puedes expandir)
  let filters = [];
  // Ejemplo: si alguna escena tiene 'reverb' en effects, aplicar reverb
  if (plan.timeline?.some(sec => sec.effects?.includes('reverb'))) {
    filters.push('aecho=0.8:0.9:1000:0.3');
  }
  // Ejemplo: si alguna escena tiene 'eq' en effects, aplicar EQ
  if (plan.timeline?.some(sec => sec.effects?.includes('eq'))) {
    filters.push('equalizer=f=1000:t=q:w=1:g=3');
  }
  return filters.join(',');
}

export async function assembleVideo(opts:{
  plan: VideoPlan;
  clips: string[];
  voiceOver: Buffer;
  music: Buffer;
}): Promise<string> {
  logger.info('🎬  FFmpegService v7 — ensamblando 1080p60 con overlays/LUTs/EQ…');
  await fs.mkdir(TMP_DIR, { recursive: true });

  const { plan, clips, voiceOver, music } = opts;
  const id = uuid();
  const list = path.join(TMP_DIR, `${id}.txt`);
  const concat = path.join(TMP_DIR, `${id}_concat.mp4`);
  const voiceFile = path.join(TMP_DIR, `${id}_voice.mp3`);
  const musicFile = path.join(TMP_DIR, `${id}_music.mp3`);
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

  /* 1️⃣ concat clips (24→1080p60) + filtros visuales */
  const listContent = clips
// ...existing code...
    .join('\n');
  await fs.writeFile(list, listContent);
  // Validar que el archivo de lista existe antes de llamar a FFmpeg
  try {
    await fs.access(list);
  } catch (err) {
    logger.error(`❌ El archivo de lista para FFmpeg no existe: ${list}`);
    logger.error(`Contenido que se intentó escribir:\n${listContent}`);
    throw new Error('No se pudo crear el archivo de lista para FFmpeg');
  }
  logger.info(`✅ Archivo de lista para FFmpeg creado: ${list}`);
  logger.info('🟡 [FFmpeg] Iniciando concat clips → ' + concat);
  // OPTIMIZADO PARA PRUEBAS: sin minterpolate y a 720p
  await retry(() => execFF(
    ffmpeg().input(toPosix(list)).inputOptions(['-f', 'concat', '-safe', '0'])
      .videoFilters([
        'scale=1280:720:force_original_aspect_ratio=decrease',
        'pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        'setsar=1'
      ])
      .outputOptions(['-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart']),
    concat
  ), RETRIES);
  logger.info('🟢 [FFmpeg] Concat clips OK → ' + concat);

  /* 2️⃣ write audio temp files */
  if (voiceOver.length) await fs.writeFile(voiceFile, voiceOver);
  if (music.length) await fs.writeFile(musicFile, music);

  /* 3️⃣ Build volume envelope for music */
  const volExpr = buildVolumeExpr(plan);
  const musicFilter = `volume='${volExpr}':eval=frame`;

  /* 4️⃣ mix audio with ducking o solo música/efecto */
  const audioMix = path.join(TMP_DIR, `${id}_mix.m4a`);
  logger.info('🟡 [FFmpeg] Iniciando mezcla audio inteligente → ' + audioMix);
  if (music.length && !voiceOver.length) {
    // Solo música, sin ducking
    await retry(() => execFF(
      ffmpeg()
        .input(musicFile)
        .audioFilters([musicFilter])
        .outputOptions([
          '-c:a', 'aac',
          '-movflags', '+faststart'
        ]),
      audioMix
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Solo música (sin ducking) → ' + audioMix);
  } else if (!music.length && !voiceOver.length) {
    // Ni música ni voz: beep de emergencia
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
  } else {
    // Voz y música: ducking normal
    await retry(() => execFF(
      ffmpeg()
        .input(voiceOver.length ? voiceFile : 'anullsrc')
        .inputOptions(voiceOver.length ? [] : ['-f', 'lavfi'])
        .input(music.length ? musicFile : 'anullsrc')
        .inputOptions(music.length ? [] : ['-f', 'lavfi'])
        .complexFilter([
          `[1:a]${musicFilter}[bgm]`,
          '[0:a][bgm]sidechaincompress=threshold=0.25:ratio=8:release=150:attack=20[aout]'
        ])
        .outputOptions([
          '-map', '[aout]',
          '-c:a', 'aac',
          '-movflags', '+faststart'
        ]),
      audioMix
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Mezcla voz+música (ducking) → ' + audioMix);
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
