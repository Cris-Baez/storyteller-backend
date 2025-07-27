// ejemplo-integracion.ts - Ejemplo de Integración con Sistema Existente

import { dispatchCerebros, RequestGeneracion, EstiloVisual } from './dispatcher.js';

/**
 * Función adaptadora para integrar el nuevo sistema de cerebros
 * con el LLMService existente
 */
export async function generarPlanCerebros(
  prompt: string,
  duracion: number,
  estilo: EstiloVisual = 'cinematic'
): Promise<any> {
  
  console.log('[LLMService] Generando plan con sistema de cerebros...');
  
  const request: RequestGeneracion = {
    prompt,
    duracion,
    estilo
  };
  
  try {
    const resultado = await dispatchCerebros(request);
    
    if (resultado.success) {
      console.log(`[LLMService] Plan generado exitosamente - ${resultado.videoPlan.length} segundos`);
      
      // Adaptar formato al sistema existente
      return {
        success: true,
        timeline: resultado.videoPlan,
        metadata: {
          ...resultado.metadata,
          tiempoGeneracion: resultado.tiempoGeneracion
        },
        configuracion: resultado.configuracion,
        restricciones: resultado.restricciones
      };
    } else {
      console.error('[LLMService] Error en generación:', resultado.error);
      
      return {
        success: false,
        error: resultado.error,
        timeline: resultado.videoPlan, // Plan de emergencia
        metadata: resultado.metadata
      };
    }
    
  } catch (error) {
    console.error('[LLMService] Error crítico en cerebros:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timeline: [],
      metadata: {}
    };
  }
}

/**
 * Función de demostración que muestra las capacidades del sistema
 */
export async function demostrarCapacidades() {
  console.log('🧠 DEMOSTRACIÓN DEL SISTEMA DE CEREBROS CINEMATOGRÁFICOS');
  console.log('=' .repeat(60));
  
  const ejemplos = [
    {
      nombre: 'Drama Cinematográfico',
      prompt: 'Un padre abraza a su hija en el aeropuerto antes de su partida',
      duracion: 12,
      estilo: 'cinematic' as EstiloVisual
    },
    {
      nombre: 'Acción Épica',
      prompt: 'Un guerrero batalla contra un dragón en una montaña ardiente',
      duracion: 8,
      estilo: 'cinematic' as EstiloVisual
    },
    {
      nombre: 'Misterio Nocturno',
      prompt: 'Un detective investiga una escena del crimen bajo la lluvia',
      duracion: 15,
      estilo: 'cinematic' as EstiloVisual
    }
  ];
  
  for (const ejemplo of ejemplos) {
    console.log(`\n🎬 ${ejemplo.nombre}`);
    console.log(`📝 "${ejemplo.prompt}"`);
    console.log(`⏱️ ${ejemplo.duracion} segundos - Estilo: ${ejemplo.estilo}`);
    
    try {
      const plan = await generarPlanCerebros(
        ejemplo.prompt,
        ejemplo.duracion,
        ejemplo.estilo
      );
      
      if (plan.success) {
        console.log(`✅ Generado: ${plan.timeline.length} segundos`);
        console.log(`📊 Actos: ${plan.metadata.actos}, Momentos emocionales: ${plan.metadata.momentosEmocionales?.length || 0}`);
        
        // Mostrar estructura narrativa
        const estructura = analizarEstructuraNarrativa(plan.timeline);
        console.log(`📖 Estructura: ${estructura.setup}s setup → ${estructura.desarrollo}s desarrollo → ${estructura.climax}s climax → ${estructura.cierre}s cierre`);
      } else {
        console.log(`❌ Error: ${plan.error}`);
      }
      
    } catch (error) {
      console.error(`💥 Error: ${error}`);
    }
  }
  
  console.log('\n🎯 Demostración completada');
}

function analizarEstructuraNarrativa(timeline: any[]): any {
  const estructura = {
    setup: 0,
    desarrollo: 0,
    climax: 0,
    cierre: 0
  };
  
  timeline.forEach(segundo => {
    if (segundo.momentoNarrativo in estructura) {
      estructura[segundo.momentoNarrativo as keyof typeof estructura]++;
    }
  });
  
  return estructura;
}

/**
 * Función para analizar la calidad del plan generado
 */
export function analizarCalidadPlan(plan: any): any {
  const analisis = {
    puntuacion: 0,
    aspectos: {
      continuidadNarrativa: 0,
      variacionVisual: 0,
      fluidezEdicion: 0,
      coherenciaEmocional: 0,
      calidadTecnica: 0
    },
    recomendaciones: [] as string[]
  };
  
  if (!plan.timeline || plan.timeline.length === 0) {
    analisis.recomendaciones.push('Timeline vacío o inválido');
    return analisis;
  }
  
  // Analizar continuidad narrativa
  const momentos = plan.timeline.map((s: any) => s.momentoNarrativo);
  const tieneSetup = momentos.includes('setup');
  const tieneClimax = momentos.includes('climax');
  const tieneCierre = momentos.includes('cierre');
  
  analisis.aspectos.continuidadNarrativa = (tieneSetup ? 25 : 0) + (tieneClimax ? 25 : 0) + (tieneCierre ? 25 : 0) + 25;
  
  // Analizar variación visual
  const shots = [...new Set(plan.timeline.map((s: any) => s.camara?.shot))];
  const movements = [...new Set(plan.timeline.map((s: any) => s.camara?.movement))];
  analisis.aspectos.variacionVisual = Math.min(100, (shots.length * 20) + (movements.length * 10));
  
  // Analizar fluidez de edición
  let transicionesNaturales = 0;
  for (let i = 1; i < plan.timeline.length; i++) {
    const anterior = plan.timeline[i - 1];
    const actual = plan.timeline[i];
    
    if (anterior.carryover || actual.edicion?.tipoCorte !== 'cut') {
      transicionesNaturales++;
    }
  }
  analisis.aspectos.fluidezEdicion = Math.min(100, (transicionesNaturales / plan.timeline.length) * 100);
  
  // Analizar coherencia emocional
  const momentosEmocionales = plan.timeline.filter((s: any) => s.esEmocional).length;
  const proporcionEmocional = momentosEmocionales / plan.timeline.length;
  analisis.aspectos.coherenciaEmocional = proporcionEmocional > 0.1 && proporcionEmocional < 0.4 ? 100 : 50;
  
  // Analizar calidad técnica
  const tieneConfiguracionCompleta = plan.timeline.every((s: any) => 
    s.fondo && s.actor && s.camara && s.sonido && s.edicion
  );
  analisis.aspectos.calidadTecnica = tieneConfiguracionCompleta ? 100 : 50;
  
  // Calcular puntuación total
  const valores = Object.values(analisis.aspectos);
  analisis.puntuacion = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  
  // Generar recomendaciones
  if (analisis.aspectos.continuidadNarrativa < 75) {
    analisis.recomendaciones.push('Mejorar estructura narrativa (setup, climax, cierre)');
  }
  if (analisis.aspectos.variacionVisual < 60) {
    analisis.recomendaciones.push('Aumentar variedad de shots y movimientos de cámara');
  }
  if (analisis.aspectos.fluidezEdicion < 70) {
    analisis.recomendaciones.push('Mejorar transiciones y continuidad visual');
  }
  
  return analisis;
}

// Para pruebas directas
if (import.meta.url === `file://${process.argv[1]}`) {
  demostrarCapacidades().catch(console.error);
}
