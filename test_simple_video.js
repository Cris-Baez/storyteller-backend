#!/usr/bin/env node
// test_simple_video.js - Test simple de un solo video para debug

import axios from 'axios';

const SERVER_BASE = 'http://localhost:3000';

async function testSimpleVideo() {
  console.log('🎬 ===== TEST SIMPLE - UN VIDEO =====\n');
  
  try {
    // Test con prompt muy simple y duración corta
    const requestData = {
      prompt: 'A person walking in a park',
      visualStyle: 'cinematic',
      duration: 15 // Solo 15 segundos
    };

    console.log('🚀 Enviando solicitud de video simple...');
    console.log(`   Prompt: "${requestData.prompt}"`);
    console.log(`   Estilo: ${requestData.visualStyle}`);
    console.log(`   Duración: ${requestData.duration}s`);
    
    const response = await axios.post(`${SERVER_BASE}/api/render`, requestData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n📥 Respuesta recibida:', response.status);
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success && (response.data.data?.jobId || response.data.jobId)) {
      const jobId = response.data.data?.jobId || response.data.jobId;
      console.log(`\n✅ Job iniciado: ${jobId}`);
      console.log(`\n💡 Para monitorear manualmente:`);
      console.log(`   Estado: curl http://localhost:3000/api/render/status/${jobId}`);
      console.log(`   Resultado: curl http://localhost:3000/api/render/result/${jobId}`);
      console.log(`\n⏳ Esperando 5 minutos antes de verificar...`);
      
      // Esperar 5 minutos
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      
      console.log('\n🔍 Verificando estado...');
      const statusResponse = await axios.get(`${SERVER_BASE}/api/render/status/${jobId}`);
      console.log('Estado:', statusResponse.data);
      
      if (statusResponse.data.status === 'completed' || statusResponse.data === 'completed') {
        console.log('\n🎉 ¡Completado! Obteniendo resultado...');
        const resultResponse = await axios.get(`${SERVER_BASE}/api/render/result/${jobId}`);
        console.log('Resultado:', JSON.stringify(resultResponse.data, null, 2));
      } else if (statusResponse.data.status === 'error') {
        console.log('\n❌ Error detectado. Obteniendo detalles...');
        const resultResponse = await axios.get(`${SERVER_BASE}/api/render/result/${jobId}`);
        console.log('Error:', JSON.stringify(resultResponse.data, null, 2));
      } else {
        console.log('\n⏳ Aún procesando. Verifica manualmente más tarde.');
      }
      
    } else {
      console.log('❌ Error en la respuesta:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSimpleVideo();
