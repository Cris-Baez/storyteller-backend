/**
 * 🎬 TEST CINEMATOGRÁFICO COMPLETO
 * ==============================
 * 
 * Prueba real del pipeline cinematográfico con:
 * - Mejoras automáticas de coherencia
 * - Interceptor de voces optimizado
 * - Integración completa con todos los servicios
 */

const { renderVideoSimplificado } = require('./src/pipelines/renderPipeline.js');

async function testCinematografico() {
  console.log('\n🎬 TEST CINEMATOGRÁFICO - SISTEMA COMPLETO');
  console.log('=' .repeat(60));

  try {
    // Crear solicitud cinematográfica realista
    const solicitudCinematica = {
      prompt: "Un héroe solitario camina por una ciudad post-apocalíptica al atardecer, reflexionando sobre su misión",
      visualStyle: "cinematic",
      duration: 15,
      director: "cinematic",
      language: "es",
      voiceSettings: {
        provider: "elevenlabs",
        voiceId: "spanish-male-epic"
      },
      // Timeline personalizado para prueba completa
      customTimeline: [
        {
          segundo: 0,
          voz: "Era el fin de todo lo que conocía",
          dialogo: "Era el fin de todo lo que conocía",
          prompt: "Héroe solitario caminando por ciudad destruida, atardecer dorado",
          duracion: 4,
          personaje: "Protagonista"
        },
        {
          segundo: 4,
          voz: "Pero también el comienzo de algo nuevo",
          dialogo: "Pero también el comienzo de algo nuevo", 
          prompt: "Close-up del rostro del héroe, determinación en sus ojos",
          duracion: 4,
          personaje: "Protagonista"
        },
        {
          segundo: 8,
          voz: "Su destino le esperaba más allá del horizonte",
          dialogo: "Su destino le esperaba más allá del horizonte",
          prompt: "Plano amplio mostrando el horizonte devastado con luz dorada",
          duracion: 4,
          personaje: "Narrador"
        },
        {
          segundo: 12,
          voz: "Y él estaba listo",
          dialogo: "Y él estaba listo",
          prompt: "Héroe alejándose hacia el horizonte, música épica",
          duracion: 3,
          personaje: "Protagonista"
        }
      ]
    };

    console.log('\n📋 SOLICITUD CINEMATOGRÁFICA:');
    console.log(`  • Estilo: ${solicitudCinematica.visualStyle}`);
    console.log(`  • Duración: ${solicitudCinematica.duration}s`);
    console.log(`  • Prompt: "${solicitudCinematica.prompt}"`);
    console.log(`  • Segmentos: ${solicitudCinematica.customTimeline.length}`);
    
    console.log('\n🎭 TIMELINE ORIGINAL:');
    solicitudCinematica.customTimeline.forEach((seg, i) => {
      console.log(`  ${i + 1}. [${seg.segundo}-${seg.segundo + seg.duracion}s] "${seg.voz}" - ${seg.personaje}`);
      console.log(`      Escena: "${seg.prompt}"`);
    });

    // Mock de función de progreso
    const reportarProgreso = (mensaje, progreso) => {
      console.log(`\n📊 [${progreso}%] ${mensaje}`);
    };

    console.log('\n🚀 INICIANDO RENDERIZADO CINEMATOGRÁFICO...');
    console.log('-' .repeat(60));

    // Ejecutar el pipeline completo
    const resultado = await renderVideoSimplificado(solicitudCinematica, reportarProgreso);

    console.log('\n✅ RENDERIZADO COMPLETADO');
    console.log('=' .repeat(60));

    // Mostrar resultados detallados
    console.log('\n📹 RESULTADO DEL VIDEO:');
    console.log(`  • URL: ${resultado.url}`);
    console.log(`  • Duración: ${resultado.metadata?.duracion}s`);
    console.log(`  • Estilo aplicado: ${resultado.metadata?.estilo}`);

    // Mostrar mejoras de coherencia aplicadas
    if (resultado.metadata?.coherencia) {
      console.log('\n🎯 MEJORAS DE COHERENCIA APLICADAS:');
      console.log(`  • Videos procesados: ${resultado.metadata.coherencia.videosProcessados}`);
      console.log(`  • Diálogos mejorados: ${resultado.metadata.coherencia.dialogosMejorados}`);
      console.log(`  • Prompts mejorados: ${resultado.metadata.coherencia.promptsMejorados}`);
      console.log(`  • Voces optimizadas: ${resultado.metadata.coherencia.vocesOptimizadas}`);
    }

    // Mostrar servicios utilizados
    if (resultado.metadata?.serviciosUsados) {
      console.log('\n🔧 SERVICIOS UTILIZADOS:');
      resultado.metadata.serviciosUsados.forEach(servicio => {
        console.log(`  ✅ ${servicio}`);
      });
    }

    // Mostrar información de lip-sync
    if (resultado.metadata?.lipSync) {
      console.log('\n👄 SINCRONIZACIÓN LABIAL:');
      console.log(`  • Aplicado: ${resultado.metadata.lipSync.aplicado ? 'SÍ' : 'NO'}`);
      console.log(`  • Exitosos: ${resultado.metadata.lipSync.exitosos}`);
      console.log(`  • Fallidos: ${resultado.metadata.lipSync.fallidos}`);
      console.log(`  • Tecnología: ${resultado.metadata.lipSync.tecnologia}`);
    }

    // Mostrar plan final mejorado
    console.log('\n🎬 PLAN FINAL MEJORADO:');
    if (resultado.plan?.timeline) {
      resultado.plan.timeline.forEach((seg, i) => {
        console.log(`  ${i + 1}. [${seg.segundo || 0}s] "${seg.voz}" - ${seg.personaje || 'Sin personaje'}`);
        console.log(`      Escena: "${seg.prompt}"`);
        if (seg.vozConfig) {
          console.log(`      🎤 Voz: ${seg.vozConfig.voiceId} (${seg.vozConfig.provider}) - Optimizada: ${seg.vozConfig.optimizada}`);
        }
      });
    }

    console.log('\n🌟 ANÁLISIS FINAL:');
    console.log('=' .repeat(60));

    // Verificar que el sistema funcionó correctamente
    const verificaciones = [
      {
        nombre: 'Video generado exitosamente',
        pasado: !!resultado.url,
        detalle: resultado.url ? `URL: ${resultado.url}` : 'No se generó URL'
      },
      {
        nombre: 'Plan mejorado automáticamente', 
        pasado: resultado.plan?.timeline?.length > 0,
        detalle: `${resultado.plan?.timeline?.length || 0} segmentos procesados`
      },
      {
        nombre: 'Coherencia aplicada',
        pasado: resultado.metadata?.coherencia?.videosProcessados > 0,
        detalle: `${resultado.metadata?.coherencia?.videosProcessados || 0} videos procesados`
      },
      {
        nombre: 'Voces optimizadas',
        pasado: resultado.metadata?.coherencia?.vocesOptimizadas > 0,
        detalle: `${resultado.metadata?.coherencia?.vocesOptimizadas || 0} voces optimizadas`
      },
      {
        nombre: 'Metadata completa',
        pasado: !!resultado.metadata,
        detalle: resultado.metadata ? 'Metadata presente' : 'Sin metadata'
      }
    ];

    console.log('\n✅ VERIFICACIONES:');
    let todoExitoso = true;
    verificaciones.forEach(v => {
      const estado = v.pasado ? '✅' : '❌';
      console.log(`  ${estado} ${v.nombre}`);
      console.log(`      ${v.detalle}`);
      if (!v.pasado) todoExitoso = false;
    });

    if (todoExitoso) {
      console.log('\n🎉 ¡TEST CINEMATOGRÁFICO EXITOSO!');
      console.log('🚀 El sistema completo está funcionando perfectamente');
      console.log('✨ Mejoras automáticas aplicándose correctamente');
      console.log('🎬 Videos cinematográficos listos para producción');
    } else {
      console.log('\n⚠️ Algunos aspectos necesitan revisión');
    }

    return resultado;

  } catch (error) {
    console.error('\n❌ ERROR EN TEST CINEMATOGRÁFICO:', error.message);
    console.error('Stack completo:', error.stack);
    
    // Información adicional para debugging
    if (error.code) console.error('Código de error:', error.code);
    if (error.response?.data) console.error('Respuesta del servidor:', error.response.data);
    
    throw error;
  }
}

// Ejecutar test cinematográfico
console.log('🎬 Iniciando test del sistema cinematográfico completo...');
testCinematografico()
  .then(resultado => {
    console.log('\n🎊 TEST COMPLETADO EXITOSAMENTE');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TEST FALLÓ:', error.message);
    process.exit(1);
  });
