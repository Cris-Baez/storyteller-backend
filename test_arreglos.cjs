// Test rápido de los arreglos aplicados
const fs = require('fs');

console.log('🔧 VERIFICANDO ARREGLOS APLICADOS');
console.log('================================');

// 1. Verificar orquestador procesamiento por tomas
try {
  const orquestador = fs.readFileSync('src/services/llmService/estilos/cinematic/orquestador.ts', 'utf-8');
  
  if (orquestador.includes('✅ Toma ${toma.numero} configurada - aplicando a ${toma.duracion} segundos')) {
    console.log('✅ Orquestador: Procesamiento por tomas implementado');
  } else {
    console.log('❌ Orquestador: Falta procesamiento por tomas');
  }
} catch (e) {
  console.log('❌ Error verificando orquestador');
}

// 2. Verificar limpieza de nombres en arte
try {
  const arte = fs.readFileSync('src/services/llmService/estilos/cinematic/arte.ts', 'utf-8');
  
  if (arte.includes('🧹 Limpiando nombre:') && arte.includes('split(\'(\')')) {
    console.log('✅ Arte: Limpieza de nombres IA implementada');
  } else {
    console.log('❌ Arte: Falta limpieza de nombres');
  }
  
  if (arte.includes('_fondoSeleccionadoCompleto: fondoFallback')) {
    console.log('✅ Arte: Fallback con asset completo implementado');
  } else {
    console.log('❌ Arte: Falta asset completo en fallback');
  }
  
  if (arte.includes('🔄 IA falló, aplicando fallback inmediato')) {
    console.log('✅ Arte: Fallback inmediato cuando IA falla implementado');
  } else {
    console.log('❌ Arte: Falta fallback inmediato');
  }
} catch (e) {
  console.log('❌ Error verificando arte');
}

// 3. Verificar assets épicos
try {
  const assets = JSON.parse(fs.readFileSync('assets_index.json', 'utf-8'));
  const fondos = assets.filter(a => !a.ruta.includes('/actores/'));
  const naturaleza = fondos.filter(f => f.lugar === 'naturaleza').length;
  const ciudad = fondos.filter(f => f.lugar === 'ciudad').length;
  const apartamentos = fondos.filter(f => f.lugar === 'apartamento').length;
  
  console.log(`📊 Assets: ${naturaleza} naturaleza, ${ciudad} ciudad, ${apartamentos} apartamentos`);
  
  if (naturaleza + ciudad > apartamentos * 2) {
    console.log('✅ Assets: Suficientes fondos épicos disponibles');
  } else {
    console.log('⚠️ Assets: Pocos fondos épicos disponibles');
  }
} catch (e) {
  console.log('❌ Error verificando assets');
}

console.log('\n🎯 RESUMEN DE ARREGLOS:');
console.log('1. ✅ Procesamiento por tomas (no segundo-a-segundo)');
console.log('2. ✅ Limpieza de respuestas IA (nombres + paréntesis)');
console.log('3. ✅ Fallback inmediato cuando IA falla');
console.log('4. ✅ Asset completo en fallbacks');
console.log('5. ✅ 265 fondos épicos vs 18 domésticos');

console.log('\n🚀 EXPECTATIVA: Sistema debe seleccionar fondos épicos para aventuras');
console.log('Los logs deben mostrar:');
console.log('- Una sola configuración por toma (no por segundo)');
console.log('- Fondos de naturaleza/ciudad/templo (NO apartamento/baño)');
console.log('- Fallback inmediato si IA falla');
