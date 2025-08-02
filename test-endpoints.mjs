// Simple endpoint test without server dependency
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3000';

async function testServer() {
  console.log('🧪 Testing Storyteller AI Backend...');
  
  try {
    // Test 1: Health check
    console.log('📊 Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/healthz`, {
      timeout: 5000
    });
    
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ Health check passed:', data);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test 2: Test endpoint
    console.log('🔍 Testing API endpoint...');
    const testResponse = await fetch(`${SERVER_URL}/api/test`, {
      timeout: 5000
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ Test endpoint passed:', data);
    } else {
      console.log('❌ Test endpoint failed:', testResponse.status);
    }
    
    // Test 3: Simple render test
    console.log('🎬 Testing render endpoint...');
    const renderResponse = await fetch(`${SERVER_URL}/api/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Test render',
        visualStyle: 'cinematic',
        duration: 10
      }),
      timeout: 10000
    });
    
    if (renderResponse.ok) {
      const data = await renderResponse.json();
      console.log('✅ Render test passed:', data);
    } else {
      console.log('❌ Render test failed:', renderResponse.status);
    }
    
    console.log('🎉 All tests completed');
    
  } catch (error) {
    console.log('❌ Server appears to be offline or unreachable');
    console.log('Error:', error.message);
    console.log('💡 Run "npm start" to start the server first');
  }
}

testServer();
