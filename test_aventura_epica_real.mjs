// Test específico para verificar que "aventura épica" funciona correctamente
// Ejecuta el flujo completo sin dependencias externas

import { orquestarEquipoCinematico } from './src/services/llmService/estilos/cinematic/orquestador.js';
import { AssetManager } from './src/services/assetManager.js';

async function testAventuraEpicaReal() {
  console.log('🎬 TESTING REAL: AVENTURA ÉPICA');
  console.log('==============================');
  
  try {
    console.log('📝 Prompt: "aventura épica"');
    console.log('⏱️ Duración: 30 segundos');
    console.log('🎥 Procesando...\n');
    
    // Test directo del orquestador
    const videoPlan = await orquestarEquipoCinematico("aventura épica", 30);
    
    console.log('✅ Orquestación completada');
    console.log(`📊 Timeline generado: ${videoPlan.timeline.length} segundos`);
    
    // Analizar fondos seleccionados
    const fondosUsados = new Set();
    const lugaresUsados = new Set();
    
    videoPlan.timeline.forEach((segundo, idx) => {
      if (segundo.fondo) {
        fondosUsados.add(segundo.fondo.nombre || segundo.fondo);
        if (segundo.fondo._fondoSeleccionadoCompleto) {
          lugaresUsados.add(segundo.fondo._fondoSeleccionadoCompleto.lugar);
        }
      }
    });
    
    console.log('\n🎨 FONDOS SELECCIONADOS:');
    console.log(`Total únicos: ${fondosUsados.size}`);
    [...fondosUsados].forEach(fondo => {
      console.log(`  - ${fondo}`);
    });
    
    console.log('\n📍 LUGARES UTILIZADOS:');
    [...lugaresUsados].forEach(lugar => {
      console.log(`  - ${lugar}`);
    });
    
    // VERIFICACIÓN CRÍTICA
    const fondosProblematicos = [...fondosUsados].filter(fondo => 
      typeof fondo === 'string' && (
        fondo.toLowerCase().includes('apartamento') ||
        fondo.toLowerCase().includes('baño') ||
        fondo.toLowerCase().includes('bathroom')
      )
    );
    
    const lugaresProblematicos = [...lugaresUsados].filter(lugar =>
      lugar === 'apartamento' || lugar === 'departamento'
    );
    
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    
    if (fondosProblematicos.length > 0 || lugaresProblematicos.length > 0) {
      console.log('❌ FALLO: Se detectaron fondos domésticos para aventura épica');
      console.log('Fondos problemáticos:', fondosProblematicos);
      console.log('Lugares problemáticos:', lugaresProblematicos);
      return false;
    } else {
      console.log('✅ ÉXITO: No se detectaron fondos domésticos');
      console.log('✅ Sistema selecciona fondos apropiados para aventuras épicas');
      return true;
    }
    
  } catch (error) {
    console.log('💥 ERROR en test:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

// Test independiente de AssetManager
async function testAssetManager() {
  console.log('\n🔧 TESTING ASSETMANAGER INDEPENDIENTE');
  console.log('====================================');
  
  try {
    const fondos = await AssetManager.obtenerFondosPorEstilo('cinematic');
    console.log(`📊 AssetManager cargó: ${fondos.length} fondos`);
    
    const lugares = [...new Set(fondos.map(f => f.lugar).filter(Boolean))];
    console.log(`📍 Lugares disponibles: ${lugares.join(', ')}`);
    
    const apartamentos = fondos.filter(f => f.lugar === 'apartamento').length;
    const naturaleza = fondos.filter(f => f.lugar === 'naturaleza').length;
    const ciudad = fondos.filter(f => f.lugar === 'ciudad').length;
    
    console.log(`🏠 Apartamentos: ${apartamentos}`);
    console.log(`🌲 Naturaleza: ${naturaleza}`);
    console.log(`🏙️ Ciudad: ${ciudad}`);
    
    if (naturaleza + ciudad > apartamentos) {
      console.log('✅ AssetManager: Proporción correcta de fondos épicos');
      return true;
    } else {
      console.log('❌ AssetManager: Pocos fondos épicos');
      return false;
    }
    
  } catch (error) {
    console.log('💥 ERROR en AssetManager:', error.message);
    return false;
  }
}

// Ejecutar tests
async function runAllTests() {
  console.log('🚀 INICIANDO TESTS DE AVENTURA ÉPICA');
  console.log('====================================\n');
  
  const assetTest = await testAssetManager();
  const flowTest = await testAventuraEpicaReal();
  
  console.log('\n🏁 RESULTADOS FINALES:');
  console.log('=====================');
  console.log(`AssetManager: ${assetTest ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Flujo completo: ${flowTest ? '✅ OK' : '❌ FALLO'}`);
  
  if (assetTest && flowTest) {
    console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL');
    console.log('✅ CinemaAI puede generar aventuras épicas correctamente');
  } else {
    console.log('\n🔧 SISTEMA NECESITA CORRECCIONES');
  }
  
  return assetTest && flowTest;
}

runAllTests().catch(console.error);
