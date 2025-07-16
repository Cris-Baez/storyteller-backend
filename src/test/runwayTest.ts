// src/test/runwayTest.ts
import { generateRunwayVideo } from '../services/runwayService';

async function main() {
  try {
    // Ejemplo: usa una imagen pública y un prompt simple
    const url = await generateRunwayVideo({
      promptImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      promptText: 'A serene coastal sunrise, cinematic, ultra realistic',
      model: 'gen4_turbo',
      ratio: '1280:720',
      duration: 5
    });
    console.log('✅ Video generado en Runway:', url);
  } catch (err) {
    console.error('❌ Error al generar video con Runway:', err);
  }
}

main();
