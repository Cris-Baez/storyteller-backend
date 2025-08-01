#!/usr/bin/env node

// src/scripts/renderTestLoop.ts - Loop de Pruebas Automatizado CinemaAI MVP

import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { VideoValidator } from '../utils/videoValidator.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  style: string;
  attempt: number;
  success: boolean;
  videoUrl?: string;
  error?: string;
  duration?: number;
  hasAudio?: boolean;
  validationErrors?: string[];
  timestamp: string;
}

interface StyleConfig {
  style: string;
  prompt: string;
  duration: number;
  maxAttempts: number;
}

const TEST_CONFIGS: StyleConfig[] = [
  {
    style: 'cinematic',
    prompt: 'Un joven samurái entra a un templo bajo la lluvia, la cámara se acerca lentamente mientras él mira hacia el horizonte',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  },
  {
    style: 'anime',
    prompt: 'Una chica anime camina por un jardín japonés lleno de flores de cerezo, el viento mueve suavemente su cabello',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  },
  {
    style: 'cartoon',
    prompt: 'Un personaje divertido cocina en una cocina colorida, salta de alegría cuando termina su receta',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  },
  {
    style: 'commercial',
    prompt: 'Un profesional presenta un producto en una oficina moderna, sonríe confiadamente mientras señala características',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  }
];

async function testStyle(config: StyleConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log(`\n🎬 INICIANDO TESTS PARA ESTILO: ${config.style.toUpperCase()}`);
  console.log(`Prompt: "${config.prompt}"`);
  console.log(`Duración: ${config.duration}s`);
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    console.log(`\n📸 Intento ${attempt}/${config.maxAttempts} para ${config.style}...`);
    
    const startTime = Date.now();
    
    try {
      const result = await renderCinemaAI({
        prompt: config.prompt,
        duration: config.duration as 30, // Type assertion para AllowedDuration
        visualStyle: config.style as any
      });
      
      const generationTime = Date.now() - startTime;
      
      if (result && result.url) {
        console.log(`✅ ${config.style} - Video generado en ${Math.round(generationTime/1000)}s`);
        console.log(`   Video URL: ${result.url}`);
        console.log(`   🔍 Validando video...`);
        
        // Validar el video generado
        const validation = await VideoValidator.validateVideo(result.url, config.duration);
        
        if (validation.valid) {
          console.log(`✅ ${config.style} - Intento ${attempt} COMPLETAMENTE EXITOSO`);
          console.log(`   Duración real: ${validation.duration}s`);
          console.log(`   Audio: ${validation.hasAudio ? 'Sí' : 'No'}`);
          
          results.push({
            style: config.style,
            attempt,
            success: true,
            videoUrl: result.url,
            duration: validation.duration,
            hasAudio: validation.hasAudio,
            timestamp: new Date().toISOString()
          });
          
          break;
        } else {
          console.log(`❌ ${config.style} - Video generado pero validación falló`);
          console.log(`   Errores: ${validation.errors.join(', ')}`);
          
          results.push({
            style: config.style,
            attempt,
            success: false,
            videoUrl: result.url,
            duration: validation.duration,
            hasAudio: validation.hasAudio,
            validationErrors: validation.errors,
            error: `Validación falló: ${validation.errors.join(', ')}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error('Video URL no válido o vacío');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.log(`❌ ${config.style} - Intento ${attempt} FALLÓ`);
      console.log(`   Error: ${errorMessage}`);
      console.log(`   Tiempo antes del fallo: ${Math.round(duration/1000)}s`);
      
      results.push({
        style: config.style,
        attempt,
        success: false,
        error: errorMessage,
        duration: Math.round(duration/1000),
        timestamp: new Date().toISOString()
      });
    }
    
    if (attempt < config.maxAttempts) {
      const waitTime = 10000 * attempt;
      console.log(`   Esperando ${waitTime/1000}s antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return results;
}

function generateReport(allResults: TestResult[]): void {
  const reportPath = join(process.cwd(), 'test_report.md');
  
  let report = `# 🎬 REPORTE DE TEST LOOP MVP - ESTILOS VISUALES

**Fecha:** ${new Date().toLocaleString()}
**Sistema:** CinemaAI MVP Backend
**Componentes probados:** Kling AI, Murf.ai, Assets CDN, Pipeline completo, Validación de video

---

## 📊 RESUMEN EJECUTIVO

`;

  const styleStats = TEST_CONFIGS.map(config => {
    const styleResults = allResults.filter(r => r.style === config.style);
    const successful = styleResults.find(r => r.success);
    const totalAttempts = styleResults.length;
    
    return {
      style: config.style,
      success: !!successful,
      attempts: totalAttempts,
      videoUrl: successful?.videoUrl,
      duration: successful?.duration,
      hasAudio: successful?.hasAudio,
      totalTime: styleResults.reduce((sum, r) => sum + (r.duration || 0), 0)
    };
  });

  const successfulStyles = styleStats.filter(s => s.success).length;
  const totalStyles = styleStats.length;
  const successRate = Math.round((successfulStyles / totalStyles) * 100);

  report += `| Estilo | Estado | Intentos | Duración | Audio | URL |\n`;
  report += `|--------|--------|----------|----------|-------|-----|\n`;

  styleStats.forEach(stat => {
    const status = stat.success ? '✅' : '❌';
    const duration = stat.duration ? `${stat.duration}s` : 'N/A';
    const audio = stat.hasAudio ? 'Sí' : 'No';
    const url = stat.videoUrl ? `[Ver video](${stat.videoUrl})` : 'N/A';
    
    report += `| ${stat.style} | ${status} | ${stat.attempts} | ${duration} | ${audio} | ${url} |\n`;
  });

  report += `\n**PORCENTAJE DE ÉXITO TOTAL: ${successRate}% (${successfulStyles}/${totalStyles})**\n\n`;

  report += `---\n\n## 📋 DETALLES POR ESTILO\n\n`;

  TEST_CONFIGS.forEach(config => {
    const styleResults = allResults.filter(r => r.style === config.style);
    const successful = styleResults.find(r => r.success);
    
    report += `### ${config.style.toUpperCase()}\n\n`;
    report += `**Prompt:** "${config.prompt}"\n`;
    report += `**Estado:** ${successful ? '✅ EXITOSO' : '❌ FALLÓ'}\n`;
    report += `**Intentos realizados:** ${styleResults.length}\n\n`;

    if (successful) {
      report += `**🎬 VIDEO GENERADO:**\n`;
      report += `- URL: ${successful.videoUrl}\n`;
      report += `- Duración: ${successful.duration}s\n`;
      report += `- Audio: ${successful.hasAudio ? 'Sí' : 'No'}\n`;
      report += `- Timestamp: ${successful.timestamp}\n\n`;
    }

    if (styleResults.length > 0) {
      report += `**📊 Historial de intentos:**\n`;
      styleResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        report += `${index + 1}. ${status} Intento ${result.attempt} (${result.timestamp})\n`;
        if (result.error) {
          report += `   Error: ${result.error}\n`;
        }
        if (result.validationErrors && result.validationErrors.length > 0) {
          report += `   Errores de validación: ${result.validationErrors.join(', ')}\n`;
        }
      });
      report += `\n`;
    }

    report += `---\n\n`;
  });

  report += `## 🔧 INFORMACIÓN TÉCNICA\n\n`;
  report += `- **Pipeline:** renderCinemaAI completo\n`;
  report += `- **Validación:** VideoValidator con ffprobe\n`;
  report += `- **Reintentos:** Hasta 3 por estilo\n`;
  report += `- **Tiempo de espera:** 10s entre reintentos\n`;
  report += `- **CDN:** Google Cloud Storage\n`;
  report += `- **Generado:** ${new Date().toISOString()}\n`;

  writeFileSync(reportPath, report, 'utf8');
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

async function runTestLoop(): Promise<void> {
  console.log('🚀 INICIANDO TEST LOOP COMPLETO PARA MVP');
  console.log('===========================================');
  
  const allResults: TestResult[] = [];
  
  for (const config of TEST_CONFIGS) {
    const styleResults = await testStyle(config);
    allResults.push(...styleResults);
  }
  
  generateReport(allResults);
  
  const successfulStyles = TEST_CONFIGS.filter(config => {
    const styleResults = allResults.filter(r => r.style === config.style);
    return styleResults.some(r => r.success);
  }).length;
  
  const totalStyles = TEST_CONFIGS.length;
  const successRate = Math.round((successfulStyles / totalStyles) * 100);
  
  console.log('\n🎯 RESUMEN FINAL:');
  console.log('==================');
  console.log(`✅ Estilos exitosos: ${successfulStyles}/${totalStyles}`);
  console.log(`📊 Porcentaje de éxito: ${successRate}%`);
  
  if (successfulStyles === totalStyles) {
    console.log('\n🎉 ¡TODOS LOS VIDEOS DEL MVP FUERON GENERADOS CON ÉXITO!');
    console.log('🎬 Estilos: Cinematic, Anime, Cartoon, Commercial');
    console.log('🎧 Todos tienen audio, duración mínima cumplida y están listos para revisión visual final');
    console.log('📁 Ver test_report.md y consola para detalles');
  } else {
    console.log('\n⚠️  Algunos estilos fallaron. Ver test_report.md para detalles.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTestLoop().catch(console.error);
}

export { runTestLoop, testStyle, generateReport };
