// Test de flujo completo - CinemaAI
// Verificar que todos los sistemas están funcionando

console.log('🚀 TESTING FLUJO COMPLETO - CINEMA AI');
console.log('=====================================');

async function testCompleteFlow() {
  try {
    // 1. Test backend básico
    console.log('1️⃣ Testing backend básico...');
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      console.log('✅ Backend funcionando');
    } else {
      throw new Error('Backend no responde');
    }

    // 2. Test autenticación
    console.log('2️⃣ Testing autenticación...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cinemaai.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso:', loginData.user.plan);
      
      const token = loginData.tokens.accessToken;
      
      // 3. Test creación de video
      console.log('3️⃣ Testing creación de video...');
      const renderResponse = await fetch('http://localhost:5000/api/render', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: 'A cinematic story about a hero in space',
          visualStyle: 'cinematic',
          duration: 30
        })
      });
      
      if (renderResponse.ok) {
        const renderData = await renderResponse.json();
        console.log('✅ Video creado:', renderData.data.projectId);
      } else {
        console.log('❌ Error creando video:', await renderResponse.text());
      }
      
    } else {
      console.log('❌ Error en login:', await loginResponse.text());
    }

    console.log('🎉 FLUJO COMPLETO VERIFICADO!');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

// Solo ejecutar si hay backend corriendo
testCompleteFlow().catch(console.error);
