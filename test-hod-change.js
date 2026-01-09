#!/usr/bin/env node

/**
 * HOD Change Test Script
 * Tests all HOD change scenarios as per HOD_CHANGE_COMPLETE_GUIDE.md
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Test data
let authToken = '';
let testCompanyId = '';
let testDepartmentId = '';
let testUsers = {
  hod1: null,
  hod2: null,
  manager1: null,
  member1: null
};

// Helper functions
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${url}`);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

async function login() {
  console.log('🔐 Logging in...');
  
  const response = await makeRequest('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  authToken = response.token;
  testCompanyId = response.user.companyId;
  
  console.log('✅ Login successful');
  console.log(`Company ID: ${testCompanyId}`);
}

async function createTestDepartment() {
  console.log('🏢 Creating test department...');
  
  const response = await makeRequest('POST', '/departments', {
    name: 'Test Development Department',
    description: 'Test department for HOD change testing',
    companyId: testCompanyId
  });
  
  testDepartmentId = response.department._id;
  console.log(`✅ Test department created: ${testDepartmentId}`);
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  // Create HOD 1
  const hod1Response = await makeRequest('POST', '/users', {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@test.com',
    password: 'password123',
    role: 'department_head',
    departmentId: testDepartmentId,
    companyId: testCompanyId
  });
  testUsers.hod1 = hod1Response.user;
  console.log(`✅ HOD 1 created: ${testUsers.hod1._id}`);
  
  // Create Manager 1
  const manager1Response = await makeRequest('POST', '/users', {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@test.com',
    password: 'password123',
    role: 'manager',
    departmentId: testDepartmentId,
    managerId: testUsers.hod1._id,
    companyId: testCompanyId
  });
  testUsers.manager1 = manager1Response.user;
  console.log(`✅ Manager 1 created: ${testUsers.manager1._id}`);
  
  // Create Member 1
  const member1Response = await makeRequest('POST', '/users', {
    firstName: 'Amit',
    lastName: 'Singh',
    email: 'amit.singh@test.com',
    password: 'password123',
    role: 'member',
    departmentId: testDepartmentId,
    managerId: testUsers.manager1._id,
    companyId: testCompanyId
  });
  testUsers.member1 = member1Response.user;
  console.log(`✅ Member 1 created: ${testUsers.member1._id}`);
  
  // Create HOD 2 (for HOD to HOD change)
  const hod2Response = await makeRequest('POST', '/users', {
    firstName: 'Vikram',
    lastName: 'Patel',
    email: 'vikram.patel@test.com',
    password: 'password123',
    role: 'member',
    departmentId: testDepartmentId,
    managerId: testUsers.manager1._id,
    companyId: testCompanyId
  });
  testUsers.hod2 = hod2Response.user;
  console.log(`✅ HOD 2 (Member) created: ${testUsers.hod2._id}`);
}

async function testScenario1_NewHodAssignment() {
  console.log('\n🎯 Test Scenario 1: New HOD Assignment (Manager to HOD)');
  console.log('================================================');
  
  try {
    // Get initial state
    const initialDeptResponse = await makeRequest('GET', `/departments/${testDepartmentId}`);
    const initialManagerIds = initialDeptResponse.department.managerIds || [];
    const initialMemberIds = initialDeptResponse.department.memberIds || [];
    
    console.log('📊 Initial state:');
    console.log(`  - Department managerIds: ${initialManagerIds.length}`);
    console.log(`  - Department memberIds: ${initialMemberIds.length}`);
    console.log(`  - Manager1 in managerIds: ${initialManagerIds.includes(testUsers.manager1._id)}`);
    
    // Promote Manager to HOD
    const response = await makeRequest('PUT', `/users/${testUsers.manager1._id}`, {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@test.com',
      role: 'department_head',
      departmentId: testDepartmentId
    });
    
    console.log('✅ Manager promoted to HOD successfully');
    
    // Verify old HOD is demoted
    const oldHodResponse = await makeRequest('GET', `/users/${testUsers.hod1._id}`);
    if (oldHodResponse.user.role === 'member') {
      console.log('✅ Old HOD demoted to member');
    } else {
      console.log('❌ Old HOD not demoted properly');
    }
    
    // Verify new HOD has relationships
    const newHodResponse = await makeRequest('GET', `/users/${testUsers.manager1._id}`);
    if (newHodResponse.user.role === 'department_head') {
      console.log('✅ New HOD role updated');
    } else {
      console.log('❌ New HOD role not updated');
    }
    
    // Verify department head updated
    const deptResponse = await makeRequest('GET', `/departments/${testDepartmentId}`);
    if (deptResponse.department.headId === testUsers.manager1._id) {
      console.log('✅ Department head updated');
    } else {
      console.log('❌ Department head not updated');
    }
    
    // Verify cleanup: Manager1 should be removed from managerIds
    const finalDeptResponse = await makeRequest('GET', `/departments/${testDepartmentId}`);
    const finalManagerIds = finalDeptResponse.department.managerIds || [];
    const finalMemberIds = finalDeptResponse.department.memberIds || [];
    
    console.log('📊 Final state:');
    console.log(`  - Department managerIds: ${finalManagerIds.length}`);
    console.log(`  - Department memberIds: ${finalMemberIds.length}`);
    console.log(`  - Manager1 in managerIds: ${finalManagerIds.includes(testUsers.manager1._id)}`);
    
    if (!finalManagerIds.includes(testUsers.manager1._id)) {
      console.log('✅ Manager1 removed from department managerIds (cleanup successful)');
    } else {
      console.log('❌ Manager1 still in department managerIds (cleanup failed)');
    }

    // Verify that members managed by Manager1 now have managerId = null
    const member1Response = await makeRequest('GET', `/users/${testUsers.member1._id}`);
    if (member1Response.user.managerId === null) {
      console.log('✅ Member1 managerId cleared (Manager to HOD logic successful)');
    } else {
      console.log('❌ Member1 managerId not cleared (Manager to HOD logic failed)');
    }

    // Verify that new HOD (Manager1) has managerId = null
    if (newHodResponse.user.managerId === null) {
      console.log('✅ New HOD managerId cleared (HOD should not have manager)');
    } else {
      console.log('❌ New HOD managerId not cleared (HOD should not have manager)');
    }

    // Verify that new HOD (Manager1) does not have itself in managedManagerIds
    const managedManagerIds = newHodResponse.user.managedManagerIds || [];
    if (!managedManagerIds.includes(testUsers.manager1._id)) {
      console.log('✅ New HOD does not have itself in managedManagerIds (self-reference fix successful)');
    } else {
      console.log('❌ New HOD has itself in managedManagerIds (self-reference fix failed)');
    }
    
  } catch (error) {
    console.log('❌ Test Scenario 1 failed:', error.message);
  }
}

async function testScenario2_MemberToHod() {
  console.log('\n🎯 Test Scenario 2: Member to HOD Promotion');
  console.log('==========================================');
  
  try {
    // Promote Member to HOD
    const response = await makeRequest('PUT', `/users/${testUsers.member1._id}`, {
      firstName: 'Amit',
      lastName: 'Singh',
      email: 'amit.singh@test.com',
      role: 'department_head',
      departmentId: testDepartmentId
    });
    
    console.log('✅ Member promoted to HOD successfully');
    
    // Verify old HOD is demoted
    const oldHodResponse = await makeRequest('GET', `/users/${testUsers.manager1._id}`);
    if (oldHodResponse.user.role === 'member') {
      console.log('✅ Old HOD demoted to member');
    } else {
      console.log('❌ Old HOD not demoted properly');
    }
    
    // Verify new HOD
    const newHodResponse = await makeRequest('GET', `/users/${testUsers.member1._id}`);
    if (newHodResponse.user.role === 'department_head') {
      console.log('✅ New HOD role updated');
    } else {
      console.log('❌ New HOD role not updated');
    }

    // Verify that new HOD (Member1) has managerId = null
    if (newHodResponse.user.managerId === null) {
      console.log('✅ New HOD managerId cleared (HOD should not have manager)');
    } else {
      console.log('❌ New HOD managerId not cleared (HOD should not have manager)');
    }
    
  } catch (error) {
    console.log('❌ Test Scenario 2 failed:', error.message);
  }
}

async function testScenario3_HodDemotion() {
  console.log('\n🎯 Test Scenario 3: HOD Demotion (HOD to Member)');
  console.log('==============================================');
  
  try {
    // Demote HOD to Member
    const response = await makeRequest('PUT', `/users/${testUsers.member1._id}`, {
      firstName: 'Amit',
      lastName: 'Singh',
      email: 'amit.singh@test.com',
      role: 'member',
      departmentId: testDepartmentId,
      managerId: testUsers.manager1._id
    });
    
    console.log('✅ HOD demoted to member successfully');
    
    // Verify HOD is demoted
    const hodResponse = await makeRequest('GET', `/users/${testUsers.member1._id}`);
    if (hodResponse.user.role === 'member') {
      console.log('✅ HOD demoted to member');
    } else {
      console.log('❌ HOD not demoted properly');
    }
    
    // Verify department head is cleared
    const deptResponse = await makeRequest('GET', `/departments/${testDepartmentId}`);
    if (!deptResponse.department.headId) {
      console.log('✅ Department head cleared');
    } else {
      console.log('❌ Department head not cleared');
    }
    
  } catch (error) {
    console.log('❌ Test Scenario 3 failed:', error.message);
  }
}

async function testScenario4_HodToHodChange() {
  console.log('\n🎯 Test Scenario 4: HOD to HOD Change');
  console.log('====================================');
  
  try {
    // First promote HOD2 to HOD
    const promoteResponse = await makeRequest('PUT', `/users/${testUsers.hod2._id}`, {
      firstName: 'Vikram',
      lastName: 'Patel',
      email: 'vikram.patel@test.com',
      role: 'department_head',
      departmentId: testDepartmentId
    });
    
    console.log('✅ HOD2 promoted to HOD');
    
    // Now change HOD1 to HOD (should demote HOD2)
    const changeResponse = await makeRequest('PUT', `/users/${testUsers.member1._id}`, {
      firstName: 'Amit',
      lastName: 'Singh',
      email: 'amit.singh@test.com',
      role: 'department_head',
      departmentId: testDepartmentId
    });
    
    console.log('✅ HOD changed successfully');
    
    // Verify HOD2 is demoted
    const hod2Response = await makeRequest('GET', `/users/${testUsers.hod2._id}`);
    if (hod2Response.user.role === 'member') {
      console.log('✅ Previous HOD demoted to member');
    } else {
      console.log('❌ Previous HOD not demoted properly');
    }
    
    // Verify new HOD
    const newHodResponse = await makeRequest('GET', `/users/${testUsers.member1._id}`);
    if (newHodResponse.user.role === 'department_head') {
      console.log('✅ New HOD role updated');
    } else {
      console.log('❌ New HOD role not updated');
    }
    
  } catch (error) {
    console.log('❌ Test Scenario 4 failed:', error.message);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test users
    for (const [key, user] of Object.entries(testUsers)) {
      if (user) {
        await makeRequest('DELETE', `/users/${user._id}`);
        console.log(`✅ Deleted ${key}: ${user._id}`);
      }
    }
    
    // Delete test department
    if (testDepartmentId) {
      await makeRequest('DELETE', `/departments/${testDepartmentId}`);
      console.log(`✅ Deleted test department: ${testDepartmentId}`);
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting HOD Change Tests');
  console.log('============================');
  
  try {
    await login();
    await createTestDepartment();
    await createTestUsers();
    
    await testScenario1_NewHodAssignment();
    await testScenario2_MemberToHod();
    await testScenario3_HodDemotion();
    await testScenario4_HodToHodChange();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.log('❌ Test suite failed:', error.message);
  } finally {
    await cleanup();
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testScenario1_NewHodAssignment,
  testScenario2_MemberToHod,
  testScenario3_HodDemotion,
  testScenario4_HodToHodChange
};
