// src/tests/testApiRest.ts
// Test directo usando el API REST para verificar el MVP completo

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

// Test prompts para cada estilo visual
const TEST_PROMPTS = {
  cinematic: "Un joven samurái camina al atardecer por un templo japonés, cinematografía épica",
  anime: "Una chica con poderes mágicos lanza un hechizo brillante en un bosque encantado", 
  cartoon: "Un perro divertido persigue una pelota en un parque lleno de colores vibrantes",
  commercial: "Una familia feliz disfruta de un producto innovador en su hogar moderno"
};

interface RenderRequest {
  prompt: string;
  duration: number;
  visualStyle: string;
}

interface JobStatus {
  status: 'pending' | 'processing' | 'done' | 'error';
  currentStep?: string;
  progress?: number;
  errorMessage?: string;
}

/**
 * Envía request de render al API
 */
async function enviarRenderRequest(request: RenderRequest): Promise<string> {
  console.log(`📤 Enviando request: ${request.visualStyle} - ${request.duration}s`);
  
  const response = await fetch(`${API_BASE}/api/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const result = await response.json() as any;
  return result.jobId;
}

/**
 * Verifica el estado de un job
 */
async function verificarEstadoJob(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/api/render/status/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json() as JobStatus;
}

/**
 * Obtiene el resultado final de un job
 */
async function obtenerResultadoJob(jobId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/render/result/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json() as any;
}

/**
 * Espera a que un job se complete
 */
async function esperarJobCompleto(jobId: string, maxTiempo: number = 300000): Promise<any> {
  const startTime = Date.now();
  let lastStep = '';

  while (Date.now() - startTime < maxTiempo) {
    const status = await verificarEstadoJob(jobId);
    
    if (status.currentStep !== lastStep) {
      console.log(`   📊 ${status.currentStep}: ${status.progress || 0}%`);
      lastStep = status.currentStep || '';
    }

    if (status.status === 'done') {
      console.log(`   ✅ Job completado en ${Math.round((Date.now() - startTime) / 1000)}s`);
      return await obtenerResultadoJob(jobId);
    }

    if (status.status === 'error') {
      throw new Error(`Job falló: ${status.errorMessage}`);
    }

    // Esperar 2 segundos antes de verificar de nuevo
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(`Job timeout después de ${maxTiempo / 1000}s`);
}

/**
 * Test completo de todos los estilos visuales
 */
export async function testearTodosLosEstilos(): Promise<void> {
  console.log('🚀 INICIANDO TEST COMPLETO DEL MVP VIA API REST');
  console.log('================================================');
  
  // Verificar que el servidor esté corriendo
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (!healthResponse.ok) {
      throw new Error('Servidor no responde');
    }
    console.log('✅ Servidor funcionando correctamente');
  } catch (error) {
    console.error('❌ Servidor no disponible en', API_BASE);
    console.error('   Asegúrate de que el servidor esté corriendo con: npm start');
    return;
  }

  const resultados: any[] = [];

  for (const [estilo, prompt] of Object.entries(TEST_PROMPTS)) {
    console.log(`\n🎬 Testing estilo: ${estilo.toUpperCase()}`);
    console.log(`📝 Prompt: ${prompt}`);
    
    try {
      const startTime = Date.now();
      
      // 1. Enviar request de render
      const jobId = await enviarRenderRequest({
        prompt,
        duration: 15, // 15 segundos
        visualStyle: estilo
      });
      
      console.log(`   🔑 Job ID: ${jobId}`);
      
      // 2. Esperar a que se complete
      const resultado = await esperarJobCompleto(jobId);
      
      const tiempoTotal = Date.now() - startTime;
      
      console.log(`✅ ${estilo} EXITOSO en ${Math.round(tiempoTotal/1000)}s`);
      console.log(`   📹 Video URL: ${resultado.url || resultado.videoUrl}`);
      
      resultados.push({
        estilo,
        exitoso: true,
        jobId,
        videoUrl: resultado.url || resultado.videoUrl,
        tiempoGeneracion: tiempoTotal
      });
      
    } catch (error: any) {
      console.error(`❌ ${estilo} FALLÓ:`, error.message);
      
      resultados.push({
        estilo,
        exitoso: false,
        error: error.message
      });
    }
  }

  // Resumen final
  console.log('\n📊 RESUMEN FINAL DEL MVP');
  console.log('=========================');
  
  const exitosos = resultados.filter(r => r.exitoso).length;
  const fallidos = resultados.filter(r => !r.exitoso).length;
  
  console.log(`✅ Estilos exitosos: ${exitosos}/4`);
  console.log(`❌ Estilos fallidos: ${fallidos}/4`);
  
  if (exitosos === 4) {
    console.log('\n🎉 ¡MVP COMPLETAMENTE FUNCIONAL!');
    console.log('✅ Todos los estilos visuales generan videos exitosamente');
    console.log('\n📹 Videos generados:');
    resultados.filter(r => r.exitoso).forEach(r => {
      console.log(`   ${r.estilo}: ${r.videoUrl}`);
    });
  } else {
    console.log('\n⚠️ MVP REQUIERE CORRECCIONES');
    console.log('❌ Revisar errores antes de producción');
    
    if (fallidos > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      resultados.filter(r => !r.exitoso).forEach(r => {
        console.log(`   ${r.estilo}: ${r.error}`);
      });
    }
  }
}

/**
 * Test de un solo estilo específico
 */
export async function testearEstiloEspecifico(estilo: string): Promise<void> {
  const prompt = TEST_PROMPTS[estilo as keyof typeof TEST_PROMPTS];
  
  if (!prompt) {
    throw new Error(`Estilo '${estilo}' no soportado. Usar: cinematic, anime, cartoon, commercial`);
  }

  console.log(`🎬 Testing estilo específico: ${estilo.toUpperCase()}`);
  console.log(`📝 Prompt: ${prompt}`);
  
  const jobId = await enviarRenderRequest({
    prompt,
    duration: 10, // Solo 10 segundos para test rápido
    visualStyle: estilo
  });
  
  console.log(`🔑 Job ID: ${jobId}`);
  
  const resultado = await esperarJobCompleto(jobId);
  
  console.log(`✅ Video generado: ${resultado.url || resultado.videoUrl}`);
}

// Para ejecución directa
if (require.main === module) {
  testearTodosLosEstilos()
    .then(() => {
      console.log('\n✅ Test completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en test:', error);
      process.exit(1);
    });
}
