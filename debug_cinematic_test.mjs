// debug_cinematic_test.mjs - Probar módulo cinematic completo

import { dispatchCerebros } from './dist/services/llmService/dispatcher.js';

async function testCinematicModule() {
  console.log('🎬 TESTING CINEMATIC MODULE...\n');
  
  try {
    console.log('🔄 Importando dispatcher...');
    
    // Test 1: Request básico
    const request = {
      prompt: "Un aventurero explora una ciudad antigua llena de misterios",
      duracion: 30,
      estilo: 'cinematic',
      configuracion: {}
    };
    
    console.log('📋 Request de prueba:');
    console.log(JSON.stringify(request, null, 2));
    console.log('');
    
    console.log('🎯 Iniciando generación cinematográfica...');
    const resultado = await dispatchCerebros(request);
    
    console.log('📊 Resultado obtenido:');
    console.log('- Type:', typeof resultado);
    console.log('- Keys:', Object.keys(resultado || {}));
    
    if (!resultado) {
      console.error('❌ El resultado es null/undefined');
      return;
    }
    
    console.log('✅ Generación completada!');
    console.log(`⏱️ Tiempo: ${resultado.tiempoGeneracion}ms`);
    console.log(`📊 Success: ${resultado.success}`);
    
    if (resultado.error) {
      console.error('❌ Error:', resultado.error);
      return;
    }
    
    console.log('');
    console.log('📽️ ANÁLISIS DEL RESULTADO:');
    console.log(`- Timeline: ${resultado.videoPlan?.length || 0} segundos`);
    console.log(`- Tomas reales: ${resultado.tomasReales?.length || 0} tomas`);
    console.log(`- Metadata: ${resultado.metadata ? 'Presente' : 'Ausente'}`);
    console.log(`- Configuración: ${resultado.configuracion ? 'Presente' : 'Ausente'}`);
    
    // Análisis detallado del timeline
    if (resultado.videoPlan && resultado.videoPlan.length > 0) {
      console.log('');
      console.log('🎞️ TIMELINE DETALLADO:');
      resultado.videoPlan.slice(0, 5).forEach((segundo, idx) => {
        console.log(`  [${idx}] Segundo ${segundo.segundo || idx}:`);
        console.log(`      - Fondo: ${segundo.fondo?.nombre || 'NO_FONDO'} → ${segundo.fondo?.ruta || 'NO_RUTA'}`);
        console.log(`      - Actor: ${segundo.actor?.nombre || 'NO_ACTOR'} → ${segundo.actor?.ruta || 'NO_RUTA'}`);
        console.log(`      - Cámara: ${segundo.camara?.shot || 'NO_SHOT'} / ${segundo.camara?.movement || 'NO_MOVEMENT'}`);
        console.log(`      - Momento: ${segundo.momentoNarrativo || 'NO_MOMENTO'}`);
        console.log('');
      });
      if (resultado.videoPlan.length > 5) {
        console.log(`  ... y ${resultado.videoPlan.length - 5} segundos más`);
      }
    }
    
    // Análisis de tomas reales
    if (resultado.tomasReales && resultado.tomasReales.length > 0) {
      console.log('');
      console.log('🎬 TOMAS CINEMATOGRÁFICAS:');
      resultado.tomasReales.forEach((toma, idx) => {
        console.log(`  [${idx + 1}] Toma ${toma.tomaId}:`);
        console.log(`      - Descripción: ${toma.descripcionToma || 'NO_DESCRIPCION'}`);
        console.log(`      - Duración: ${toma.duracion || 0}s`);
        console.log(`      - Movimiento Kling: ${toma.movimientoKling || 'NO_MOVEMENT'}`);
        console.log(`      - Fondo: ${toma.fondo?.nombre || 'NO_FONDO'} → ${toma.fondo?.ruta || 'NO_RUTA'}`);
        console.log(`      - Actor: ${toma.actor?.nombre || 'NO_ACTOR'}`);
        console.log('');
      });
    }
    
    // Verificación de coherencia
    console.log('🔍 VERIFICACIÓN DE COHERENCIA:');
    
    // Check 1: Assets válidos
    const fondosVálidos = resultado.videoPlan?.filter(s => s.fondo?.ruta).length || 0;
    const actoresVálidos = resultado.videoPlan?.filter(s => s.actor?.ruta).length || 0;
    console.log(`- Fondos válidos: ${fondosVálidos}/${resultado.videoPlan?.length || 0}`);
    console.log(`- Actores válidos: ${actoresVálidos}/${resultado.videoPlan?.length || 0}`);
    
    // Check 2: No fondos privados
    const fondosPrivados = resultado.videoPlan?.filter(s => {
      const ruta = s.fondo?.ruta?.toLowerCase() || '';
      return ruta.includes('apartamento') || ruta.includes('casa') || ruta.includes('baño');
    }).length || 0;
    console.log(`- Fondos privados detectados: ${fondosPrivados} (debería ser 0)`);
    
    // Check 3: Momentos narrativos distribuidos
    const momentos = resultado.videoPlan?.reduce((acc, s) => {
      acc[s.momentoNarrativo] = (acc[s.momentoNarrativo] || 0) + 1;
      return acc;
    }, {}) || {};
    console.log(`- Distribución narrativa:`, momentos);
    
    console.log('');
    console.log('✅ TEST CINEMATIC COMPLETADO');
    
  } catch (error) {
    console.error('❌ ERROR EN TEST:', error);
    console.error('Stack:', error.stack);
  }
}

testCinematicModule();
