// Script to clear all authentication data
console.log('🧹 Clearing all authentication data...');

// Clear all localStorage items related to authentication
const keysToRemove = [
  'nevostack_auth',
  'nevostack_user', 
  'user',
  'accessToken',
  'refreshToken',
  'device',
  'deviceId'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Removed: ${key}`);
});

console.log('✅ All authentication data cleared!');
console.log('Now refresh the page - you should see the login page instead of HOD panel.');

// Show current localStorage contents
console.log('\n📋 Current localStorage contents:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value}`);
}
