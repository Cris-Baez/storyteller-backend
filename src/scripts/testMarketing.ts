// src/scripts/testMarketing.ts - Script para testear Marketing AI

import { generateMarketingClip } from '../services/marketingService.js';
import { renderMarketingAI } from '../pipelines/renderPipeline.js';
import { logger } from '../utils/logger.js';

/**
 * Script de prueba para Marketing AI
 */
async function testMarketingAI() {
  console.log('🎯 Iniciando test de Marketing AI...\n');

  try {
    // Test 1: Producto - Clases de yoga
    console.log('📋 Test 1: Clases de Yoga');
    await testProducto({
      imagenes: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800'
      ],
      descripcion: 'Clases de yoga en la playa con vistas al atardecer. Relájate y encuentra tu paz interior.',
      estilo: 'commercial',
      duracion: 15
    });

    // Test 2: Restaurante
    console.log('\n📋 Test 2: Restaurante');
    await testProducto({
      imagenes: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
      ],
      descripcion: 'Auténtica cocina italiana con ingredientes frescos y ambiente acogedor.',
      estilo: 'cinematic',
      duracion: 20,
      textoVoz: 'Descubre sabores únicos en nuestro restaurante. Cada plato es una experiencia inolvidable.'
    });

    // Test 3: Producto tecnológico
    console.log('\n📋 Test 3: Producto Tecnológico');
    await testProducto({
      imagenes: [
        'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800'
      ],
      descripcion: 'Auriculares inalámbricos con cancelación de ruido y sonido premium.',
      estilo: 'anime',
      duracion: 12
    });

    // Test 4: Servicio profesional
    console.log('\n📋 Test 4: Servicio Profesional');
    await testProducto({
      imagenes: [
        'https://images.unsplash.com/photo-1560472355-536de3962603?w=800'
      ],
      descripcion: 'Consultoría empresarial para hacer crecer tu negocio al siguiente nivel.',
      estilo: 'commercial',
      duracion: 25
    });

    console.log('\n✅ Todos los tests de Marketing AI completados exitosamente!');

  } catch (error) {
    console.error('\n❌ Error en tests de Marketing AI:', error);
    process.exit(1);
  }
}

/**
 * Testa un producto específico
 */
async function testProducto(request: any) {
  const inicio = Date.now();
  
  try {
    console.log(`  📝 Descripción: ${request.descripcion}`);
    console.log(`  🎨 Estilo: ${request.estilo}`);
    console.log(`  ⏱️ Duración: ${request.duracion}s`);
    console.log(`  🖼️ Imágenes: ${request.imagenes.length}`);
    console.log('  🔄 Generando...');

    let progresoActual = 0;
    const progressCallback = (step: string, progress: number) => {
      if (progress > progresoActual + 10) { // Solo mostrar cada 10%
        console.log(`  📊 ${step} (${progress}%)`);
        progresoActual = progress;
      }
    };

    // Opción 1: Usar directamente el servicio
    if (Math.random() > 0.5) {
      console.log('  🔧 Usando servicio directo...');
      const resultado = await generateMarketingClip(request);
      
      const tiempoTotal = Date.now() - inicio;
      console.log(`  ✅ Video generado exitosamente:`);
      console.log(`    📺 URL: ${resultado.videoUrl}`);
      console.log(`    ⏱️ Duración real: ${resultado.metadata.duracion}s`);
      console.log(`    🎵 Audio: ${resultado.metadata.hasVoz ? '✓' : '✗'} Voz, ${resultado.metadata.hasMusica ? '✓' : '✗'} Música`);
      console.log(`    ⚡ Tiempo generación: ${Math.round(tiempoTotal / 1000)}s`);
    } else {
      // Opción 2: Usar pipeline completo
      console.log('  🔧 Usando pipeline completo...');
      const resultado = await renderMarketingAI(request, progressCallback);
      
      const tiempoTotal = Date.now() - inicio;
      console.log(`  ✅ Video generado exitosamente:`);
      console.log(`    📺 URL: ${resultado.url}`);
      console.log(`    🎬 Clips: ${resultado.clips?.length || 0}`);
      console.log(`    🎵 Audio: ${resultado.voice ? '✓' : '✗'} Voz, ${resultado.music ? '✓' : '✗'} Música`);
      console.log(`    📊 Tipo: ${resultado.tipo} | Estilo: ${resultado.estilo}`);
      console.log(`    ⚡ Tiempo generación: ${Math.round(tiempoTotal / 1000)}s`);
    }

  } catch (error) {
    const tiempoError = Date.now() - inicio;
    console.log(`  ❌ Error después de ${Math.round(tiempoError / 1000)}s:`);
    console.log(`    ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Test de validación de parámetros
 */
async function testValidacion() {
  console.log('\n🔍 Test de validación de parámetros...');

  // Test con parámetros inválidos
  const testsCasos = [
    {
      nombre: 'Sin imágenes',
      request: { descripcion: 'Test sin imágenes', imagenes: [] },
      deberiaFallar: true
    },
    {
      nombre: 'Descripción muy corta',
      request: { descripcion: 'Test', imagenes: ['https://example.com/img.jpg'] },
      deberiaFallar: true
    },
    {
      nombre: 'URL inválida',
      request: { descripcion: 'Test con URL inválida', imagenes: ['no-es-url'] },
      deberiaFallar: true
    },
    {
      nombre: 'Duración inválida',
      request: { 
        descripcion: 'Test con duración inválida', 
        imagenes: ['https://example.com/img.jpg'],
        duracion: 100 
      },
      deberiaFallar: true
    }
  ];

  for (const testCase of testsCasos) {
    try {
      console.log(`  📋 ${testCase.nombre}...`);
      
      if (testCase.deberiaFallar) {
        try {
          await generateMarketingClip(testCase.request as any);
          console.log(`    ❌ Debería haber fallado pero no lo hizo`);
        } catch (error) {
          console.log(`    ✅ Falló como se esperaba: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        await generateMarketingClip(testCase.request as any);
        console.log(`    ✅ Pasó como se esperaba`);
      }
      
    } catch (error) {
      if (!testCase.deberiaFallar) {
        console.log(`    ❌ Error inesperado: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

/**
 * Test de rendimiento
 */
async function testRendimiento() {
  console.log('\n⚡ Test de rendimiento...');

  const request = {
    imagenes: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    descripcion: 'Test de rendimiento para Marketing AI',
    estilo: 'commercial' as const,
    duracion: 10
  };

  const tiempos: number[] = [];
  const numTests = 3;

  for (let i = 1; i <= numTests; i++) {
    console.log(`  🔄 Ejecución ${i}/${numTests}...`);
    
    const inicio = Date.now();
    try {
      await generateMarketingClip(request);
      const tiempo = Date.now() - inicio;
      tiempos.push(tiempo);
      console.log(`    ⏱️ Tiempo: ${Math.round(tiempo / 1000)}s`);
    } catch (error) {
      console.log(`    ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (tiempos.length > 0) {
    const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    const tiempoMinimo = Math.min(...tiempos);
    const tiempoMaximo = Math.max(...tiempos);

    console.log(`  📊 Estadísticas de rendimiento:`);
    console.log(`    ⏱️ Tiempo promedio: ${Math.round(tiempoPromedio / 1000)}s`);
    console.log(`    🏃 Tiempo mínimo: ${Math.round(tiempoMinimo / 1000)}s`);
    console.log(`    🐌 Tiempo máximo: ${Math.round(tiempoMaximo / 1000)}s`);
  }
}

// Ejecutar tests
if (require.main === module) {
  (async () => {
    try {
      await testMarketingAI();
      await testValidacion();
      await testRendimiento();
      
      console.log('\n🎉 Todos los tests completados exitosamente!');
      process.exit(0);
    } catch (error) {
      console.error('\n💥 Error en tests:', error);
      process.exit(1);
    }
  })();
}

export { testMarketingAI, testValidacion, testRendimiento };
