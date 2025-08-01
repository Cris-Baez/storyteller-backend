const fs = require('fs');
const path = require('path');

function getAllTsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'Wav2Lip', 'SadTalker', 'Wan2.1', 'tmp'].includes(file)) {
          getAllTsFiles(filePath, fileList);
        } else if (file.endsWith('.ts')) {
          fileList.push(filePath);
        }
      } catch (err) {
        // Skip files that can't be accessed
      }
    });
  } catch (err) {
    // Skip directories that can't be accessed
  }
  
  return fileList;
}

const srcFiles = getAllTsFiles('./src');
const sortedFiles = srcFiles.sort();

console.log('=== ARCHIVOS TYPESCRIPT ENCONTRADOS ===');
sortedFiles.forEach(file => console.log(file.replace(/\\/g, '/')));
console.log(`\nTotal: ${sortedFiles.length} archivos`);
