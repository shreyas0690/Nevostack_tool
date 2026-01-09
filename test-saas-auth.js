// Test script to verify SaaS authentication setup
console.log('🔐 SaaS Authentication Test\n');

// Check localStorage tokens
const tokens = {
  token: localStorage.getItem('token'),
  accessToken: localStorage.getItem('accessToken'),
  saas_access_token: localStorage.getItem('saas_access_token'),
  nevostack_auth_token: localStorage.getItem('nevostack_auth_token')
};

console.log('📋 Current Tokens in localStorage:');
Object.entries(tokens).forEach(([key, value]) => {
  const status = value && value !== 'true' ? '✅ Present' : '❌ Missing/Invalid';
  console.log(`  ${key}: ${status}`);
  if (value && value !== 'true') {
    console.log(`    Value: ${value.substring(0, 20)}...`);
  }
});

// Check user data
const userData = {
  user: localStorage.getItem('user'),
  saas_user: localStorage.getItem('saas_user'),
  nevostack_user: localStorage.getItem('nevostack_user')
};

console.log('\n👤 User Data:');
Object.entries(userData).forEach(([key, value]) => {
  const status = value ? '✅ Present' : '❌ Missing';
  console.log(`  ${key}: ${status}`);
  if (value) {
    try {
      const user = JSON.parse(value);
      console.log(`    Name: ${user.firstName} ${user.lastName}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Role: ${user.role}`);
    } catch (e) {
      console.log(`    Invalid JSON: ${value.substring(0, 50)}...`);
    }
  }
});

// Determine if authentication is set up correctly
const hasValidToken = Object.values(tokens).some(token => token && token !== 'true');
const hasValidUser = Object.values(userData).some(user => {
  if (!user) return false;
  try {
    const parsed = JSON.parse(user);
    return parsed.email === 'admin@demo.com' && parsed.role === 'super_admin';
  } catch {
    return false;
  }
});

console.log('\n🎯 Authentication Status:');
console.log(`  Token Available: ${hasValidToken ? '✅ YES' : '❌ NO'}`);
console.log(`  Super Admin User: ${hasValidUser ? '✅ YES' : '❌ NO'}`);
console.log(`  Overall Status: ${hasValidToken && hasValidUser ? '✅ READY' : '❌ SETUP REQUIRED'}`);

if (!hasValidToken || !hasValidUser) {
  console.log('\n💡 To fix authentication:');
  console.log('  1. Go to SaaS Super Admin Login page');
  console.log('  2. Login with: admin@demo.com / AdminPassword123!');
  console.log('  3. Or use the Auth Helper in Companies Management');
  console.log('  4. Click "Set SaaS Super Admin Token"');
}

// Instructions for testing
console.log('\n🧪 Testing API:');
console.log('  1. Open browser console');
console.log('  2. Navigate to SaaS Companies Management');
console.log('  3. Click "Show Debug" to test API connection');
console.log('  4. Check if companies load successfully');

console.log('\n📊 Expected Results:');
console.log('  - Debug panel should show "Connected Successfully"');
console.log('  - Companies should load from backend API');
console.log('  - No more mock data should appear');



