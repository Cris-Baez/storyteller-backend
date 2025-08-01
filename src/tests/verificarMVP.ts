// src/tests/verificarMVP.ts
// ⚠️ VERIFICACIÓN MANUAL DEL MVP - No es un test unitario
// Ejecuta renderCinemaAI directamente para cada estilo

import { renderCinemaAI } from '../pipelines/renderPipeline.js';

const ESTILOS = ['cinematic', 'anime', 'cartoon', 'commercial'];
const PROMPT_BASE = "Un joven samurái camina al atardecer por un templo japonés";

async function verificarEstilo(estilo: string) {
  console.log(`\n🎬 Verificando: ${estilo.toUpperCase()}`);
  
  try {
    const resultado = await renderCinemaAI({
      prompt: PROMPT_BASE,
      duration: 15,
      visualStyle: estilo as any,
      metadata: {}
    }, (step: string, progress: number) => {
      console.log(`   ${step}: ${progress}%`);
    });
    
    console.log(`✅ ${estilo} EXITOSO - URL: ${resultado.url}`);
    return true;
    
  } catch (error: any) {
    console.error(`❌ ${estilo} FALLÓ: ${error.message}`);
    return false;
  }
}

async function verificarTodos() {
  console.log('🚀 VERIFICACIÓN MVP - 4 ESTILOS');
  
  let exitosos = 0;
  for (const estilo of ESTILOS) {
    const ok = await verificarEstilo(estilo);
    if (ok) exitosos++;
  }
  
  console.log(`\n📊 RESULTADO: ${exitosos}/4 estilos funcionando`);
  
  if (exitosos === 4) {
    console.log('🎉 MVP COMPLETO Y FUNCIONAL');
  } else {
    console.log('⚠️ Revisar errores');
  }
}

export { verificarEstilo, verificarTodos };
