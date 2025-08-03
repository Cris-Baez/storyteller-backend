#!/usr/bin/env node
// verificar_jobs_completados.js - Verificar si los jobs del test anterior completaron

import axios from 'axios';

const SERVER_BASE = 'http://localhost:3000';

// Jobs del test anterior
const JOBS_ANTERIORES = [
  { id: '79079f6b-e28b-4eab-bbbd-cc1ceb72fae4', estilo: 'CINEMATIC' },
  { id: '9119df7f-e6e2-49c3-b95a-054b16dc24d2', estilo: 'ANIME' },
  { id: '29fa75fa-ef7c-459a-b463-7831a77aba0a', estilo: 'CARTOON' },
  { id: '93827bca-9acf-4576-90a0-6eff6d4831fc', estilo: 'COMMERCIAL' }
];

async function verificarJob(jobInfo) {
  try {
    console.log(`\n🔍 Verificando ${jobInfo.estilo} (${jobInfo.id})...`);
    
    // Verificar estado
    const statusResponse = await axios.get(`${SERVER_BASE}/api/render/status/${jobInfo.id}`);
    const estado = statusResponse.data;
    
    console.log(`   Estado: ${JSON.stringify(estado)}`);
    
    // Si completó o está en error, intentar obtener resultado
    if (estado.status === 'completed' || estado.status === 'error' || estado === 'completed') {
      try {
        const resultResponse = await axios.get(`${SERVER_BASE}/api/render/result/${jobInfo.id}`);
        const resultado = resultResponse.data;
        
        console.log(`   📊 Resultado:`, typeof resultado === 'object' ? JSON.stringify(resultado, null, 2) : resultado);
        
        // Verificar si tiene video y audio
        if (resultado && typeof resultado === 'object') {
          const tieneVideo = !!resultado.videoUrl;
          const tieneAudio = !!resultado.audioUrl;
          
          console.log(`   🎥 Video: ${tieneVideo ? '✅' : '❌'}`);
          console.log(`   🎵 Audio: ${tieneAudio ? '✅' : '❌'}`);
          
          if (tieneVideo) {
            console.log(`   📹 URL Video: ${resultado.videoUrl}`);
          }
          if (tieneAudio) {
            console.log(`   🔊 URL Audio: ${resultado.audioUrl}`);
          }
          
          return {
            estilo: jobInfo.estilo,
            completado: true,
            tieneVideo,
            tieneAudio,
            resultado
          };
        }
      } catch (error) {
        console.log(`   ⚠️ Error obteniendo resultado: ${error.message}`);
      }
    }
    
    return {
      estilo: jobInfo.estilo,
      completado: false,
      estado: estado.status || estado
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      estilo: jobInfo.estilo,
      completado: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 ===== VERIFICACIÓN DE JOBS ANTERIORES =====\n');
  
  const resultados = [];
  
  for (const jobInfo of JOBS_ANTERIORES) {
    const resultado = await verificarJob(jobInfo);
    resultados.push(resultado);
  }
  
  // Resumen
  console.log('\n📊 ===== RESUMEN =====');
  
  const completados = resultados.filter(r => r.completado);
  const conVideo = resultados.filter(r => r.tieneVideo);
  const conAudio = resultados.filter(r => r.tieneAudio);
  
  console.log(`✅ Completados: ${completados.length}/${resultados.length}`);
  console.log(`🎥 Con Video: ${conVideo.length}/${resultados.length}`);
  console.log(`🎵 Con Audio: ${conAudio.length}/${resultados.length}`);
  
  if (completados.length > 0) {
    console.log('\n🎉 ¡Jobs completados encontrados!');
    completados.forEach(r => {
      console.log(`   ${r.estilo}: Video ${r.tieneVideo ? '✅' : '❌'}, Audio ${r.tieneAudio ? '✅' : '❌'}`);
    });
  } else {
    console.log('\n⚠️ Ningún job completado aún. Pueden estar procesando todavía.');
  }
}

main().catch(console.error);
