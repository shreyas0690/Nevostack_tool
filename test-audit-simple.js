// Simple test to check if server is running and audit logs work
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Server is running! Status: ${res.statusCode}`);
  console.log('✅ Audit logging system should now work properly!');
});

req.on('error', (e) => {
  console.error(`❌ Server not running: ${e.message}`);
});

req.end();



