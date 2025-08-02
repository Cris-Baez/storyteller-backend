// Test del endpoint de health check
import http from 'http';

console.log('🧪 Iniciando test de health check...');

// Test del health endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/healthz',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response:', data);
    console.log('🎉 Test completado exitosamente');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('❌ Error:', err.message);
  console.log('ℹ️  El servidor probablemente no está ejecutándose');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.log('⏰ Timeout - servidor no responde');
  process.exit(1);
});

req.end();
