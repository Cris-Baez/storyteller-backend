#!/usr/bin/env node
// test_4_estilos_completo.js - Test completo de los 4 estilos con audio
// Ejecutar: node test_4_estilos_completo.js

import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// ===== CONFIGURACIÓN =====
const SERVER_BASE = 'http://localhost:3000';
const RESULTS_DIR = './test_results_4_estilos';
const TIMEOUT_VIDEO = 25 * 60 * 1000; // 25 minutos por video (más tiempo para audio)
const POLL_INTERVAL = 10000; // 10 segundos (menos frecuente)

// ===== PROMPTS DE TEST POR ESTILO =====
const TEST_SCENARIOS = {
  cinematic: {
    name: '🎬 CINEMATIC',
    prompt: 'Un astronauta solitario camina por una estación espacial abandonada, los rayos de luz filtran por las ventanas creando un ambiente dramático y melancólico',
    duration: 30,
    expectedFeatures: ['audio', 'lip-sync', 'cinematografía profesional', 'wav2lip']
  },
  anime: {
    name: '🎌 ANIME', 
    prompt: 'Una guerrera anime con espada mágica se prepara para el combate final, sus ojos brillan con determinación mientras el viento mueve su cabello',
    duration: 25,
    expectedFeatures: ['audio', 'lip-sync', 'estética anime', 'sadtalker']
  },
  cartoon: {
    name: '🎨 CARTOON',
    prompt: 'Un detective cartoon con sombrero investiga pistas en una oficina misteriosa, examina documentos con una lupa mientras reflexiona en voz alta',
    duration: 24,
    expectedFeatures: ['audio', 'lip-sync', 'estilo animado', 'sadtalker']
  },
  commercial: {
    name: '📺 COMMERCIAL',
    prompt: 'Un chef profesional presenta orgullosamente su nueva creación culinaria en una cocina moderna, destaca los ingredientes premium y la técnica perfecta',
    duration: 30,
    expectedFeatures: ['audio', 'sin lip-sync', 'estilo comercial']
  }
};

// ===== UTILIDADES =====
async function crearDirectorioResultados() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    console.log(`📁 Directorio de resultados creado: ${RESULTS_DIR}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function verificarServidor() {
  try {
    console.log('🔍 Verificando servidor...');
    const response = await axios.get(`${SERVER_BASE}/healthz`, { timeout: 5000 });
    console.log('✅ Servidor OK:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Servidor no disponible:', error.message);
    console.log('💡 Asegúrate de que el servidor esté corriendo con: npm run dev');
    return false;
  }
}

async function solicitarVideo(estilo, scenario) {
  console.log(`\n🚀 Iniciando video ${scenario.name}...`);
  console.log(`   Prompt: "${scenario.prompt.substring(0, 80)}..."`);
  console.log(`   Duración: ${scenario.duration}s`);
  
  try {
    const requestData = {
      prompt: scenario.prompt,
      visualStyle: estilo,
      duration: scenario.duration
    };

    console.log('📤 Enviando solicitud...');
    const response = await axios.post(`${SERVER_BASE}/api/render`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('📥 Respuesta recibida:', response.status, response.data);

    // ✅ AJUSTAR PARA NUEVO FORMATO DE RESPUESTA
    if (response.data.success && (response.data.data?.jobId || response.data.jobId)) {
      const jobId = response.data.data?.jobId || response.data.jobId;
      console.log(`✅ Job iniciado: ${jobId}`);
      return jobId;
    } else {
      throw new Error(`Respuesta inválida: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`❌ Error iniciando video ${estilo}:`, error.response?.data || error.message);
    throw error;
  }
}

async function esperarCompletado(jobId, estilo, timeout = TIMEOUT_VIDEO) {
  console.log(`⏳ Esperando completado del job ${jobId}...`);
  
  const startTime = Date.now();
  let lastProgress = -1;
  
  while (Date.now() - startTime < timeout) {
    try {
      // ✅ USAR RUTA CORRECTA DEL ENDPOINT
      const statusResponse = await axios.get(`${SERVER_BASE}/api/render/status/${jobId}`);
      const status = statusResponse.data;
      
      console.log(`   🔍 Estado actual:`, status);
      
      // Mostrar progreso si cambió
      if (status.progress !== undefined && status.progress !== lastProgress) {
        console.log(`   📊 Progreso: ${status.progress}%`);
        lastProgress = status.progress;
      }
      
      // Verificar si completó
      if (status.status === 'completed' || status === 'completed') {
        console.log(`✅ Job ${jobId} completado!`);
        
        // ✅ USAR RUTA CORRECTA PARA RESULTADO
        const resultResponse = await axios.get(`${SERVER_BASE}/api/render/result/${jobId}`);
        return resultResponse.data;
      }
      
      // Verificar si falló
      if (status.status === 'failed' || status === 'failed') {
        const error = status.error || 'Error desconocido';
        throw new Error(`Job falló: ${error}`);
      }
      
      // Esperar antes del siguiente poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Job ${jobId} no encontrado`);
      }
      console.error(`⚠️ Error verificando estado:`, error.message);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
  
  throw new Error(`Timeout esperando completado del job ${jobId}`);
}

async function validarResultado(resultado, estilo, scenario) {
  console.log(`🔍 Validando resultado ${scenario.name}...`);
  
  const issues = [];
  
  // Validar estructura básica
  if (!resultado.success) {
    issues.push(`❌ Success = false: ${resultado.error || 'Sin error específico'}`);
  }
  
  if (!resultado.videoUrl) {
    issues.push(`❌ Sin videoUrl`);
  }
  
  // Validar audio según estilo
  const configEstilo = {
    cinematic: { tieneAudio: true, lipsync: 'wav2lip' },
    anime: { tieneAudio: true, lipsync: 'sadtalker' },
    cartoon: { tieneAudio: true, lipsync: 'sadtalker' },
    commercial: { tieneAudio: true, lipsync: null }
  }[estilo];
  
  if (configEstilo.tieneAudio && !resultado.audioUrl) {
    issues.push(`❌ Sin audioUrl (esperado para ${estilo})`);
  }
  
  // Validar metadata del video
  if (resultado.metadata) {
    const meta = resultado.metadata;
    
    if (!meta.visualStyle || meta.visualStyle !== estilo) {
      issues.push(`❌ Estilo incorrecto: esperado '${estilo}', recibido '${meta.visualStyle}'`);
    }
    
    if (meta.duration && Math.abs(meta.duration - scenario.duration) > 5) {
      issues.push(`⚠️ Duración inesperada: esperado ~${scenario.duration}s, recibido ${meta.duration}s`);
    }
  }
  
  // Resultado de validación
  if (issues.length === 0) {
    console.log(`✅ Validación ${scenario.name} EXITOSA`);
    return { valid: true, issues: [] };
  } else {
    console.log(`⚠️ Validación ${scenario.name} con problemas:`);
    issues.forEach(issue => console.log(`     ${issue}`));
    return { valid: false, issues };
  }
}

async function guardarResultado(resultado, estilo, scenario) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `resultado_${estilo}_${timestamp}.json`;
  const filePath = path.join(RESULTS_DIR, fileName);
  
  const reporteCompleto = {
    timestamp: new Date().toISOString(),
    estilo,
    scenario: {
      name: scenario.name,
      prompt: scenario.prompt,
      duration: scenario.duration,
      expectedFeatures: scenario.expectedFeatures
    },
    resultado,
    metadata: {
      serverBase: SERVER_BASE,
      testVersion: '1.0.0'
    }
  };
  
  await fs.writeFile(filePath, JSON.stringify(reporteCompleto, null, 2));
  console.log(`💾 Resultado guardado: ${fileName}`);
  
  return filePath;
}

async function generarReporteCompleto(resultados) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportePath = path.join(RESULTS_DIR, `reporte_completo_${timestamp}.md`);
  
  let reporte = `# 🎬 Reporte de Test - 4 Estilos CinemaAI\n\n`;
  reporte += `**Fecha:** ${new Date().toLocaleString('es-ES')}\n`;
  reporte += `**Servidor:** ${SERVER_BASE}\n`;
  reporte += `**Estilos Testados:** ${Object.keys(resultados).length}\n\n`;
  
  // Resumen ejecutivo
  const exitosos = Object.values(resultados).filter(r => r.success).length;
  const fallidos = Object.keys(resultados).length - exitosos;
  
  reporte += `## 📊 Resumen Ejecutivo\n\n`;
  reporte += `- ✅ **Exitosos:** ${exitosos}/${Object.keys(resultados).length}\n`;
  reporte += `- ❌ **Fallidos:** ${fallidos}/${Object.keys(resultados).length}\n`;
  reporte += `- 🎵 **Con Audio:** ${Object.values(resultados).filter(r => r.resultado?.audioUrl).length}\n`;
  reporte += `- 🎥 **Con Video:** ${Object.values(resultados).filter(r => r.resultado?.videoUrl).length}\n\n`;
  
  // Detalle por estilo
  reporte += `## 📝 Detalle por Estilo\n\n`;
  
  for (const [estilo, data] of Object.entries(resultados)) {
    const scenario = TEST_SCENARIOS[estilo];
    reporte += `### ${scenario.name}\n\n`;
    reporte += `**Estado:** ${data.success ? '✅ EXITOSO' : '❌ FALLIDO'}\n`;
    reporte += `**Prompt:** "${scenario.prompt}"\n`;
    reporte += `**Duración:** ${scenario.duration}s\n`;
    
    if (data.success && data.resultado) {
      reporte += `**Video URL:** ${data.resultado.videoUrl || 'No disponible'}\n`;
      reporte += `**Audio URL:** ${data.resultado.audioUrl || 'No disponible'}\n`;
      
      if (data.validacion) {
        reporte += `**Validación:** ${data.validacion.valid ? '✅ VÁLIDO' : '⚠️ CON PROBLEMAS'}\n`;
        if (data.validacion.issues && data.validacion.issues.length > 0) {
          reporte += `**Problemas:**\n`;
          data.validacion.issues.forEach(issue => {
            reporte += `  - ${issue}\n`;
          });
        }
      }
    } else {
      reporte += `**Error:** ${data.error || 'Error desconocido'}\n`;
    }
    
    reporte += `**Tiempo:** ${data.tiempoEjecucion ? `${Math.round(data.tiempoEjecucion / 1000)}s` : 'N/A'}\n\n`;
  }
  
  // Recomendaciones
  reporte += `## 💡 Recomendaciones\n\n`;
  
  if (exitosos === Object.keys(resultados).length) {
    reporte += `🎉 **¡Excelente!** Todos los estilos funcionan correctamente.\n\n`;
    reporte += `- Sistema de audio integrado funcional\n`;
    reporte += `- Todos los cerebros especializados operativos\n`;
    reporte += `- Pipeline de video completo\n\n`;
  } else {
    reporte += `⚠️ **Atención:** Algunos estilos requieren revisión.\n\n`;
    
    Object.entries(resultados).forEach(([estilo, data]) => {
      if (!data.success) {
        reporte += `- **${estilo}:** ${data.error}\n`;
      }
    });
    reporte += `\n`;
  }
  
  reporte += `---\n`;
  reporte += `*Generado automáticamente por test_4_estilos_completo.js*\n`;
  
  await fs.writeFile(reportePath, reporte);
  console.log(`📋 Reporte completo generado: ${path.basename(reportePath)}`);
  
  return reportePath;
}

// ===== FUNCIÓN PRINCIPAL =====
async function main() {
  console.log('🎬 ===== TEST COMPLETO 4 ESTILOS CINEMAAI =====\n');
  
  try {
    // Preparación
    await crearDirectorioResultados();
    
    const servidorOK = await verificarServidor();
    if (!servidorOK) {
      process.exit(1);
    }
    
    console.log(`\n📋 Iniciando test de ${Object.keys(TEST_SCENARIOS).length} estilos...`);
    console.log(`⏱️ Timeout por video: ${TIMEOUT_VIDEO / 60000} minutos\n`);
    
    const resultados = {};
    
    // Procesar cada estilo
    for (const [estilo, scenario] of Object.entries(TEST_SCENARIOS)) {
      const inicioTiempo = Date.now();
      
      try {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🎯 PROCESANDO: ${scenario.name}`);
        console.log(`${'='.repeat(50)}`);
        
        // 1. Solicitar video
        const jobId = await solicitarVideo(estilo, scenario);
        
        // 2. Esperar completado
        const resultado = await esperarCompletado(jobId, estilo);
        
        // 3. Validar resultado
        const validacion = await validarResultado(resultado, estilo, scenario);
        
        // 4. Guardar resultado
        await guardarResultado(resultado, estilo, scenario);
        
        const tiempoEjecucion = Date.now() - inicioTiempo;
        
        resultados[estilo] = {
          success: true,
          jobId,
          resultado,
          validacion,
          tiempoEjecucion,
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ ${scenario.name} COMPLETADO en ${Math.round(tiempoEjecucion / 1000)}s`);
        
      } catch (error) {
        const tiempoEjecucion = Date.now() - inicioTiempo;
        
        resultados[estilo] = {
          success: false,
          error: error.message,
          tiempoEjecucion,
          timestamp: new Date().toISOString()
        };
        
        console.error(`❌ ${scenario.name} FALLÓ:`, error.message);
      }
    }
    
    // Generar reporte final
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 GENERANDO REPORTE FINAL`);
    console.log(`${'='.repeat(50)}`);
    
    await generarReporteCompleto(resultados);
    
    // Resumen final en consola
    console.log(`\n🏁 ===== RESUMEN FINAL =====`);
    
    const exitosos = Object.values(resultados).filter(r => r.success).length;
    const total = Object.keys(resultados).length;
    
    console.log(`✅ Exitosos: ${exitosos}/${total}`);
    console.log(`❌ Fallidos: ${total - exitosos}/${total}`);
    console.log(`📁 Resultados en: ${RESULTS_DIR}`);
    
    if (exitosos === total) {
      console.log(`\n🎉 ¡PERFECTO! Todos los estilos funcionan con audio 🎵`);
      process.exit(0);
    } else {
      console.log(`\n⚠️ Algunos estilos requieren atención. Revisa el reporte.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('test_4_estilos_completo.js')) {
  console.log('🎬 Iniciando script de test...');
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { main, TEST_SCENARIOS, verificarServidor };
