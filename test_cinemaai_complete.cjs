// Test completo y exhaustivo del sistema CinemaAI
// Analiza cada componente según el flujo especificado por Cris

const fs = require('fs');
const path = require('path');

class CinemaAITester {
  constructor() {
    this.results = {
      assets: {},
      interfaces: {},
      flow: {},
      errors: [],
      warnings: [],
      success: []
    };
  }

  async runCompleteTest() {
    console.log('🧪 INICIANDO TEST COMPLETO DE CINEMAAI');
    console.log('=====================================');
    console.log('Basado en especificación del flujo de Cris\n');

    await this.testAssets();
    await this.testInterfaces();
    await this.testFlowLogic();
    await this.testIntegration();
    
    this.generateReport();
  }

  async testAssets() {
    console.log('📦 FASE 1: TESTING ASSETS DEL CDN');
    console.log('=================================');

    try {
      const assetsPath = path.join(process.cwd(), 'assets_index.json');
      
      if (!fs.existsSync(assetsPath)) {
        this.results.errors.push('assets_index.json no encontrado');
        return;
      }

      const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
      console.log(`📊 Total assets cargados: ${assets.length}`);

      // Analizar fondos
      const fondos = assets.filter(a => !a.ruta.includes('/actores/'));
      const actores = assets.filter(a => a.ruta.includes('/actores/'));
      
      console.log(`🖼️ Fondos disponibles: ${fondos.length}`);
      console.log(`🧍 Actores disponibles: ${actores.length}`);

      // Análisis de lugares
      const lugares = [...new Set(fondos.map(f => f.lugar).filter(Boolean))];
      console.log(`📍 Lugares únicos: ${lugares.join(', ')}`);

      // Verificar fondos problemáticos vs épicos
      const apartamentos = fondos.filter(f => f.lugar === 'apartamento');
      const naturaleza = fondos.filter(f => f.lugar === 'naturaleza');
      const ciudad = fondos.filter(f => f.lugar === 'ciudad');
      
      console.log('\n🔍 ANÁLISIS CRÍTICO:');
      console.log(`Apartamentos: ${apartamentos.length}`);
      console.log(`Naturaleza: ${naturaleza.length}`);
      console.log(`Ciudad: ${ciudad.length}`);

      this.results.assets = {
        total: assets.length,
        fondos: fondos.length,
        actores: actores.length,
        lugares: lugares.length,
        apartamentos: apartamentos.length,
        naturaleza: naturaleza.length,
        ciudad: ciudad.length
      };

      if (naturaleza.length + ciudad.length > apartamentos.length) {
        this.results.success.push('✅ Suficientes fondos épicos para aventuras');
      } else {
        this.results.warnings.push('⚠️ Pocos fondos épicos comparado con apartamentos');
      }

    } catch (error) {
      this.results.errors.push(`Error en test de assets: ${error.message}`);
    }
  }

  async testInterfaces() {
    console.log('\n🔧 FASE 2: TESTING INTERFACES TYPESCRIPT');
    console.log('=======================================');

    try {
      // Verificar que director.ts tiene la interfaz correcta
      const directorPath = path.join(process.cwd(), 'src/services/llmService/estilos/cinematic/director.ts');
      
      if (!fs.existsSync(directorPath)) {
        this.results.errors.push('director.ts no encontrado');
        return;
      }

      const directorContent = fs.readFileSync(directorPath, 'utf-8');
      
      // Verificar campos obligatorios en TomaCinematograficaPlan
      const requiredFields = ['fondo', 'actor', 'vozMurf', 'musica', 'efectosSonoros', 'carryover'];
      const interfaceMatch = directorContent.match(/export interface TomaCinematograficaPlan\s*{([^}]+)}/s);
      
      if (interfaceMatch) {
        const interfaceBody = interfaceMatch[1];
        console.log('🔍 Verificando TomaCinematograficaPlan...');
        
        let missingFields = [];
        let optionalFields = [];
        
        for (const field of requiredFields) {
          if (!interfaceBody.includes(field)) {
            missingFields.push(field);
          } else if (interfaceBody.includes(`${field}?`)) {
            optionalFields.push(field);
          }
        }
        
        if (missingFields.length > 0) {
          this.results.errors.push(`Campos faltantes en TomaCinematograficaPlan: ${missingFields.join(', ')}`);
        }
        
        if (optionalFields.length > 0) {
          this.results.warnings.push(`Campos opcionales que deberían ser obligatorios: ${optionalFields.join(', ')}`);
        } else {
          this.results.success.push('✅ Todos los campos de TomaCinematograficaPlan son obligatorios');
        }
      }

      // Verificar orquestador
      const orquestadorPath = path.join(process.cwd(), 'src/services/llmService/estilos/cinematic/orquestador.ts');
      
      if (fs.existsSync(orquestadorPath)) {
        const orquestadorContent = fs.readFileSync(orquestadorPath, 'utf-8');
        
        // Verificar que procesa por tomas
        if (orquestadorContent.includes('tomasPlanificadas') && orquestadorContent.includes('📸 TOMA')) {
          this.results.success.push('✅ Orquestador procesa por tomas');
        } else {
          this.results.errors.push('❌ Orquestador no procesa por tomas correctamente');
        }
        
        // Verificar que pasa información completa a cerebros
        if (orquestadorContent.includes('toma // ✅ PASAR INFORMACIÓN COMPLETA')) {
          this.results.success.push('✅ Orquestador pasa información completa a cerebros');
        } else {
          this.results.warnings.push('⚠️ Verificar si orquestador pasa toma completa a cerebros');
        }
      }

    } catch (error) {
      this.results.errors.push(`Error en test de interfaces: ${error.message}`);
    }
  }

  async testFlowLogic() {
    console.log('\n⚙️ FASE 3: TESTING LÓGICA DE FLUJO');
    console.log('=================================');

    try {
      // Verificar AssetManager
      const assetManagerPath = path.join(process.cwd(), 'src/services/assetManager.ts');
      
      if (fs.existsSync(assetManagerPath)) {
        const assetManagerContent = fs.readFileSync(assetManagerPath, 'utf-8');
        
        if (assetManagerContent.includes('obtenerFondosPorEstilo')) {
          this.results.success.push('✅ AssetManager implementado');
        } else {
          this.results.errors.push('❌ AssetManager no tiene obtenerFondosPorEstilo');
        }
      } else {
        this.results.errors.push('❌ AssetManager no encontrado');
      }

      // Verificar cerebro de arte
      const artePath = path.join(process.cwd(), 'src/services/llmService/estilos/cinematic/arte.ts');
      
      if (fs.existsSync(artePath)) {
        const arteContent = fs.readFileSync(artePath, 'utf-8');
        
        // Verificar que tiene lógica para aventuras épicas
        if (arteContent.includes('AVENTURA ÉPICA') || arteContent.includes('aventura') && arteContent.includes('épica')) {
          this.results.success.push('✅ Cerebro de arte tiene lógica para aventuras épicas');
        } else {
          this.results.warnings.push('⚠️ Cerebro de arte podría necesitar lógica específica para aventuras');
        }
        
        // Verificar que recibe información de toma
        if (arteContent.includes('tomaInfo')) {
          this.results.success.push('✅ Cerebro de arte recibe información de toma');
        } else {
          this.results.errors.push('❌ Cerebro de arte no recibe información de toma');
        }
      }

    } catch (error) {
      this.results.errors.push(`Error en test de lógica: ${error.message}`);
    }
  }

  async testIntegration() {
    console.log('\n🔗 FASE 4: TESTING INTEGRACIÓN COMPLETA');
    console.log('======================================');

    try {
      // Simular el flujo completo
      console.log('🎬 Simulando flujo para "aventura épica"...');
      
      // Verificar que dispatcher existe
      const dispatcherPath = path.join(process.cwd(), 'src/services/llmService/dispatcher.ts');
      
      if (fs.existsSync(dispatcherPath)) {
        this.results.success.push('✅ Dispatcher encontrado');
        
        const dispatcherContent = fs.readFileSync(dispatcherPath, 'utf-8');
        
        if (dispatcherContent.includes('orquestarEquipoCinematico')) {
          this.results.success.push('✅ Dispatcher integrado con orquestador cinematográfico');
        } else {
          this.results.errors.push('❌ Dispatcher no integrado con orquestador');
        }
      } else {
        this.results.errors.push('❌ Dispatcher no encontrado');
      }
      
      // Verificar compilación TypeScript
      console.log('🔧 Verificando compilación...');
      // Esto se haría con el comando de build en la siguiente fase

    } catch (error) {
      this.results.errors.push(`Error en test de integración: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📋 REPORTE FINAL DE TESTING');
    console.log('===========================');
    
    console.log('\n✅ ÉXITOS:');
    this.results.success.forEach(msg => console.log(`  ${msg}`));
    
    console.log('\n⚠️ ADVERTENCIAS:');
    this.results.warnings.forEach(msg => console.log(`  ${msg}`));
    
    console.log('\n❌ ERRORES:');
    this.results.errors.forEach(msg => console.log(`  ${msg}`));
    
    console.log('\n📊 RESUMEN DE ASSETS:');
    if (this.results.assets.total) {
      console.log(`  Total assets: ${this.results.assets.total}`);
      console.log(`  Fondos disponibles: ${this.results.assets.fondos}`);
      console.log(`  Lugares únicos: ${this.results.assets.lugares}`);
      console.log(`  Fondos épicos (naturaleza + ciudad): ${this.results.assets.naturaleza + this.results.assets.ciudad}`);
      console.log(`  Fondos domésticos (apartamentos): ${this.results.assets.apartamentos}`);
    }
    
    const totalIssues = this.results.errors.length + this.results.warnings.length;
    const totalSuccess = this.results.success.length;
    
    console.log('\n🎯 EVALUACIÓN FINAL:');
    if (this.results.errors.length === 0) {
      console.log('✅ SISTEMA LISTO - No hay errores críticos');
    } else {
      console.log(`❌ SISTEMA NECESITA FIXES - ${this.results.errors.length} errores críticos`);
    }
    
    console.log(`📈 Score: ${totalSuccess}/${totalSuccess + totalIssues} componentes OK`);
    
    return {
      ready: this.results.errors.length === 0,
      score: totalSuccess / (totalSuccess + totalIssues),
      issues: totalIssues,
      successes: totalSuccess
    };
  }
}

// Ejecutar test
async function runTest() {
  const tester = new CinemaAITester();
  const result = await tester.runCompleteTest();
  
  if (result.ready) {
    console.log('\n🚀 SISTEMA LISTO PARA PRUEBAS EN VIVO');
  } else {
    console.log('\n🔧 SISTEMA NECESITA CORRECCIONES ANTES DE USAR');
  }
  
  return result;
}

runTest().catch(console.error);
