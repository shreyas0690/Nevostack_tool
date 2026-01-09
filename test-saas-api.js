// Test script to verify SaaS API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000'; // Adjust port as needed
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testSaaSEndpoints() {
  console.log('🧪 Testing SaaS API Endpoints...\n');

  const endpoints = [
    {
      name: 'Dashboard Stats',
      url: '/api/saas/dashboard/stats',
      method: 'GET'
    },
    {
      name: 'Companies List',
      url: '/api/saas/companies?page=1&limit=5',
      method: 'GET'
    },
    {
      name: 'Monthly Trends',
      url: '/api/saas/monthly-trends',
      method: 'GET'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      
      const response = await fetch(`${API_BASE}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        const error = await response.text();
        console.log(`   ❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run the test
testSaaSEndpoints().catch(console.error);



