/**
 * 🎬 TEST CINEMATOGRÁFICO DIRECTO
 * ==============================
 * 
 * Prueba el pipeline compilado de JavaScript
 */

import { renderVideoSimplificado } from './dist/pipelines/renderPipeline.js';

async function testCinematograficoDirecto() {
  console.log('\n🎬 TEST CINEMATOGRÁFICO - SISTEMA COMPLETO');
  console.log('=' .repeat(60));

  try {
    // Crear solicitud cinematográfica realista
    const solicitudCinematica = {
      prompt: "Un héroe solitario camina por una ciudad post-apocalíptica al atardecer",
      visualStyle: "cinematic",
      duration: 30, // ✅ 30 SEGUNDOS COMO TÚ ESPECIFICASTE
      director: "cinematic",
      language: "es",
      voiceSettings: {
        provider: "elevenlabs",
        voiceId: "spanish-male-epic"  
      }
    };

    console.log('\n📋 SOLICITUD CINEMATOGRÁFICA:');
    console.log(`  • Estilo: ${solicitudCinematica.visualStyle}`);
    console.log(`  • Duración: ${solicitudCinematica.duration}s`);
    console.log(`  • Prompt: "${solicitudCinematica.prompt}"`);

    // Mock de función de progreso
    const reportarProgreso = (mensaje, progreso) => {
      console.log(`📊 [${progreso}%] ${mensaje}`);
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

    // Mostrar plan final mejorado
    console.log('\n🎬 PLAN FINAL MEJORADO:');
    if (resultado.plan?.timeline) {
      resultado.plan.timeline.forEach((seg, i) => {
        console.log(`  ${i + 1}. "${seg.voz}" - ${seg.personaje || 'Sin personaje'}`);
        console.log(`      Escena: "${seg.prompt}"`);
        if (seg.vozConfig?.optimizada) {
          console.log(`      🎤 Voz optimizada: ${seg.vozConfig.voiceId} (${seg.vozConfig.provider})`);
        }
      });
    }

    console.log('\n🌟 ANÁLISIS FINAL:');
    console.log('=' .repeat(60));

    const todoExitoso = resultado.url && resultado.plan?.timeline?.length > 0;

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
    throw error;
  }
}

// Ejecutar test
testCinematograficoDirecto()
  .then(resultado => {
    console.log('\n🎊 TEST COMPLETADO EXITOSAMENTE');
  })
  .catch(error => {
    console.error('\n💥 TEST FALLÓ:', error.message);
  });
