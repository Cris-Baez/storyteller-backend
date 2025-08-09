import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 📁 INDEXADOR DE ASSETS PARA CDN
 * 
 * Este script escanea la carpeta /assets y genera/actualiza el assets_index.json
 * que es usado por CinemaAI para conocer todos los assets disponibles.
 * 
 * Estructura esperada:
 * assets/
 *   ├── escenas/
 *   │   ├── [estilo]/
 *   │   │   ├── [lugar]/
 *   │   │   │   ├── [variante]/
 *   │   │   │   │   ├── [ambiente]/
 *   │   │   │   │   │   ├── [angulo].png
 *   ├── actores/
 *   │   ├── [estilo]/
 *   │   │   ├── [lugar]/
 *   │   │   │   ├── [variante]/
 *   │   │   │   │   ├── [ambiente]/
 *   │   │   │   │   │   ├── [personaje].png
 *   └── branding/
 *       ├── watermark_free.png
 */

const ASSETS_DIR = path.join(__dirname, 'assets');
const OUTPUT_FILE = path.join(__dirname, 'assets_index.json');

// Estilos soportados
const ESTILOS = ['anime', 'comic', 'cinematic', 'realistic'];

// Lugares comunes
const LUGARES = ['apartamento', 'casa', 'oficina', 'exterior', 'parque', 'calle', 'restaurant'];

// Variantes por lugar
const VARIANTES = {
  'apartamento': ['cocina', 'sala', 'baño', 'dormitorio'],
  'casa': ['cocina', 'sala', 'baño', 'dormitorio', 'estudio', 'jardín'],
  'oficina': ['recepcion', 'sala_juntas', 'cubiculos', 'despacho'],
  'exterior': ['parque', 'calle', 'plaza', 'campo'],
};

// Ambientes
const AMBIENTES = ['día', 'noche', 'atardecer'];

// Ángulos
const ANGULOS = ['frontal', 'lateral', 'aerea', 'diagonal'];

/**
 * 🔍 Escanea una carpeta recursivamente
 */
async function escanearCarpeta(dirPath, relativePath = '') {
  const assets = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const relativeItemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
      
      if (item.isDirectory()) {
        // Escanear subcarpeta recursivamente
        const subAssets = await escanearCarpeta(itemPath, relativeItemPath);
        assets.push(...subAssets);
      } else if (item.isFile() && /\.(png|jpg|jpeg|gif|webp)$/i.test(item.name)) {
        // Es un archivo de imagen
        const stats = await fs.stat(itemPath);
        const assetInfo = analizarRutaAsset(relativeItemPath, stats);
        
        if (assetInfo) {
          assets.push(assetInfo);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  No se pudo escanear ${dirPath}: ${error.message}`);
  }
  
  return assets;
}

/**
 * 🔍 Analiza la ruta de un asset y extrae información
 */
function analizarRutaAsset(rutaRelativa, stats) {
  const partes = rutaRelativa.split('/');
  const nombreArchivo = partes[partes.length - 1];
  const nombreSinExtension = path.parse(nombreArchivo).name;
  
  // Determinar tipo de asset
  let tipo = 'otros';
  if (rutaRelativa.startsWith('escenas/')) {
    tipo = 'escenas';
  } else if (rutaRelativa.startsWith('actores/')) {
    tipo = 'actores';
  } else if (rutaRelativa.startsWith('branding/')) {
    tipo = 'branding';
  }
  
  const assetBase = {
    tipo,
    ruta: rutaRelativa,
    nombre: nombreArchivo,
    completitud: 'completa',
    size: stats.size,
    fecha: stats.mtime.toISOString()
  };
  
  // Análisis específico por tipo
  if (tipo === 'escenas' && partes.length >= 6) {
    // escenas/[estilo]/[lugar]/[variante]/[ambiente]/[angulo].ext
    const [, estilo, lugar, variante, ambiente] = partes;
    
    return {
      ...assetBase,
      estilo: estilo || 'anime',
      lugar: lugar || 'apartamento',
      variante: variante || 'cocina',
      ambiente: ambiente || 'día',
      angulo: nombreArchivo
    };
  } else if (tipo === 'actores' && partes.length >= 6) {
    // actores/[estilo]/[lugar]/[variante]/[ambiente]/[personaje].ext
    const [, estilo, lugar, variante, ambiente] = partes;
    
    return {
      ...assetBase,
      estilo: estilo || 'anime',
      lugar: lugar || 'casa',
      variante: variante || 'cocina',
      ambiente: ambiente || 'día',
      personaje: nombreSinExtension
    };
  } else if (tipo === 'branding') {
    return {
      ...assetBase,
      categoria: 'marca'
    };
  }
  
  // Asset genérico
  return assetBase;
}

/**
 * 🎯 Genera assets faltantes virtualmente
 * 
 * Si no existen assets físicos, genera entradas virtuales
 * para que CinemaAI tenga algo con qué trabajar
 */
function generarAssetsVirtuales() {
  const assetsVirtuales = [];
  
  // Generar escenas virtuales
  for (const estilo of ESTILOS) {
    for (const lugar of LUGARES) {
      const variantes = VARIANTES[lugar] || ['general'];
      
      for (const variante of variantes) {
        for (const ambiente of AMBIENTES) {
          for (const angulo of ANGULOS) {
            assetsVirtuales.push({
              tipo: 'escenas',
              ruta: `escenas/${estilo}/${lugar}/${variante}/${ambiente}/${angulo}.png`,
              nombre: `${angulo}.png`,
              completitud: 'virtual',
              estilo,
              lugar,
              variante,
              ambiente,
              angulo: `${angulo}.png`,
              size: 0,
              fecha: new Date().toISOString()
            });
          }
        }
      }
    }
  }
  
  // Generar actores virtuales
  const personajes = [
    'joven', 'adulto', 'mayor', 'niño', 'niña',
    'jovenmasculino', 'jovenfemenino', 'adultoformal',
    'jovenmasculinotristeformal', 'jovenanime'
  ];
  
  for (const estilo of ESTILOS) {
    for (const lugar of LUGARES) {
      const variantes = VARIANTES[lugar] || ['general'];
      
      for (const variante of variantes) {
        for (const ambiente of AMBIENTES) {
          for (const personaje of personajes) {
            assetsVirtuales.push({
              tipo: 'actores',
              ruta: `actores/${estilo}/${lugar}/${variante}/${ambiente}/${personaje}.png`,
              nombre: `${personaje}.png`,
              completitud: 'virtual',
              estilo,
              lugar,
              variante,
              ambiente,
              personaje,
              size: 0,
              fecha: new Date().toISOString()
            });
          }
        }
      }
    }
  }
  
  return assetsVirtuales;
}

/**
 * 🚀 FUNCIÓN PRINCIPAL
 */
async function indexarAssets() {
  console.log('🔍 Iniciando indexación de assets...');
  
  try {
    // 1. Escanear assets físicos
    console.log('📁 Escaneando carpeta assets...');
    let assetsReales = [];
    
    try {
      assetsReales = await escanearCarpeta(ASSETS_DIR);
      console.log(`✅ Encontrados ${assetsReales.length} assets físicos`);
    } catch (error) {
      console.log('⚠️  Carpeta assets no encontrada, usando solo assets virtuales');
    }
    
    // 2. Generar assets virtuales
    console.log('🎭 Generando assets virtuales...');
    const assetsVirtuales = generarAssetsVirtuales();
    console.log(`✅ Generados ${assetsVirtuales.length} assets virtuales`);
    
    // 3. Combinar assets (priorizando los reales)
    const todosLosAssets = [...assetsReales, ...assetsVirtuales];
    
    // 4. Eliminar duplicados (los reales tienen prioridad)
    const assetsUnicos = [];
    const rutasExistentes = new Set();
    
    for (const asset of todosLosAssets) {
      if (!rutasExistentes.has(asset.ruta)) {
        rutasExistentes.add(asset.ruta);
        assetsUnicos.push(asset);
      }
    }
    
    console.log(`📦 Total de assets únicos: ${assetsUnicos.length}`);
    
    // 5. Guardar índice
    console.log('💾 Guardando assets_index.json...');
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(assetsUnicos, null, 2), 'utf-8');
    
    console.log('🎉 ¡Indexación completada exitosamente!');
    console.log(`📄 Archivo generado: ${OUTPUT_FILE}`);
    console.log(`📊 Assets totales: ${assetsUnicos.length}`);
    console.log(`🏠 Assets físicos: ${assetsReales.length}`);
    console.log(`🎭 Assets virtuales: ${assetsVirtuales.length}`);
    
  } catch (error) {
    console.error('❌ Error durante la indexación:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  indexarAssets();
}

export { indexarAssets, escanearCarpeta, analizarRutaAsset };
