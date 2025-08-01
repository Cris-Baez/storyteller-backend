#!/usr/bin/env node

// src/scripts/generateMVPVideos.ts - Generador de Videos MVP para CinemaAI

import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { VideoValidator } from '../utils/videoValidator.js';

interface MVPVideo {
  estilo: string;
  url: string;
  duración: number;
  tieneAudio: boolean;
  status: 'exitoso' | 'falló';
  error?: string;
}

const MVP_STYLES = [
  {
    style: 'cinematic',
    prompt: 'Un dramático enfrentamiento entre un samurái y un ninja en un templo japonés bajo la tormenta, con cámaras cinematográficas épicas'
  },
  {
    style: 'anime', 
    prompt: 'Una estudiante anime descubre poderes mágicos en un jardín de flores de cerezo, con efectos visuales brillantes y emotivos'
  },
  {
    style: 'cartoon',
    prompt: 'Un chef divertido y colorido cocina una receta mágica en una cocina fantástica llena de ingredientes que cobran vida'
  },
  {
    style: 'commercial',
    prompt: 'Un profesional confiado presenta las características de un innovador producto tecnológico en una oficina moderna'
  }
];

async function generateMVPVideo(style: string, prompt: string): Promise<MVPVideo> {
  console.log(`\n🎬 Generando video MVP para estilo: ${style.toUpperCase()}`);
  console.log(`Prompt: "${prompt}"`);
  
  try {
    const result = await renderCinemaAI({
      prompt,
      duration: 60,
      visualStyle: style as any
    });
    
    if (!result || !result.url) {
      throw new Error('No se generó URL de video válida');
    }
    
    console.log(`✅ Video generado: ${result.url}`);
    console.log(`🔍 Validando video...`);
    
    const validation = await VideoValidator.validateVideo(result.url, 60);
    
    if (validation.valid) {
      console.log(`✅ ${style} - Video MVP EXITOSO`);
      console.log(`   Duración: ${validation.duration}s`);
      console.log(`   Audio: ${validation.hasAudio ? 'Sí' : 'No'}`);
      
      return {
        estilo: style,
        url: result.url,
        duración: validation.duration,
        tieneAudio: validation.hasAudio,
        status: 'exitoso'
      };
    } else {
      console.log(`❌ ${style} - Video generado pero validación falló`);
      console.log(`   Errores: ${validation.errors.join(', ')}`);
      
      return {
        estilo: style,
        url: result.url,
        duración: validation.duration,
        tieneAudio: validation.hasAudio,
        status: 'falló',
        error: `Validación falló: ${validation.errors.join(', ')}`
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${style} - Error en generación: ${errorMessage}`);
    
    return {
      estilo: style,
      url: '',
      duración: 0,
      tieneAudio: false,
      status: 'falló',
      error: errorMessage
    };
  }
}

async function generateAllMVPVideos(): Promise<void> {
  console.log('🚀 INICIANDO GENERACIÓN DE VIDEOS MVP PARA TODOS LOS ESTILOS');
  console.log('===========================================================');
  
  const mvpVideos: MVPVideo[] = [];
  
  for (const styleConfig of MVP_STYLES) {
    const video = await generateMVPVideo(styleConfig.style, styleConfig.prompt);
    mvpVideos.push(video);
    
    // Pausa entre estilos para evitar rate limiting
    if (MVP_STYLES.indexOf(styleConfig) < MVP_STYLES.length - 1) {
      console.log('⏳ Esperando 15s antes del siguiente estilo...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  // Mostrar resumen final
  console.log('\n🎯 RESUMEN DE VIDEOS MVP GENERADOS:');
  console.log('=====================================');
  
  mvpVideos.forEach(video => {
    const status = video.status === 'exitoso' ? '✅' : '❌';
    console.log(`${status} ${video.estilo.toUpperCase()}`);
    
    if (video.status === 'exitoso') {
      console.log(`   URL: ${video.url}`);
      console.log(`   Duración: ${video.duración}s`);
      console.log(`   Audio: ${video.tieneAudio ? 'Sí' : 'No'}`);
    } else {
      console.log(`   Error: ${video.error}`);
    }
    console.log('');
  });
  
  const exitosos = mvpVideos.filter(v => v.status === 'exitoso').length;
  const total = mvpVideos.length;
  const porcentaje = Math.round((exitosos / total) * 100);
  
  console.log(`📊 RESULTADO FINAL: ${exitosos}/${total} estilos exitosos (${porcentaje}%)`);
  
  if (exitosos === total) {
    console.log('\n🎉 ¡TODOS LOS VIDEOS DEL MVP FUERON GENERADOS CON ÉXITO!');
    console.log('🎬 Estilos: Cinematic, Anime, Cartoon, Commercial');
    console.log('🎧 Todos tienen audio, duración mínima cumplida y están listos para revisión visual final');
  } else {
    console.log('\n⚠️  Algunos videos MVP fallaron. Revisar errores arriba.');
  }
  
  // Guardar resultados en JSON para referencia
  const fs = require('fs');
  const path = require('path');
  const resultsPath = path.join(process.cwd(), 'mvp_videos_results.json');
  
  fs.writeFileSync(resultsPath, JSON.stringify(mvpVideos, null, 2), 'utf8');
  console.log(`\n💾 Resultados guardados en: ${resultsPath}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateAllMVPVideos().catch(console.error);
}

export { generateAllMVPVideos, generateMVPVideo };
