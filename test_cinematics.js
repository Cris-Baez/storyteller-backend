// Script de prueba rápida para diagnosticar errores en CinemaAI
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico CinemaAI - Verificando componentes...\n');

// 1. Verificar assets_index.json
console.log('1️⃣ Verificando assets_index.json...');
try {
  const assetsPath = path.join(process.cwd(), 'assets_index.json');
  const exists = fs.existsSync(assetsPath);
  console.log(`   - Archivo existe: ${exists}`);
  
  if (exists) {
    const content = fs.readFileSync(assetsPath, 'utf-8');
    const assets = JSON.parse(content);
    console.log(`   - Total assets: ${assets.length}`);
    
    // Contar actores
    const actores = assets.filter(asset => asset.ruta.includes('actores/'));
    console.log(`   - Actores encontrados: ${actores.length}`);
    
    if (actores.length > 0) {
      console.log(`   - Primer actor: ${actores[0].ruta}`);
    }
  }
} catch (error) {
  console.error('   ❌ Error:', error.message);
}

// 2. Verificar archivos TypeScript compilados
console.log('\n2️⃣ Verificando archivos compilados...');
const files = [
  'dist/services/assetManager.js',
  'dist/services/llmService/estilos/cinematic/orquestador.js',
  'dist/services/llmService/estilos/cinematic/arte.js',
  'dist/services/llmService/estilos/cinematic/actores.js'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   - ${file}: ${exists ? '✅' : '❌'}`);
});

// 3. Verificar estructura de directorios
console.log('\n3️⃣ Verificando estructura de directorios...');
const dirs = [
  'src/services/llmService/estilos/cinematic',
  'assets/escenas',
  'assets/actores'
];

dirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`   - ${dir}: ${exists ? '✅' : '❌'}`);
});

console.log('\n✅ Diagnóstico completado');
