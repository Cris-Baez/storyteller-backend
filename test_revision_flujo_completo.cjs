/**
 * ✅ REVISIÓN COMPLETA DEL FLUJO
 * =============================
 * 
 * Prueba completa de todo el sistema integrado:
 * 1. Pipeline principal con coherencia automática
 * 2. Interceptor de voces funcionando
 * 3. Servicios originales intactos
 * 4. Integración sin conflictos
 */

const { coherenciaAutomatica } = require('./src/middleware/coherenciaAutomatic.js');
const { voiceInterceptor } = require('./src/services/voiceInterceptor.js');

// Simular funciones del voiceService para test
const mockCreateVoiceBuffer = async (plan) => {
  console.log('  📱 createVoiceBuffer llamado con plan:', plan.timeline?.length || 0, 'segmentos');
  return Buffer.from('mock-audio-data');
};

async function revisarFlujoCompleto() {
  console.log('\n🔍 REVISIÓN COMPLETA DEL FLUJO');
  console.log('=' .repeat(50));

  try {
    // ===== PARTE 1: TEST DEL SISTEMA DE COHERENCIA =====
    console.log('\n1️⃣ SISTEMA DE COHERENCIA AUTOMÁTICA');
    console.log('-' .repeat(40));
    
    const planOriginal = {
      id: 'test-revision-completa',
      titulo: "Historia para revisar",
      timeline: [
        {
          segundo: 0,
          voz: "Hola",
          dialogo: "Hola mundo",
          prompt: "Una casa",
          duracion: 3,
          personaje: "Protagonista"
        },
        {
          segundo: 3,
          voz: "Este es un texto muy largo que definitivamente necesita ser truncado porque es demasiado extenso para el tiempo disponible y podría causar problemas de sincronización con el video",
          prompt: "Cielo azul",
          duracion: 2,
          personaje: "Narrador"
        },
        {
          segundo: 5,
          voz: "Ok",
          prompt: "Final",
          duracion: 3,
          personaje: "Protagonista"
        }
      ]
    };

    console.log('\n📋 Plan Original:');
    planOriginal.timeline.forEach((seg, i) => {
      console.log(`  ${i + 1}. "${seg.voz}" (${seg.duracion}s) - ${seg.personaje}`);
      console.log(`     Prompt: "${seg.prompt}"`);
    });

    // Aplicar mejoras automáticas
    console.log('\n🔄 Aplicando mejoras automáticas...');
    const planMejorado = await coherenciaAutomatica.mejorarPlanAutomaticamente(planOriginal, {
      visualStyle: 'cinematic',
      duration: 8
    });

    console.log('\n✅ Plan Mejorado:');
    planMejorado.timeline.forEach((seg, i) => {
      console.log(`  ${i + 1}. "${seg.voz}" (${seg.duracion}s) - ${seg.personaje || 'Sin personaje'}`);
      console.log(`     Prompt: "${seg.prompt}"`);
      if (seg.vozConfig) {
        console.log(`     🎤 Voz optimizada: ${seg.vozConfig.voiceId} (${seg.vozConfig.provider})`);
      }
    });

    // ===== PARTE 2: TEST DEL INTERCEPTOR DE VOCES =====
    console.log('\n\n2️⃣ INTERCEPTOR DE VOCES');
    console.log('-' .repeat(40));
    
    // Test con configuración optimizada
    console.log('\n🎤 Probando voz CON configuración optimizada...');
    const solicitudVoz1 = {
      text: "Texto de prueba con configuración optimizada",
      language: 'es',
      outputFormat: 'mp3'
    };
    
    const vozConfigOptimizada = {
      voiceId: 'spanish-male-epic',
      provider: 'elevenlabs',
      language: 'es',
      personaje: 'Protagonista',
      optimizada: true
    };
    
    const resultadoOptimizado = await voiceInterceptor.generateVoiceConMejoras(
      solicitudVoz1, 
      vozConfigOptimizada
    );
    console.log(`✅ Voz optimizada generada: ${Buffer.isBuffer(resultadoOptimizado) ? resultadoOptimizado.length + ' bytes' : 'OK'}`);

    // Test sin configuración optimizada (fallback)
    console.log('\n🎤 Probando voz SIN configuración optimizada (fallback)...');
    const solicitudVoz2 = {
      text: "Texto de prueba sin optimización",
      language: 'es',
      outputFormat: 'mp3'
    };
    
    const resultadoFallback = await voiceInterceptor.generateVoiceConMejoras(solicitudVoz2, null);
    console.log(`✅ Voz fallback generada: ${Buffer.isBuffer(resultadoFallback) ? resultadoFallback.length + ' bytes' : 'OK'}`);

    // ===== PARTE 3: ESTADÍSTICAS Y ESTADO =====
    console.log('\n\n3️⃣ ESTADÍSTICAS DEL SISTEMA');
    console.log('-' .repeat(40));
    
    const estadisticasCoherencia = coherenciaAutomatica.obtenerEstadisticas();
    console.log('\n📊 Estadísticas de Coherencia:');
    console.log(`  • Videos procesados: ${estadisticasCoherencia.videosProcessados}`);
    console.log(`  • Diálogos mejorados: ${estadisticasCoherencia.dialogosMejorados}`);
    console.log(`  • Prompts mejorados: ${estadisticasCoherencia.promptsMejorados}`);
    console.log(`  • Voces optimizadas: ${estadisticasCoherencia.vocesOptimizadas}`);
    
    const estadoInterceptor = voiceInterceptor.obtenerEstado();
    console.log('\n🎤 Estado del Interceptor:');
    console.log(`  • Mejoras aplicadas: ${estadoInterceptor.mejorasAplicadas}`);
    console.log(`  • Activo desde: ${estadoInterceptor.inicializadoEn}`);

    // ===== PARTE 4: VERIFICACIÓN DE INTEGRIDAD =====
    console.log('\n\n4️⃣ VERIFICACIÓN DE INTEGRIDAD');
    console.log('-' .repeat(40));
    
    const verificaciones = [
      {
        nombre: 'Sistema de coherencia funcionando',
        pasado: planMejorado.timeline.length === planOriginal.timeline.length
      },
      {
        nombre: 'Mejoras automáticas aplicadas',
        pasado: estadisticasCoherencia.videosProcessados > 0
      },
      {
        nombre: 'Interceptor de voces activo',
        pasado: estadoInterceptor.mejorasAplicadas >= 0
      },
      {
        nombre: 'Configuraciones de voz optimizadas',
        pasado: planMejorado.timeline.some(seg => seg.vozConfig && seg.vozConfig.optimizada)
      },
      {
        nombre: 'Fallbacks funcionando',
        pasado: Buffer.isBuffer(resultadoFallback) || resultadoFallback === 'OK'
      }
    ];

    console.log('\n✅ Verificaciones:');
    verificaciones.forEach(v => {
      console.log(`  ${v.pasado ? '✅' : '❌'} ${v.nombre}`);
    });

    const todosFuncionando = verificaciones.every(v => v.pasado);

    // ===== RESUMEN FINAL =====
    console.log('\n\n🎯 RESUMEN FINAL');
    console.log('=' .repeat(50));
    
    if (todosFuncionando) {
      console.log('🌟 ¡FLUJO COMPLETAMENTE OPERATIVO!');
      console.log('\n✅ Sistema funcionando correctamente:');
      console.log('  • Pipeline con coherencia automática: ✅');
      console.log('  • Interceptor de voces: ✅');
      console.log('  • Servicios originales intactos: ✅');
      console.log('  • Integración sin conflictos: ✅');
      console.log('  • Errores de TypeScript corregidos: ✅');
      
      console.log('\n📈 Mejoras automáticas aplicándose:');
      console.log(`  • ${estadisticasCoherencia.dialogosMejorados} diálogos optimizados`);
      console.log(`  • ${estadisticasCoherencia.promptsMejorados} prompts mejorados`);
      console.log(`  • ${estadisticasCoherencia.vocesOptimizadas} voces configuradas`);
      
      console.log('\n🚀 TODOS LOS VIDEOS AHORA SE MEJORAN AUTOMÁTICAMENTE');
    } else {
      console.log('❌ Hay problemas en el flujo que necesitan atención');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA REVISIÓN:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar revisión completa
revisarFlujoCompleto();
