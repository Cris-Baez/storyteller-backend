const fs = require('fs');
const path = require('path');

// Configuración del script
const EXCLUDE_DIRS = ['node_modules', '.git', 'Wav2Lip', 'SadTalker', 'Wan2.1', 'tmp', 'test', 'tests'];
const EXCLUDE_FILES = ['.cjs', '.mjs', '-test.', '.test.', '.spec.', 'list_files'];

function getAllTsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      // Filtrar directorios excluidos
      if (EXCLUDE_DIRS.some(exclude => file.includes(exclude))) {
        return;
      }
      
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          getAllTsFiles(filePath, fileList);
        } else if (file.endsWith('.ts') && !EXCLUDE_FILES.some(exclude => file.includes(exclude))) {
          fileList.push(filePath);
        }
      } catch (err) {
        // Skip inaccessible files
      }
    });
  } catch (err) {
    // Skip inaccessible directories
  }
  
  return fileList;
}

function readFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content || '// Archivo vacío';
  } catch (error) {
    return `// Error leyendo archivo: ${error.message}`;
  }
}

function generateMarkdownSection(filePath, content) {
  const relativePath = filePath.replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/'), '');
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  
  return `### 📂 ${cleanPath}

\`\`\`ts
${content}
\`\`\`

`;
}

// Obtener archivos TypeScript del proyecto
console.log('🔍 Buscando archivos TypeScript...');
const tsFiles = getAllTsFiles('./src');
const sortedFiles = tsFiles.sort();

console.log(`📁 Encontrados ${sortedFiles.length} archivos TypeScript`);

// Generar contenido del Markdown
let markdownContent = `# 🎬 CinemaAI Backend - Código Completo

Este archivo contiene todo el código del backend de CinemaAI, organizado alfabéticamente para análisis completo por ChatGPT.

## 📂 Estructura del Proyecto

\`\`\`
src/
├── config/          # Configuraciones del sistema
├── index.ts         # Punto de entrada principal
├── jobs/            # Sistema de colas de trabajo
├── pipelines/       # Pipelines de procesamiento
├── routes/          # Rutas de la API
├── scripts/         # Scripts de utilidades
├── services/        # Servicios del sistema
├── tests/           # Tests y verificaciones
├── types/           # Definiciones de tipos
└── utils/           # Utilidades generales
\`\`\`

## 📁 Archivos del Sistema

`;

// Procesar cada archivo
sortedFiles.forEach((filePath, index) => {
  console.log(`📄 Procesando ${index + 1}/${sortedFiles.length}: ${path.basename(filePath)}`);
  
  const content = readFileContent(filePath);
  markdownContent += generateMarkdownSection(filePath, content);
});

// Agregar archivos de configuración importantes
console.log('📋 Agregando archivos de configuración...');

// package.json
try {
  const packageJson = fs.readFileSync('./package.json', 'utf-8');
  markdownContent += `### 📂 package.json

\`\`\`json
${packageJson}
\`\`\`

`;
} catch (error) {
  console.log('⚠️ No se pudo leer package.json');
}

// tsconfig.json
try {
  const tsConfig = fs.readFileSync('./tsconfig.json', 'utf-8');
  markdownContent += `### 📂 tsconfig.json

\`\`\`json
${tsConfig}
\`\`\`

`;
} catch (error) {
  console.log('⚠️ No se pudo leer tsconfig.json');
}

// Escribir archivo final
console.log('💾 Escribiendo archivo CINEMAAI_FULLCODE.md...');
fs.writeFileSync('./CINEMAAI_FULLCODE_COMPLETE.md', markdownContent, 'utf-8');

console.log('✅ ¡Completado! El archivo CINEMAAI_FULLCODE_COMPLETE.md ha sido creado.');
console.log(`📊 Total de archivos procesados: ${sortedFiles.length}`);
console.log(`📝 Tamaño del archivo: ${Math.round(markdownContent.length / 1024)} KB`);
