
// Lógica de segmentación óptima para videos IA (Kling, etc.)
// Decide cómo dividir un video largo en clips de 5s o 10s según duración y estilo

export interface VideoSegment {
  start: number;
  duration: number;
  style: string;
}

/**
 * segmentVideoByStyle
 * Divide la duración total en segmentos óptimos de 5s o 10s según el estilo visual.
 * - Cinematic/realistic: prioriza 10s
 * - Anime/cartoon: prioriza 5s
 * - Si no es múltiplo exacto, usa la mayor cantidad de 10s y el resto en 5s
 */
export function segmentVideoByStyle(totalSeconds: number, style: string): VideoSegment[] {
  const segments: VideoSegment[] = [];
  let rem = totalSeconds;
  let start = 0;
  // Estilos que priorizan 5s
  const fiveSecStyles = ['anime', 'cartoon', 'experimental'];
  const preferFive = fiveSecStyles.includes(style?.toLowerCase());
  while (rem > 0) {
    let seg = 10;
    if (preferFive) {
      seg = 5;
    } else if (rem < 10) {
      seg = rem >= 5 ? 5 : rem;
    } else if (rem % 10 !== 0 && rem > 10) {
      // Si no cabe otro 10, mete un 5 si es posible
      seg = rem % 10 >= 5 ? 5 : 10;
      if (rem - seg < 5 && rem - seg > 0) seg = rem; // último segmento
    }
    if (seg > rem) seg = rem;
    segments.push({ start, duration: seg, style });
    start += seg;
    rem -= seg;
  }
  return segments;
}
