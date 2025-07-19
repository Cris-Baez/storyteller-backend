
// Servicio para generar clips usando Kling
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


export async function generateClipsKling(scenes: any[]): Promise<{ finalUrl: string, clips: string[] }> {
  const klingService = await import('./klingService.js');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fondoPath = path.join(__dirname, '../config/fondoDescs.json');
  const actorPath = path.join(__dirname, '../config/actorDescs.json');
  const fondoDescsRaw = await readFile(fondoPath, 'utf-8');
  const FONDO_DESCS: Record<string, string> = JSON.parse(fondoDescsRaw);
  const actorDescsRaw = await readFile(actorPath, 'utf-8');
  const ACTOR_DESCS: Record<string, string> = JSON.parse(actorDescsRaw);
  const clips: string[] = [];

  for (const scene of scenes) {
    // Estructura avanzada de prompt para Kling
    const firstSec = scene.timeline[0] || {};
    const backgroundUrl = firstSec.background ? `http://localhost:8080/assets/escenas/${firstSec.background}` : undefined;
    const characterUrl = firstSec.character ? `http://localhost:8080/assets/actores/${firstSec.character}` : undefined;

    // Leer descripción del fondo y actor si existen
    const fondoDesc = firstSec.background && FONDO_DESCS[firstSec.background] ? FONDO_DESCS[firstSec.background] : '';
    const actorDesc = firstSec.character && ACTOR_DESCS[firstSec.character] ? ACTOR_DESCS[firstSec.character] : '';

    // Prompt 100% dinámico: descripción del fondo + actor + visual del LLM + detalles técnicos
    const subject = firstSec.character ? 'A young actor' : 'A character';
    const subjectDesc = firstSec.visual || '';
    const subjectMovement = scene.timeline.map((sec: any) => sec.camera?.movement || '').filter(Boolean).join(', ');
    const cameraLang = firstSec.camera ? `Camera: ${firstSec.camera.shot || ''}, ${firstSec.camera.movement || ''}` : '';
    const lighting = firstSec.lighting ? `Lighting: ${firstSec.lighting}` : '';
    const atmosphere = 'Atmosphere: cinematic, realistic, emotional.';
    const quality = 'Render in photorealistic 1080p, sharp focus, no watermark.';

    const promptEscena = [
      fondoDesc,
      actorDesc,
      subject,
      subjectDesc,
      subjectMovement ? `Movement: ${subjectMovement}` : '',
      cameraLang,
      lighting,
      atmosphere,
      quality
    ].filter(Boolean).join(', ');

    // input_image_urls: fondo + actor
    const input_image_urls = [];
    if (backgroundUrl) input_image_urls.push(backgroundUrl);
    if (characterUrl) input_image_urls.push(characterUrl);

    const klingParams = {
      prompt: promptEscena,
      input_image_urls,
      duration: scene.duration,
      style: scene.style,
      ...scene
    };
    const url = await klingService.generateKlingClip(klingParams);
    clips.push(url);
  }
  const { assembleVideo } = await import('./ffmpegService.js');
  // Si no tienes plan, voiceOver o music en este contexto, pásalos como null o vacíos
  // Crear mocks mínimos para cumplir con los tipos requeridos
  const emptyPlan = {} as any; // Reemplaza por un objeto válido si tienes el tipo VideoPlan
  const emptyBuffer = Buffer.from([]) as Buffer;
  const finalUrl = await assembleVideo({ plan: emptyPlan, clips, voiceOver: emptyBuffer, music: emptyBuffer });
  return { finalUrl, clips };
}
