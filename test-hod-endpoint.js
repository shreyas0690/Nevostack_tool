const fetch = require('node-fetch');

async function testHODEndpoint() {
  try {
    console.log('Testing HOD profile details endpoint...');

    const response = await fetch('http://localhost:5000/api/hod/profile/details', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'HOD'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));

    const data = await response.text();
    console.log('Response body:', data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testHODEndpoint();

