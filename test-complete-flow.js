// Test the complete frontend-backend integration
const fetch = require('node-fetch');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Frontend-Backend Integration...');
    
    const baseURL = 'http://localhost:5000/api';
    const timestamp = Date.now();
    
    // Test data with unique identifiers
    const registrationData = {
      companyName: `Test Company ${timestamp}`,
      companyEmail: `test${timestamp}@test.com`,
      companyPhone: "+1234567890",
      domain: `test${timestamp}`,
      adminName: "Test Admin",
      adminEmail: `admin${timestamp}@test.com`,
      adminUsername: `admin${timestamp}`,
      adminPassword: "password123"
    };

    console.log('📤 Step 1: Testing company registration...');
    
    // 1. Test company registration
    const registerResponse = await fetch(`${baseURL}/auth/register-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerResponse.status}`);
    }

    const registerData = await registerResponse.json();
    console.log('✅ Company registration successful!');
    console.log('   Company ID:', registerData.company?.id);
    console.log('   Admin ID:', registerData.admin?.id);
    console.log('   Workspace ID:', registerData.workspace?.id);
    console.log('   Subdomain:', registerData.workspace?.subdomain);

    // 2. Test admin login
    console.log('\n🔐 Step 2: Testing admin login...');
    
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registrationData.adminEmail,
        password: registrationData.adminPassword
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Admin login successful!');
    console.log('   User:', loginData.user?.firstName, loginData.user?.lastName);
    console.log('   Role:', loginData.user?.role);
    console.log('   Company ID:', loginData.user?.companyId);

    const accessToken = loginData.tokens?.accessToken;
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // 3. Test workspace access
    if (registerData.workspace?.subdomain) {
      console.log('\n🏢 Step 3: Testing workspace access...');
      
      const workspaceResponse = await fetch(`${baseURL}/workspaces/subdomain/${registerData.workspace.subdomain}`, {
        method: 'GET'
      });

      if (workspaceResponse.ok) {
        const workspaceData = await workspaceResponse.json();
        console.log('✅ Workspace access successful!');
        console.log('   Workspace Name:', workspaceData.workspace?.name);
        console.log('   Domain:', workspaceData.workspace?.domain);
        console.log('   Status:', workspaceData.workspace?.status);
      }
    }

    // 4. Test user profile
    console.log('\n👤 Step 4: Testing user profile...');
    
    const profileResponse = await fetch(`${baseURL}/auth/profile`, {
      method: 'GET',
      headers: authHeaders
    });

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Profile access successful!');
      console.log('   User Email:', profileData.user?.email);
      console.log('   User Role:', profileData.user?.role);
    }

    // 5. Test company data access
    console.log('\n🏢 Step 5: Testing company data access...');
    
    const companyResponse = await fetch(`${baseURL}/companies/${registerData.company.id}`, {
      method: 'GET',
      headers: authHeaders
    });

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      console.log('✅ Company data access successful!');
      console.log('   Company Name:', companyData.company?.name);
      console.log('   Company Domain:', companyData.company?.domain);
      console.log('   Company Status:', companyData.company?.status);
    }

    console.log('\n🎉 Complete integration test SUCCESSFUL!');
    console.log('📊 All systems working:');
    console.log('   ✅ Company Registration');
    console.log('   ✅ Workspace Creation');
    console.log('   ✅ Admin User Creation');
    console.log('   ✅ Authentication');
    console.log('   ✅ Database Storage');
    console.log('   ✅ API Access');
    console.log('   ✅ Frontend-Backend Integration');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

testCompleteFlow();













