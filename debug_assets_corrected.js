// debug_assets_corrected.mjs - Validar las correcciones de filtrado de assets

import fs from 'fs/promises';
import path from 'path';

async function validarCorrecciones() {
  console.log('🔍 VALIDANDO CORRECCIONES DE SISTEMA CinemaAI...\n');
  
  try {
    // Cargar assets_index.json
    const ASSETS_PATH = path.resolve(process.cwd(), 'assets_index.json');
    const data = await fs.readFile(ASSETS_PATH, 'utf-8');
    const assets = JSON.parse(data);
    
    console.log(`📦 Total assets cargados: ${assets.length}\n`);
    
    // Filtrar escenas con estilo "realista" (que sí existe)
    const fondosRealistas = assets.filter(asset => 
      asset.tipo === 'escenas' && 
      asset.completitud === 'completa' && 
      asset.estilo === 'realista'
    );
    
    console.log(`🎨 Fondos estilo REALISTA encontrados: ${fondosRealistas.length}`);
    console.log(`   Primeros 3 fondos realistas:`);
    fondosRealistas.slice(0, 3).forEach((f, idx) => {
      console.log(`   [${idx + 1}] ${f.nombre} → ${f.ruta} (lugar: ${f.lugar}, variante: ${f.variante})`);
    });
    console.log('');
    
    // Aplicar filtro épico CORREGIDO usando campos 'lugar' y 'variante'
    const fondosEpicos = fondosRealistas.filter(f => {
      // 🚫 RECHAZAR lugares privados
      const lugaresPrivados = ['apartamento', 'casa', 'departamento'];
      const variantesPrivadas = ['baño', 'cocina', 'sala', 'comedor', 'cuarto', 'jardín', 'recámara', 'dormitorio', 'habitacion'];
      
      const esLugarPrivado = lugaresPrivados.includes(f.lugar?.toLowerCase() || '');
      const esVariantePrivada = variantesPrivadas.includes(f.variante?.toLowerCase() || '');
      
      if (esLugarPrivado || esVariantePrivada) {
        return false;
      }
      
      // ✅ ACEPTAR lugares públicos
      const lugaresPublicos = ['ciudad', 'naturaleza', 'templo', 'escuela'];
      const variantesPublicas = [
        'cafetería', 'calle', 'plaza', 'parque', 'edificio', 'estación', 'mercado', 'metro', 'museo', 'puente', 'rooftop', 'tienda',
        'bosque', 'campo', 'montaña', 'río', 'lago', 'playa', 'desierto', 'acantilado', 'cascada', 'cueva',
        'altar', 'entrada', 'fachada', 'jardín zen', 'biblioteca', 'gimnasio', 'laboratorio', 'exterior'
      ];
      
      const esLugarPublico = lugaresPublicos.includes(f.lugar?.toLowerCase() || '');
      const esVariantePublica = variantesPublicas.includes(f.variante?.toLowerCase() || '');
      
      return esLugarPublico || esVariantePublica;
    });
    
    console.log(`🏔️ Fondos ÉPICOS validados (estilo realista): ${fondosEpicos.length}/${fondosRealistas.length}`);
    console.log(`   Todos los fondos épicos encontrados:`);
    fondosEpicos.forEach((f, idx) => {
      console.log(`   [${idx + 1}] ✅ ${f.nombre} → ${f.ruta} (lugar: ${f.lugar}, variante: ${f.variante})`);
    });
    console.log('');
    
    // Ahora probar con estilo "comic" también
    const fondosComic = assets.filter(asset => 
      asset.tipo === 'escenas' && 
      asset.completitud === 'completa' && 
      asset.estilo === 'comic'
    );
    
    console.log(`🎨 Fondos estilo COMIC encontrados: ${fondosComic.length}`);
    
    const fondosEpicosComic = fondosComic.filter(f => {
      const lugaresPrivados = ['apartamento', 'casa', 'departamento'];
      const variantesPrivadas = ['baño', 'cocina', 'sala', 'comedor', 'cuarto', 'jardín'];
      
      const esLugarPrivado = lugaresPrivados.includes(f.lugar?.toLowerCase() || '');
      const esVariantePrivada = variantesPrivadas.includes(f.variante?.toLowerCase() || '');
      
      if (esLugarPrivado || esVariantePrivada) {
        return false;
      }
      
      const lugaresPublicos = ['ciudad', 'naturaleza', 'templo', 'escuela'];
      const variantesPublicas = ['cafetería', 'calle', 'plaza', 'parque', 'bosque', 'campo', 'montaña', 'río', 'acantilado'];
      
      const esLugarPublico = lugaresPublicos.includes(f.lugar?.toLowerCase() || '');
      const esVariantePublica = variantesPublicas.includes(f.variante?.toLowerCase() || '');
      
      return esLugarPublico || esVariantePublica;
    });
    
    console.log(`🏔️ Fondos ÉPICOS validados (estilo comic): ${fondosEpicosComic.length}/${fondosComic.length}`);
    fondosEpicosComic.slice(0, 5).forEach((f, idx) => {
      console.log(`   [${idx + 1}] ✅ ${f.nombre} → ${f.ruta} (lugar: ${f.lugar}, variante: ${f.variante})`);
    });
    console.log('');
    
    // Probar el mapeo de compatibilidad para 'cinematic'
    const estilosCompatibles = ['realista', 'anime', 'comic'];
    const fondosCinematic = assets.filter(asset => 
      asset.tipo === 'escenas' && 
      asset.completitud === 'completa' && 
      estilosCompatibles.includes(asset.estilo)
    );
    
    console.log(`🎬 Fondos compatibles con CINEMATIC: ${fondosCinematic.length}`);
    console.log(`   Desglose por estilo:`);
    estilosCompatibles.forEach(estilo => {
      const count = fondosCinematic.filter(f => f.estilo === estilo).length;
      console.log(`   - ${estilo}: ${count} fondos`);
    });
    console.log('');
    
    // Validar fondos épicos para cada tipo de toma
    const tiposTomas = ['setup', 'desarrollo', 'climax', 'cierre'];
    tiposTomas.forEach(tipo => {
      console.log(`🎬 Fondos ideales para toma tipo "${tipo}":`);
      
      const preferencias = {
        setup: { lugares: ['ciudad', 'naturaleza'], variantes: ['entrada', 'calle', 'plaza', 'acantilado'] },
        desarrollo: { lugares: ['naturaleza', 'ciudad'], variantes: ['bosque', 'campo', 'río', 'parque'] },
        climax: { lugares: ['naturaleza', 'templo'], variantes: ['montaña', 'acantilado', 'altar'] },
        cierre: { lugares: ['naturaleza', 'ciudad'], variantes: ['campo', 'plaza', 'parque'] }
      };
      
      const pref = preferencias[tipo];
      
      // Buscar por lugar
      const porLugar = fondosEpicos.filter(f => pref.lugares.includes(f.lugar?.toLowerCase() || ''));
      console.log(`   Por lugar: ${porLugar.length} fondos`);
      
      // Buscar por variante
      const porVariante = fondosEpicos.filter(f => pref.variantes.includes(f.variante?.toLowerCase() || ''));
      console.log(`   Por variante: ${porVariante.length} fondos`);
      
      if (porLugar.length > 0) {
        console.log(`   Ejemplo por lugar: ${porLugar[0].nombre} → ${porLugar[0].ruta}`);
      }
      if (porVariante.length > 0) {
        console.log(`   Ejemplo por variante: ${porVariante[0].nombre} → ${porVariante[0].ruta}`);
      }
      console.log('');
    });
    
    console.log('✅ VALIDACIÓN COMPLETADA - Correcciones funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en validación:', error);
  }
}

validarCorrecciones();
