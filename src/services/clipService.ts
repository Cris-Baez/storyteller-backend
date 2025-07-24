import { logFeedback } from './feedbackService.js';
import { fal } from '@fal-ai/client';
import axios from 'axios';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { uploadToCDN } from './cdnService.js';

// Funciones para generar imágenes por estilo
export async function generateImageRealista(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageRealista',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen realista');
    }
    // ... Fal.ai modelo realista ...
    return '';
}
export async function generateImageAnime(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageAnime',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen anime');
    }
    // ... Fal.ai modelo anime ...
    return '';
}
export async function generateImageCartoon(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageCartoon',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen cartoon');
    }
    // ... Fal.ai modelo cartoon ...
    return '';
}
export async function generateImageGaming(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageGaming',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen gaming');
    }
    // ... Fal.ai modelo gaming ...
    return '';
}
export async function generateImageComercial(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageComercial',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen comercial');
    }
    // ... Fal.ai modelo comercial ...
    return '';
}
export async function generateImageNarrativa(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageNarrativa',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen narrativa');
    }
    // ... Fal.ai modelo narrativa ...
    return '';
}

// Genera ángulos/contexto extra con Kontext
export async function generateKontextAngleOrCrowd(imageUrl: string, kontextPrompt: string): Promise<string> {
    if (typeof imageUrl !== 'string' || !imageUrl.trim() || typeof kontextPrompt !== 'string' || !kontextPrompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateKontextAngleOrCrowd',
            success: false,
            error: 'Parámetros inválidos',
            params: { imageUrl, kontextPrompt }
        });
        throw new Error('Parámetros inválidos para Kontext');
    }
    // ... Fal.ai Kontext ...
    return '';
}

// Servicio principal: genera los clips y prepara para FFmpeg
export async function generateClipsKling(
    scenes: any[],
    opts?: { plan?: any; music?: Buffer; voiceOver?: Buffer; sfx?: Buffer; previewMode?: boolean }
): Promise<{ finalUrl: string, clips: string[] }> {
    if (!Array.isArray(scenes) || scenes.length === 0) {
        logFeedback({
            service: 'Clip',
            action: 'generateClipsKling',
            success: false,
            error: 'Escenas inválidas',
            params: { scenes, opts }
        });
        throw new Error('Escenas inválidas para generación de clips');
    }
    const clips: string[] = [];
    let lastBackground = '';
    let lastActor = '';
    let lastBackgroundUrl = '';
    let lastActorUrl = '';
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const preview = opts?.previewMode;
        // Carryover visual avanzado: mantener fondo/actor/pose/luz si carryover=true
        let backgroundImageUrl = '';
        // Carryover sutil: si carryover=true pero el prompt cambia poco, generar variante coherente
        if (scene.carryover && scene.backgroundPrompt && lastBackground && scene.backgroundPrompt !== lastBackground) {
            // Cambios sutiles detectados (ropa, luz, clima, etc.)
            const diff = scene.backgroundPrompt.replace(lastBackground, '').trim();
            if (diff.length < 40) { // Si la diferencia es pequeña, generar variante coherente
                backgroundImageUrl = await generateImageRealista(scene.backgroundPrompt);
                console.log(`[Carryover] SUTIL: Generando fondo variante para escena ${i} (cambio menor: ${diff})`);
                lastBackground = scene.backgroundPrompt;
                lastBackgroundUrl = backgroundImageUrl;
            } else {
                // Cambio mayor, generar fondo nuevo
                backgroundImageUrl = await generateImageRealista(scene.backgroundPrompt);
                lastBackground = scene.backgroundPrompt;
                lastBackgroundUrl = backgroundImageUrl;
            }
        } else if (scene.carryover && scene.backgroundPrompt === lastBackground) {
            backgroundImageUrl = lastBackgroundUrl;
            console.log(`[Carryover] (avanzado) Reutilizando fondo EXACTO para escena ${i}: ${backgroundImageUrl}`);
        } else if (scene.backgroundPrompt) {
            if (preview) {
                backgroundImageUrl = 'https://placehold.co/640x360/EEE/333?text=PREVIEW';
            } else {
                backgroundImageUrl = await generateImageRealista(scene.backgroundPrompt);
                const bgName = `bg_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`;
                const tempDir = os.tmpdir();
                const tempBgFile = path.join(tempDir, bgName);
                const bgResp = await axios.get(backgroundImageUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(tempBgFile, bgResp.data);
                await uploadToCDN(tempBgFile, `assets/escenas/${bgName}`);
                try {
                    await fs.unlink(tempBgFile);
                } catch (e) {
                    console.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tempBgFile}`);
                }
                backgroundImageUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${bgName}`;
                lastBackground = scene.backgroundPrompt;
                lastBackgroundUrl = backgroundImageUrl;
            }
        }
        // Validación y logging estructurado del fondo generado
        if (!backgroundImageUrl || typeof backgroundImageUrl !== 'string' || !backgroundImageUrl.startsWith('http')) {
            logFeedback({
                service: 'Clip',
                action: 'validateBackground',
                success: false,
                error: 'No se pudo generar imagen de fondo válida',
                params: { sceneIndex: i, prompt: scene.backgroundPrompt, url: backgroundImageUrl }
            });
            throw new Error(`No se pudo generar imagen de fondo válida para la escena ${i}`);
        }
        let actorImageUrl = '';
        if (scene.carryover && scene.actorPrompt && lastActor && scene.actorPrompt !== lastActor) {
            const diff = scene.actorPrompt.replace(lastActor, '').trim();
            if (diff.length < 40) {
                actorImageUrl = await generateImageRealista(scene.actorPrompt);
                console.log(`[Carryover] SUTIL: Generando actor variante para escena ${i} (cambio menor: ${diff})`);
                lastActor = scene.actorPrompt;
                lastActorUrl = actorImageUrl;
            } else {
                actorImageUrl = await generateImageRealista(scene.actorPrompt);
                lastActor = scene.actorPrompt;
                lastActorUrl = actorImageUrl;
            }
        } else if (scene.carryover && scene.actorPrompt === lastActor) {
            actorImageUrl = lastActorUrl;
            console.log(`[Carryover] (avanzado) Reutilizando actor EXACTO para escena ${i}: ${actorImageUrl}`);
        } else if (scene.actorPrompt) {
            actorImageUrl = await generateImageRealista(scene.actorPrompt);
            const actorName = `actor_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`;
            const tempDir = os.tmpdir();
            const tempActorFile = path.join(tempDir, actorName);
            const actorResp = await axios.get(actorImageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempActorFile, actorResp.data);
            await uploadToCDN(tempActorFile, `assets/escenas/${actorName}`);
            try {
                await fs.unlink(tempActorFile);
            } catch (e) {
                console.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tempActorFile}`);
            }
            actorImageUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${actorName}`;
            lastActor = scene.actorPrompt;
            lastActorUrl = actorImageUrl;
        }
        // Validación y logging estructurado del actor generado
        if (!actorImageUrl || typeof actorImageUrl !== 'string' || !actorImageUrl.startsWith('http')) {
            logFeedback({
                service: 'Clip',
                action: 'validateActor',
                success: false,
                error: 'No se pudo generar imagen de actor válida',
                params: { sceneIndex: i, prompt: scene.actorPrompt, url: actorImageUrl }
            });
            throw new Error(`No se pudo generar imagen de actor válida para la escena ${i}`);
        }
        // Interpolación de frames para transiciones suaves
        if (i > 0 && scenes[i-1].transition && ['fade','crossfade','morph'].includes(scenes[i-1].transition)) {
            // TODO: Integrar modelo de interpolación (RIFE, FILM, etc.) para generar frames intermedios
            // Ejemplo: interpolarFrame(lastBackgroundUrl, backgroundImageUrl)
            console.log(`[Interpolación] Generar frames intermedios entre escenas ${i-1} y ${i} para transición ${scenes[i-1].transition}`);
        }
        // Kontext solo si el plan lo indica (nuevo ángulo, continuidad)
        let input_image_urls: string[] = [];
        for (const imgUrl of [backgroundImageUrl, actorImageUrl]) {
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                input_image_urls.push(`data:image/png;base64,${base64Image}`);
            }
        }
        if (scene.kontextPrompt && backgroundImageUrl) {
            const kontextImageUrl = await generateKontextAngleOrCrowd(backgroundImageUrl, scene.kontextPrompt);
            if (kontextImageUrl) {
                input_image_urls.push(kontextImageUrl);
                console.log(`[Kontext] Escena ${i}: se generó ángulo alternativo para continuidad visual.`);
            }
        }
        // Log detallado de escena
        console.log(`[Scene ${i}] Fondo: ${backgroundImageUrl}, Actor: ${actorImageUrl}, Kontext: ${scene.kontextPrompt ? 'Sí' : 'No'}`);
        // Aquí iría la llamada a Kling y la preparación para FFmpeg, alineación de audio/voz/efectos
        // TODO: Selección automática de motor de voz/labial según tipo de plano y diálogo
        // TODO: Alinear música, efectos y voz según timeline y transición
        // clips.push(urlDelClipGenerado);
    }
    // Retornar resultado simulado
    return { finalUrl: '', clips };
}
