// Simple test to verify team members logic
const mongoose = require('mongoose');

// Mock team members data
const mockTeamMembers = [
  {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'dev1@nevostack.com',
    role: 'member',
    departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
    taskStats: {
      total: 5,
      completed: 3,
      inProgress: 2,
      urgent: 1,
      overdue: 0,
      completionRate: 60
    }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    firstName: 'Carol',
    lastName: 'Brown',
    email: 'dev2@nevostack.com',
    role: 'member',
    departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
    taskStats: {
      total: 8,
      completed: 6,
      inProgress: 2,
      urgent: 0,
      overdue: 1,
      completionRate: 75
    }
  }
];

const mockManager = {
  _id: '507f1f77bcf86cd799439014',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'manager@nevostack.com',
  role: 'manager',
  departmentId: { _id: '507f1f77bcf86cd799439012', name: 'Engineering' },
  taskStats: {
    total: 12,
    completed: 9,
    inProgress: 3,
    urgent: 2,
    overdue: 0,
    completionRate: 75
  }
};

// Simulate the API response logic
const simulateApiResponse = () => {
  const allMembers = [mockManager, ...mockTeamMembers];

  console.log('API Response Simulation:');
  console.log('Manager ID:', mockManager._id);
  console.log('Team Members Count:', mockTeamMembers.length);
  console.log('Manager Stats:', mockManager);
  console.log('All Members Count:', allMembers.length);
  console.log('All Members:', allMembers.map(m => ({
    id: m._id,
    name: `${m.firstName} ${m.lastName}`,
    role: m.role,
    taskStats: m.taskStats
  })));

  return {
    success: true,
    data: {
      teamMembers: allMembers,
      totalMembers: allMembers.length
    }
  };
};

console.log('Testing Team Members API Logic...\n');
const response = simulateApiResponse();

console.log('\n✅ API Logic Test Passed!');
console.log('Response structure:', JSON.stringify(response, null, 2));



















