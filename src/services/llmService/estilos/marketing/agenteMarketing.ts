/**
 * 🤖 AGENTE MARKETING PRINCIPAL - ROADMAP FASE 1.4
 * Orquestador completo que integra todos los cerebros de marketing
 */

import { analyzeBusinessFromImages } from './businessAnalyst.js';
import { createCompleteStrategy } from './contentStrategist.js';
import { convertirImagenesEstaticasADinamicas } from './creativeDirector.js';
import { generatePlatformSpecificCopy } from './copywriterPro.js';

// ✅ INTERFACES SEGÚN ROADMAP
export interface SolicitudCompleta {
  imagenes: string[];
  descripcionNegocio: string;
  plataformasObjetivo: string[];
  cantidadVideos: number;
}

export interface ResultadoCompleto {
  analisisNegocio: any;
  estrategiaContenido: any;
  conceptosVisuales: any[];
  copyProfesional: any[];
  planPosteo: any;
}

export interface PlanDistribucion {
  calendario: {
    fecha: string;
    plataforma: string;
    contenido: string;
    horario: string;
  }[];
  frecuencia: {
    instagram: number;
    linkedin: number;
    tiktok: number;
  };
  mejoresHorarios: {
    plataforma: string;
    horarios: string[];
  }[];
}

/**
 * 🎯 FUNCIÓN PRINCIPAL DEL ROADMAP - Procesar solicitud completa
 * Integra todos los cerebros: Analyst + Strategist + Director + Copywriter
 */
export async function procesarSolicitudCompleta(request: SolicitudCompleta): Promise<ResultadoCompleto> {
  console.log('[AGENTE MARKETING] 🚀 Iniciando proceso completo...');
  console.log(`[AGENTE MARKETING] Imágenes: ${request.imagenes.length}, Plataformas: ${request.plataformasObjetivo.join(', ')}`);

  try {
    // 1️⃣ ANALIZAR NEGOCIO DESDE IMÁGENES
    console.log('[AGENTE MARKETING] 🧠 Analizando negocio desde imágenes...');
    const analisisNegocio = await analyzeBusinessFromImages(request.imagenes, request.descripcionNegocio);
    
    // 2️⃣ CREAR ESTRATEGIA DE CONTENIDO  
    console.log('[AGENTE MARKETING] 📋 Creando estrategia de contenido...');
    const estrategiaContenido = await createCompleteStrategy(analisisNegocio);
    
    // 3️⃣ GENERAR CONCEPTOS VISUALES
    console.log('[AGENTE MARKETING] 🎨 Generando conceptos visuales...');
    const conceptosVisuales = await convertirImagenesEstaticasADinamicas(
      request.imagenes, 
      estrategiaContenido, 
      analisisNegocio
    );
    
    // 4️⃣ CREAR COPY PROFESIONAL
    console.log('[AGENTE MARKETING] ✍️ Generando copy profesional...');
    const copyProfesional = await generarCopyPorConcepto(conceptosVisuales, analisisNegocio, request.plataformasObjetivo);
    
    // 5️⃣ PLAN DE DISTRIBUCIÓN
    console.log('[AGENTE MARKETING] 📅 Creando plan de distribución...');
    const planPosteo = await crearPlanDistribucion(estrategiaContenido, request.plataformasObjetivo);
    
    console.log('[AGENTE MARKETING] ✅ Proceso completo finalizado exitosamente');
    
    return {
      analisisNegocio,
      estrategiaContenido,
      conceptosVisuales,
      copyProfesional,
      planPosteo
    };
    
  } catch (error: any) {
    console.error('[AGENTE MARKETING] ❌ Error en proceso completo:', error);
    throw new Error(`Agente Marketing failed: ${error.message}`);
  }
}

/**
 * 🎨 GENERAR COPY ESPECÍFICO POR CONCEPTO
 */
async function generarCopyPorConcepto(
  conceptos: any[], 
  analisis: any, 
  plataformas: string[]
): Promise<any[]> {
  const copyResults = [];
  
  for (let i = 0; i < conceptos.length; i++) {
    const concepto = conceptos[i];
    
    const copyData = {
      concepto: i + 1,
      copies: {} as any
    };
    
    // Generar copy para cada plataforma solicitada
    for (const plataforma of plataformas) {
      const copyRequest = {
        businessType: analisis.businessType,
        targetAudience: analisis.targetAudience?.demographic || 'professional',
        brandPersonality: analisis.brandPersonality,
        visualConcept: concepto.transformacionesImagen.movimientoCamara,
        platform: plataforma as 'instagram' | 'linkedin' | 'tiktok' | 'facebook' | 'twitter'
      };
      
      const platformCopy = await generatePlatformSpecificCopy(
        analisis,
        { videoTypes: { [concepto.transformacionesImagen.movimientoCamara]: 'dynamic concept' } },
        [plataforma]
      );
      copyData.copies[plataforma] = platformCopy;
    }
    
    copyResults.push(copyData);
  }
  
  return copyResults;
}

/**
 * 📅 CREAR PLAN DE DISTRIBUCIÓN
 */
async function crearPlanDistribucion(
  estrategia: any, 
  plataformas: string[]
): Promise<PlanDistribucion> {
  
  // Frecuencias recomendadas por plataforma
  const frecuenciaBase = {
    instagram: estrategia.recommendedFrequency?.instagram || 3,
    linkedin: estrategia.recommendedFrequency?.linkedin || 2,
    tiktok: estrategia.recommendedFrequency?.tiktok || 4
  };
  
  // Mejores horarios por plataforma
  const mejoresHorarios = [
    {
      plataforma: 'instagram',
      horarios: ['09:00', '14:00', '19:00']
    },
    {
      plataforma: 'linkedin', 
      horarios: ['08:00', '12:00', '17:00']
    },
    {
      plataforma: 'tiktok',
      horarios: ['18:00', '20:00', '22:00']
    }
  ];
  
  // Generar calendario para los próximos 7 días
  const calendario = [];
  const hoy = new Date();
  
  for (let dia = 0; dia < 7; dia++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + dia);
    
    for (const plataforma of plataformas) {
      const frecuencia = frecuenciaBase[plataforma as keyof typeof frecuenciaBase] || 1;
      const horarios = mejoresHorarios.find(h => h.plataforma === plataforma)?.horarios || ['12:00'];
      
      // Distribuir posts según frecuencia
      if (dia % Math.ceil(7 / frecuencia) === 0) {
        calendario.push({
          fecha: fecha.toISOString().split('T')[0],
          plataforma,
          contenido: `Video ${plataforma} - Concepto ${(dia % 3) + 1}`,
          horario: horarios[0]
        });
      }
    }
  }
  
  return {
    calendario,
    frecuencia: frecuenciaBase,
    mejoresHorarios
  };
}
