const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testUserCreation() {
  try {
    console.log('Testing user creation with departmentId: "none"...');
    
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'defaultPassword123!',
      role: 'person',
      departmentId: 'none',
      managerId: 'none'
    };

    const response = await axios.post(`${API_BASE}/users`, userData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to add a valid token
      }
    });

    console.log('✅ User creation successful:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error response:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testUserCreation();






































