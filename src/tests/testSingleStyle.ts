// src/tests/testSingleStyle.ts
// Script simple para probar un estilo específico rápidamente

import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { logger } from '../utils/logger.js';

const ESTILO_TEST = 'cinematic'; // Cambiar aquí para probar otros estilos
const PROMPT_TEST = "Un joven samurái camina al atardecer por un templo japonés";
const DURACION_TEST = 10; // Solo 10 segundos para prueba rápida

async function testearEstiloSimple() {
  console.log('🎬 PRUEBA RÁPIDA - UN SOLO ESTILO');
  console.log('=================================');
  console.log(`Estilo: ${ESTILO_TEST}`);
  console.log(`Prompt: ${PROMPT_TEST}`);
  console.log(`Duración: ${DURACION_TEST}s`);
  console.log('');

  try {
    const startTime = Date.now();
    
    const resultado = await renderCinemaAI({
      prompt: PROMPT_TEST,
      duration: DURACION_TEST,
      visualStyle: ESTILO_TEST,
      metadata: {}
    }, (step: string, progress: number) => {
      console.log(`[${step}] ${progress}%`);
    });
    
    const tiempoTotal = Date.now() - startTime;
    
    console.log('\n✅ RESULTADO EXITOSO');
    console.log('===================');
    console.log(`⏱️ Tiempo total: ${Math.round(tiempoTotal/1000)}s`);
    console.log(`📹 Video URL: ${resultado.url}`);
    console.log(`🎬 Scenes generadas: ${resultado.scenes?.length || 0}`);
    console.log(`🎵 Audio incluido: ${resultado.music ? 'Sí' : 'No'}`);
    console.log(`📊 Plan completado: ${resultado.plan ? 'Sí' : 'No'}`);
    
    // Verificar que el video es accesible
    if (resultado.url) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(resultado.url, { method: 'HEAD' });
        console.log(`🌐 CDN accesible: ${response.ok ? 'Sí' : 'No'} (${response.status})`);
      } catch (error) {
        console.log(`🌐 CDN accesible: Error - ${error}`);
      }
    }
    
    console.log('\n🎉 PRUEBA EXITOSA - EL SISTEMA FUNCIONA');
    return true;
    
  } catch (error: any) {
    console.error('\n❌ PRUEBA FALLIDA');
    console.error('==================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    
    console.log('\n🔧 POSIBLES CAUSAS:');
    console.log('- APIs no configuradas (revisar .env)');
    console.log('- Assets no encontrados (revisar assets_index.json)');
    console.log('- Error en cerebros (revisar dispatcher.ts)');
    console.log('- Error en servicios externos (Kling, Murf, etc)');
    
    return false;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testearEstiloSimple()
    .then((exitoso) => {
      process.exit(exitoso ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error crítico:', error);
      process.exit(1);
    });
}

export { testearEstiloSimple };
