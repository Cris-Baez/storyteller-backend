// test_fix_aventura_epica.cjs - Test específico para el problema de aventura épica

const axios = require('axios');

async function testAventuraEpica() {
  console.log('🚀 INICIANDO TEST: Aventura Épica');
  console.log('=================================');
  
  try {
    const response = await axios.post('http://localhost:3000/api/render', {
      prompt: 'Quiero un video de un hombre en una aventura épica en la naturaleza',
      visualStyle: 'cinematic',
      duration: 6
    });
    
    console.log('✅ Request enviado exitosamente');
    console.log('📊 Response status:', response.status);
    console.log('📝 Job ID:', response.data.jobId);
    
    if (response.data.jobId) {
      console.log('\n🔍 Monitoreando el procesamiento...');
      console.log('⏰ Esperando logs del procesamiento (revisa la terminal del servidor)');
      console.log('\n💡 BUSCAR EN LOGS:');
      console.log('   - "DIVERSIDAD DE FONDOS verificada"');
      console.log('   - "FILTRO ÉPICO aplicado"');
      console.log('   - "Fondo seleccionado contextualmente"');
      console.log('   - Si aparece "apartamento/baño" es que NO se arregló');
      console.log('   - Si aparece "naturaleza" o "ciudad" entonces SÍ funcionó');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testAventuraEpica();
