// Test rápido para verificar que los assets están cargándose correctamente

const fs = require('fs');
const path = require('path');

async function testAssets() {
  console.log('🧪 TESTING ASSETS PARA AVENTURA ÉPICA');
  console.log('====================================');
  
  try {
    // Verificar que assets_index.json existe
    const assetsPath = path.join(process.cwd(), 'assets_index.json');
    
    if (!fs.existsSync(assetsPath)) {
      console.log('❌ assets_index.json no encontrado');
      return;
    }
    
    const contenido = fs.readFileSync(assetsPath, 'utf-8');
    const assets = JSON.parse(contenido);
    
    console.log(`📊 Total de assets: ${assets.length}`);
    
    // Filtrar fondos
    const fondos = assets.filter(asset => !asset.ruta.includes('/actores/'));
    console.log(`🖼️ Total de fondos: ${fondos.length}`);
    
    // Verificar diversidad de lugares
    const lugares = [...new Set(fondos.map(f => f.lugar).filter(Boolean))];
    console.log(`📍 Lugares disponibles: ${lugares.join(', ')}`);
    
    // Verificar variantes
    const variantes = [...new Set(fondos.map(f => f.variante).filter(Boolean))];
    console.log(`🏗️ Variantes disponibles: ${variantes.slice(0, 10).join(', ')}${variantes.length > 10 ? '...' : ''}`);
    
    // Verificar fondos problemáticos (apartamentos/baños)
    const fondosProblematicos = fondos.filter(f => 
      f.lugar?.toLowerCase() === 'apartamento' ||
      f.variante?.toLowerCase() === 'baño' ||
      f.variante?.toLowerCase() === 'bathroom'
    );
    
    console.log('\n🔍 ANÁLISIS DE FONDOS PROBLEMÁTICOS:');
    console.log(`Apartamentos/baños encontrados: ${fondosProblematicos.length}`);
    
    if (fondosProblematicos.length > 0) {
      console.log('Lista de fondos problemáticos:');
      fondosProblematicos.forEach(f => {
        console.log(`  - ${f.nombre}: ${f.lugar}/${f.variante}`);
      });
    }
    
    // Verificar fondos épicos apropiados
    const fondosEpicos = fondos.filter(f => 
      f.lugar?.toLowerCase() === 'naturaleza' ||
      f.lugar?.toLowerCase() === 'ciudad' ||
      f.lugar?.toLowerCase() === 'templo' ||
      f.variante?.toLowerCase().includes('acantilado') ||
      f.variante?.toLowerCase().includes('montaña') ||
      f.variante?.toLowerCase().includes('campo') ||
      f.variante?.toLowerCase().includes('bosque')
    );
    
    console.log('\n🎯 ANÁLISIS DE FONDOS ÉPICOS:');
    console.log(`Fondos épicos apropiados: ${fondosEpicos.length}`);
    
    if (fondosEpicos.length > 0) {
      console.log('Muestra de fondos épicos:');
      fondosEpicos.slice(0, 10).forEach(f => {
        console.log(`  - ${f.nombre}: ${f.lugar}/${f.variante}`);
      });
    }
    
    // Proporción
    const proporcionEpicos = (fondosEpicos.length / fondos.length * 100).toFixed(1);
    const proporcionProblematicos = (fondosProblematicos.length / fondos.length * 100).toFixed(1);
    
    console.log('\n📈 PROPORCIÓN DE FONDOS:');
    console.log(`Épicos: ${proporcionEpicos}%`);
    console.log(`Problemáticos: ${proporcionProblematicos}%`);
    
    if (fondosEpicos.length > fondosProblematicos.length) {
      console.log('\n✅ BUENAS NOTICIAS: Hay más fondos épicos que problemáticos');
      console.log('El sistema debería poder seleccionar fondos apropiados para aventuras épicas');
    } else {
      console.log('\n⚠️ ADVERTENCIA: Proporción de fondos problemática');
      console.log('Se necesita mejorar la lógica de selección de fondos');
    }
    
  } catch (error) {
    console.log('💥 ERROR:', error.message);
  }
}

// Ejecutar test
testAssets().then(() => {
  console.log('\n🏁 Test de assets completado');
}).catch(err => {
  console.error('💥 Error fatal:', err);
});
