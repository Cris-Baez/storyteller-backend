import fs from 'fs';

try {
  const assets = JSON.parse(fs.readFileSync('assets_index.json', 'utf8'));
  const nombreDuplicados = {};
  
  assets.forEach(asset => {
    if (nombreDuplicados[asset.nombre]) {
      nombreDuplicados[asset.nombre].push(asset.ruta);
    } else {
      nombreDuplicados[asset.nombre] = [asset.ruta];
    }
  });
  
  const duplicados = Object.entries(nombreDuplicados).filter(([_, rutas]) => rutas.length > 1);
  
  console.log('=== ASSETS CON NOMBRES DUPLICADOS ===');
  duplicados.slice(0, 5).forEach(([nombre, rutas]) => {
    console.log(`${nombre}: ${rutas.length} versiones`);
    rutas.forEach(ruta => console.log(`  - ${ruta}`));
    console.log('');
  });
  
  console.log(`Total duplicados: ${duplicados.length}/${Object.keys(nombreDuplicados).length}`);
  
  // Buscar específicamente lateral.png
  const laterales = assets.filter(a => a.nombre === 'lateral.png');
  console.log('\n=== ARCHIVOS lateral.png ===');
  laterales.forEach(asset => {
    console.log(`${asset.ruta} (${asset.estilo})`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
}
