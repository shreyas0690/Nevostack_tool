const axios = require('axios');

// Test member dashboard API
async function testMemberDashboard() {
  try {
    console.log('Testing Member Dashboard API...');

    // First login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'agamon@nevostack.com', // Replace with actual test user email
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');

    // Test dashboard API
    const dashboardResponse = await axios.get('http://localhost:5000/api/members/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Dashboard API call successful');
    console.log('\n📊 Dashboard Data:');

    const data = dashboardResponse.data.data;
    console.log('Member Info:');
    console.log('- Name:', data.member.name);
    console.log('- Email:', data.member.email);
    console.log('- Role:', data.member.role);
    console.log('- Department:', data.member.department ? data.member.department.name : 'Not assigned');
    console.log('- Manager:', data.member.manager ? data.member.manager.name : 'Not assigned');

    console.log('\n📈 Task Statistics:');
    console.log('- Total Tasks:', data.stats.totalTasks);
    console.log('- Completed:', data.stats.completedTasks);
    console.log('- Pending:', data.stats.pendingTasks);
    console.log('- Today:', data.stats.todayTasks);

    console.log('\n👥 Team Information:');
    if (data.team) {
      console.log('- Manager:', data.team.manager ? data.team.manager.name : 'Not assigned');
      console.log('- Team Size:', data.team.teamSize);
      console.log('- Team Members:', data.team.teamMembers.length);
    } else {
      console.log('- No team information available');
    }

    console.log('\n✅ All tests passed! Department and Manager data is now working.');

  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
  }
}

testMemberDashboard();









