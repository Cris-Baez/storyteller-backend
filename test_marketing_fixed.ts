// test_marketing_fixed.ts - Prueba rápida del Marketing AI corregido

import { generateMarketingClip } from './src/services/marketingService.js';
import { logger } from './src/utils/logger.js';

async function testMarketingAI() {
  try {
    logger.info('🧪 [TEST] Iniciando prueba de Marketing AI...');
    
    const requestPrueba = {
      descripcion: 'Promociona nuestro nuevo servicio de tecnología empresarial',
      imagenes: [
        'https://picsum.photos/1920/1080',
        'https://picsum.photos/1920/1080'
      ],
      textoVoz: 'Descubre la nueva generación de soluciones empresariales que transformarán tu negocio.',
      estilo: 'Tecnología' as any,
      duracion: 15
    };
    
    const resultado = await generateMarketingClip(requestPrueba);
    
    if (resultado.videoUrl) {
      console.log('✅ [TEST] Marketing AI funciona correctamente!');
      console.log('🎬 Video generado:', resultado.videoUrl);
      console.log('📊 Metadata:', resultado.metadata);
    } else {
      console.log('❌ [TEST] No se generó video');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error en Marketing AI:', error);
  }
}

// Ejecutar prueba si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testMarketingAI();
}
