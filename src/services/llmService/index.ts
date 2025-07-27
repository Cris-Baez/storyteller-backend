// Router maestro para LLMService por estilo
import { RenderRequest, VideoPlan } from '../../utils/types.js';
import { generateAnimeVideoPlan } from './anime.js';
import { generateRealisticVideoPlan } from './realistic.js';
import { generateCinematicVideoPlan } from './cinematic.js';
import { generateNarrativeVideoPlan } from './narrative.js';
import { generateCommercialVideoPlan } from './commercial.js';
import { generateGameVideoPlan } from './game.js';


// Feedback loop y soporte de hints
export async function createVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  // Validar visualStyle y delegar robustamente
  const style = req.visualStyle?.toLowerCase();
  const validStyles = ['anime', 'realistic', 'cinematic', 'narrative', 'commercial', 'game'];
  if (!style || !validStyles.includes(style)) {
    throw new Error('Estilo no soportado o indefinido: ' + req.visualStyle);
  }
  switch (style) {
    case 'anime':
      return await generateAnimeVideoPlan(req);
    case 'realistic':
      return await generateRealisticVideoPlan(req);
    case 'cinematic':
      return await generateCinematicVideoPlan(req);
    case 'narrative':
      return await generateNarrativeVideoPlan(req);
    case 'commercial':
      return await generateCommercialVideoPlan(req);
    case 'game':
      return await generateGameVideoPlan(req);
    default:
      throw new Error('Estilo no soportado: ' + style);
  }
}
