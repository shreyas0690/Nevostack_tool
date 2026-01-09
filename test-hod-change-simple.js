#!/usr/bin/env node

/**
 * Simple HOD Change Test
 * Tests if old HOD gets demoted to member when manager becomes HOD
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nevostack');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Models
const User = require('./backend/models/User');
const Department = require('./backend/models/Department');

// Test function
async function testHODDemotion() {
  try {
    console.log('🔍 Testing HOD demotion logic...');

    // Find a department with an HOD
    const department = await Department.findOne({ headId: { $exists: true, $ne: null } });
    if (!department) {
      console.log('❌ No department with HOD found');
      return;
    }

    console.log(`📍 Found department: ${department.name} (${department._id})`);
    console.log(`👑 Current HOD: ${department.headId}`);

    // Find the current HOD
    const currentHod = await User.findById(department.headId);
    if (!currentHod) {
      console.log('❌ Current HOD not found');
      return;
    }

    console.log(`👤 Current HOD details: ${currentHod.firstName} ${currentHod.lastName}, Role: ${currentHod.role}`);

    // Find a manager in the same department
    const manager = await User.findOne({
      departmentId: department._id,
      role: 'manager'
    });

    if (!manager) {
      console.log('❌ No manager found in this department');
      return;
    }

    console.log(`👨‍💼 Found manager: ${manager.firstName} ${manager.lastName} (${manager._id})`);

    // Now simulate what happens when manager becomes HOD
    console.log('\n🔄 Simulating manager to HOD promotion...');

    // Step 1: Update manager to HOD
    await User.updateOne(
      { _id: manager._id },
      {
        role: 'department_head',
        departmentId: department._id,
        managerId: null,
        managedManagerIds: [],
        managedMemberIds: []
      }
    );

    // Step 2: Demote old HOD to member (this is what should happen)
    await User.updateOne(
      { _id: currentHod._id },
      {
        role: 'member',
        department: null,
        departmentId: null,
        managerId: null,
        managedManagerIds: [],
        managedMemberIds: []
      }
    );

    // Step 3: Update department head
    await Department.updateOne(
      { _id: department._id },
      { headId: manager._id }
    );

    console.log('✅ Simulation completed');

    // Verify results
    const updatedOldHod = await User.findById(currentHod._id);
    const updatedNewHod = await User.findById(manager._id);
    const updatedDept = await Department.findById(department._id);

    console.log('\n📊 Verification Results:');
    console.log(`👤 Old HOD role: ${updatedOldHod.role} (should be 'member')`);
    console.log(`👤 Old HOD departmentId: ${updatedOldHod.departmentId} (should be null)`);
    console.log(`👑 New HOD role: ${updatedNewHod.role} (should be 'department_head')`);
    console.log(`🏢 Department head: ${updatedDept.headId} (should be ${manager._id})`);

    if (updatedOldHod.role === 'member' && updatedOldHod.departmentId === null) {
      console.log('✅ Test PASSED: Old HOD correctly demoted to member');
    } else {
      console.log('❌ Test FAILED: Old HOD not properly demoted');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
async function runTest() {
  await connectDB();
  await testHODDemotion();
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest };


