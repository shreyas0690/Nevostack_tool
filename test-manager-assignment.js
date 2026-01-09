const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test data storage
let testUsers = {};
let testDepartments = {};
let authToken = '';

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
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
    console.error(`❌ API Error: ${method} ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
}

// Setup function
async function setupTestData() {
  console.log('🔧 Setting up test data...');

  try {
    // Login as admin
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = loginResponse.token;
    console.log('✅ Admin login successful');

    // Create test department
    const deptResponse = await makeRequest('POST', '/departments', {
      name: 'Test Department for Manager Assignment',
      description: 'Department for testing manager assignment scenarios'
    });
    testDepartments.dept1 = deptResponse.department;
    console.log('✅ Test department created');

    // Create HOD for the department
    const hodResponse = await makeRequest('POST', '/users', {
      name: 'Test HOD',
      email: 'testhod@example.com',
      password: 'password123',
      role: 'department_head',
      departmentId: testDepartments.dept1._id
    });
    testUsers.hod1 = hodResponse.user;
    console.log('✅ Test HOD created');

    // Update department head
    await makeRequest('PUT', `/departments/${testDepartments.dept1._id}`, {
      headId: testUsers.hod1._id
    });
    console.log('✅ Department head assigned');

    // Create test users for different roles
    const hrResponse = await makeRequest('POST', '/users', {
      name: 'Test HR',
      email: 'testhr@example.com',
      password: 'password123',
      role: 'hr'
    });
    testUsers.hr1 = hrResponse.user;
    console.log('✅ Test HR created');

    const memberResponse = await makeRequest('POST', '/users', {
      name: 'Test Member',
      email: 'testmember@example.com',
      password: 'password123',
      role: 'member',
      departmentId: testDepartments.dept1._id,
      managerId: testUsers.hod1._id
    });
    testUsers.member1 = memberResponse.user;
    console.log('✅ Test Member created');

    const personResponse = await makeRequest('POST', '/users', {
      name: 'Test Person',
      email: 'testperson@example.com',
      password: 'password123',
      role: 'person'
    });
    testUsers.person1 = personResponse.user;
    console.log('✅ Test Person created');

    // Add member to department
    await makeRequest('PUT', `/departments/${testDepartments.dept1._id}`, {
      memberIds: [testUsers.member1._id]
    });
    console.log('✅ Member added to department');

    // Add member to HOD's managedMemberIds
    await makeRequest('PUT', `/users/${testUsers.hod1._id}`, {
      managedMemberIds: [testUsers.member1._id]
    });
    console.log('✅ Member added to HOD managedMemberIds');

    console.log('🎉 Test data setup complete!');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Test Scenario 1: HR to Manager
async function testHrToManager() {
  console.log('\n🧪 Testing Scenario 1: HR to Manager Assignment');
  console.log('=' .repeat(60));

  try {
    // Get initial state
    const initialHr = await makeRequest('GET', `/users/${testUsers.hr1._id}`);
    const initialDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const initialHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);

    console.log('📊 Initial State:');
    console.log(`- HR1: role = ${initialHr.user.role}, departmentId = ${initialHr.user.departmentId}`);
    console.log(`- Department: managerIds = ${initialDept.department.managerIds?.length || 0}`);
    console.log(`- HOD: managedManagerIds = ${initialHod.user.managedManagerIds?.length || 0}`);

    // Convert HR to Manager
    const updateResponse = await makeRequest('PUT', `/users/${testUsers.hr1._id}`, {
      role: 'manager',
      departmentId: testDepartments.dept1._id,
      managerId: testUsers.hod1._id
    });

    console.log('✅ HR to Manager conversion successful');

    // Verify changes
    const updatedHr = await makeRequest('GET', `/users/${testUsers.hr1._id}`);
    const updatedDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const updatedHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);

    console.log('\n📊 Final State:');
    console.log(`- HR1: role = ${updatedHr.user.role}, departmentId = ${updatedHr.user.departmentId}, managerId = ${updatedHr.user.managerId}`);
    console.log(`- Department: managerIds = ${updatedDept.department.managerIds?.length || 0}`);
    console.log(`- HOD: managedManagerIds = ${updatedHod.user.managedManagerIds?.length || 0}`);

    // Verifications
    if (updatedHr.user.role === 'manager') {
      console.log('✅ HR role updated to manager');
    } else {
      console.log('❌ HR role not updated to manager');
    }

    if (updatedHr.user.departmentId === testDepartments.dept1._id) {
      console.log('✅ HR assigned to department');
    } else {
      console.log('❌ HR not assigned to department');
    }

    if (updatedHr.user.managerId === testUsers.hod1._id) {
      console.log('✅ HR assigned to HOD as manager');
    } else {
      console.log('❌ HR not assigned to HOD as manager');
    }

    if (updatedDept.department.managerIds?.includes(testUsers.hr1._id)) {
      console.log('✅ HR added to department managerIds');
    } else {
      console.log('❌ HR not added to department managerIds');
    }

    if (updatedHod.user.managedManagerIds?.includes(testUsers.hr1._id)) {
      console.log('✅ HR added to HOD managedManagerIds');
    } else {
      console.log('❌ HR not added to HOD managedManagerIds');
    }

    console.log('🎉 HR to Manager test completed successfully!');

  } catch (error) {
    console.log('❌ HR to Manager test failed:', error.message);
  }
}

// Test Scenario 2: Member to Manager
async function testMemberToManager() {
  console.log('\n🧪 Testing Scenario 2: Member to Manager Assignment');
  console.log('=' .repeat(60));

  try {
    // Get initial state
    const initialMember = await makeRequest('GET', `/users/${testUsers.member1._id}`);
    const initialDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const initialHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);

    console.log('📊 Initial State:');
    console.log(`- Member1: role = ${initialMember.user.role}, departmentId = ${initialMember.user.departmentId}, managerId = ${initialMember.user.managerId}`);
    console.log(`- Department: memberIds = ${initialDept.department.memberIds?.length || 0}, managerIds = ${initialDept.department.managerIds?.length || 0}`);
    console.log(`- HOD: managedMemberIds = ${initialHod.user.managedMemberIds?.length || 0}, managedManagerIds = ${initialHod.user.managedManagerIds?.length || 0}`);

    // Convert Member to Manager
    const updateResponse = await makeRequest('PUT', `/users/${testUsers.member1._id}`, {
      role: 'manager',
      departmentId: testDepartments.dept1._id,
      managerId: testUsers.hod1._id
    });

    console.log('✅ Member to Manager conversion successful');

    // Verify changes
    const updatedMember = await makeRequest('GET', `/users/${testUsers.member1._id}`);
    const updatedDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const updatedHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);

    console.log('\n📊 Final State:');
    console.log(`- Member1: role = ${updatedMember.user.role}, departmentId = ${updatedMember.user.departmentId}, managerId = ${updatedMember.user.managerId}`);
    console.log(`- Department: memberIds = ${updatedDept.department.memberIds?.length || 0}, managerIds = ${updatedDept.department.managerIds?.length || 0}`);
    console.log(`- HOD: managedMemberIds = ${updatedHod.user.managedMemberIds?.length || 0}, managedManagerIds = ${updatedHod.user.managedManagerIds?.length || 0}`);

    // Verifications
    if (updatedMember.user.role === 'manager') {
      console.log('✅ Member role updated to manager');
    } else {
      console.log('❌ Member role not updated to manager');
    }

    if (updatedMember.user.managerId === testUsers.hod1._id) {
      console.log('✅ Member assigned to HOD as manager');
    } else {
      console.log('❌ Member not assigned to HOD as manager');
    }

    if (!updatedDept.department.memberIds?.includes(testUsers.member1._id)) {
      console.log('✅ Member removed from department memberIds');
    } else {
      console.log('❌ Member not removed from department memberIds');
    }

    if (updatedDept.department.managerIds?.includes(testUsers.member1._id)) {
      console.log('✅ Member added to department managerIds');
    } else {
      console.log('❌ Member not added to department managerIds');
    }

    if (!updatedHod.user.managedMemberIds?.includes(testUsers.member1._id)) {
      console.log('✅ Member removed from HOD managedMemberIds');
    } else {
      console.log('❌ Member not removed from HOD managedMemberIds');
    }

    if (updatedHod.user.managedManagerIds?.includes(testUsers.member1._id)) {
      console.log('✅ Member added to HOD managedManagerIds');
    } else {
      console.log('❌ Member not added to HOD managedManagerIds');
    }

    console.log('🎉 Member to Manager test completed successfully!');

  } catch (error) {
    console.log('❌ Member to Manager test failed:', error.message);
  }
}

// Test Scenario 3: Person to Manager
async function testPersonToManager() {
  console.log('\n🧪 Testing Scenario 3: Person to Manager Assignment');
  console.log('=' .repeat(60));

  try {
    // Get initial state
    const initialPerson = await makeRequest('GET', `/users/${testUsers.person1._id}`);
    const initialDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const initialHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);

    console.log('📊 Initial State:');
    console.log(`- Person1: role = ${initialPerson.user.role}, departmentId = ${initialPerson.user.departmentId}`);
    console.log(`- Department: managerIds = ${initialDept.department.managerIds?.length || 0}`);
    console.log(`- HOD: managedManagerIds = ${initialHod.user.managedManagerIds?.length || 0}`);

    // Convert Person to Manager
    const updateResponse = await makeRequest('PUT', `/users/${testUsers.person1._id}`, {
      role: 'manager',
      departmentId: testDepartments.dept1._id,
      managerId: testUsers.hod1._id
    });

    console.log('✅ Person to Manager conversion successful');

    // Verify changes
    const updatedPerson = await makeRequest('GET', `/users/${testUsers.person1._id}`);
    const updatedDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const updatedHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);

    console.log('\n📊 Final State:');
    console.log(`- Person1: role = ${updatedPerson.user.role}, departmentId = ${updatedPerson.user.departmentId}, managerId = ${updatedPerson.user.managerId}`);
    console.log(`- Department: managerIds = ${updatedDept.department.managerIds?.length || 0}`);
    console.log(`- HOD: managedManagerIds = ${updatedHod.user.managedManagerIds?.length || 0}`);

    // Verifications
    if (updatedPerson.user.role === 'manager') {
      console.log('✅ Person role updated to manager');
    } else {
      console.log('❌ Person role not updated to manager');
    }

    if (updatedPerson.user.departmentId === testDepartments.dept1._id) {
      console.log('✅ Person assigned to department');
    } else {
      console.log('❌ Person not assigned to department');
    }

    if (updatedPerson.user.managerId === testUsers.hod1._id) {
      console.log('✅ Person assigned to HOD as manager');
    } else {
      console.log('❌ Person not assigned to HOD as manager');
    }

    if (updatedDept.department.managerIds?.includes(testUsers.person1._id)) {
      console.log('✅ Person added to department managerIds');
    } else {
      console.log('❌ Person not added to department managerIds');
    }

    if (updatedHod.user.managedManagerIds?.includes(testUsers.person1._id)) {
      console.log('✅ Person added to HOD managedManagerIds');
    } else {
      console.log('❌ Person not added to HOD managedManagerIds');
    }

    console.log('🎉 Person to Manager test completed successfully!');

  } catch (error) {
    console.log('❌ Person to Manager test failed:', error.message);
  }
}

// Test Scenario 4: HOD to Manager
async function testHodToManager() {
  console.log('\n🧪 Testing Scenario 4: HOD to Manager Assignment');
  console.log('=' .repeat(60));

  try {
    // Create another HOD for this test
    const hod2Response = await makeRequest('POST', '/users', {
      name: 'Test HOD 2',
      email: 'testhod2@example.com',
      password: 'password123',
      role: 'department_head',
      departmentId: testDepartments.dept1._id
    });
    testUsers.hod2 = hod2Response.user;
    console.log('✅ Test HOD 2 created');

    // Get initial state
    const initialHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);
    const initialDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);

    console.log('📊 Initial State:');
    console.log(`- HOD1: role = ${initialHod.user.role}, departmentId = ${initialHod.user.departmentId}, managedManagerIds = ${initialHod.user.managedManagerIds?.length || 0}`);
    console.log(`- Department: headId = ${initialDept.department.headId}`);

    // Convert HOD to Manager
    const updateResponse = await makeRequest('PUT', `/users/${testUsers.hod1._id}`, {
      role: 'manager',
      departmentId: testDepartments.dept1._id,
      managerId: testUsers.hod2._id
    });

    console.log('✅ HOD to Manager conversion successful');

    // Verify changes
    const updatedHod = await makeRequest('GET', `/users/${testUsers.hod1._id}`);
    const updatedDept = await makeRequest('GET', `/departments/${testDepartments.dept1._id}`);
    const updatedHod2 = await makeRequest('GET', `/users/${testUsers.hod2._id}`);

    console.log('\n📊 Final State:');
    console.log(`- HOD1: role = ${updatedHod.user.role}, departmentId = ${updatedHod.user.departmentId}, managerId = ${updatedHod.user.managerId}`);
    console.log(`- Department: headId = ${updatedDept.department.headId}`);
    console.log(`- HOD2: managedManagerIds = ${updatedHod2.user.managedManagerIds?.length || 0}`);

    // Verifications
    if (updatedHod.user.role === 'manager') {
      console.log('✅ HOD role updated to manager');
    } else {
      console.log('❌ HOD role not updated to manager');
    }

    if (updatedHod.user.managerId === testUsers.hod2._id) {
      console.log('✅ HOD assigned to new HOD as manager');
    } else {
      console.log('❌ HOD not assigned to new HOD as manager');
    }

    if (updatedHod.user.managedManagerIds?.length === 0) {
      console.log('✅ HOD managedManagerIds cleared');
    } else {
      console.log('❌ HOD managedManagerIds not cleared');
    }

    if (updatedHod.user.managedMemberIds?.length === 0) {
      console.log('✅ HOD managedMemberIds cleared');
    } else {
      console.log('❌ HOD managedMemberIds not cleared');
    }

    if (updatedDept.department.headId === null) {
      console.log('✅ Department headId cleared');
    } else {
      console.log('❌ Department headId not cleared');
    }

    if (updatedHod2.user.managedManagerIds?.includes(testUsers.hod1._id)) {
      console.log('✅ HOD added to new HOD managedManagerIds');
    } else {
      console.log('❌ HOD not added to new HOD managedManagerIds');
    }

    console.log('🎉 HOD to Manager test completed successfully!');

  } catch (error) {
    console.log('❌ HOD to Manager test failed:', error.message);
  }
}

// Cleanup function
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete test users
    for (const [key, user] of Object.entries(testUsers)) {
      await makeRequest('DELETE', `/users/${user._id}`);
      console.log(`✅ Deleted test user: ${key}`);
    }

    // Delete test department
    await makeRequest('DELETE', `/departments/${testDepartments.dept1._id}`);
    console.log('✅ Deleted test department');

    console.log('🎉 Cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Manager Assignment Tests');
  console.log('=' .repeat(80));

  try {
    // Setup
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      console.log('❌ Setup failed, aborting tests');
      return;
    }

    // Run all test scenarios
    await testHrToManager();
    await testMemberToManager();
    await testPersonToManager();
    await testHodToManager();

    console.log('\n🎉 All Manager Assignment tests completed!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    // Cleanup
    await cleanupTestData();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHrToManager,
  testMemberToManager,
  testPersonToManager,
  testHodToManager
};
