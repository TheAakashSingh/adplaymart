// Simple API testing script
const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    if (!response.ok) {
      console.log(`❌ Error: ${data.message}`);
    }
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test 1: Register a new user
  console.log('1. Testing User Registration...');
  const registerResult = await testAPI('/api/auth/register', 'POST', {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'password123',
    phone: '9999999998'
  });
  
  if (!registerResult.success) {
    console.log('Registration failed, trying with different email...');
    await testAPI('/api/auth/register', 'POST', {
      username: 'testuser3',
      email: 'test3@example.com',
      password: 'password123',
      phone: '9999999997'
    });
  }
  
  // Test 2: Login
  console.log('\n2. Testing User Login...');
  const loginResult = await testAPI('/api/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (!loginResult.success) {
    console.log('❌ Login failed, cannot continue with authenticated tests');
    return;
  }
  
  const token = loginResult.data.data.token;
  console.log('✅ Login successful, token obtained');
  
  // Test 3: Get User Profile
  console.log('\n3. Testing User Profile...');
  await testAPI('/api/user/profile', 'GET', null, token);
  
  // Test 4: Get MLM Earnings
  console.log('\n4. Testing MLM Earnings...');
  await testAPI('/api/mlm/earnings', 'GET', null, token);
  
  // Test 5: Get Wallet Info
  console.log('\n5. Testing Wallet...');
  await testAPI('/api/wallet', 'GET', null, token);
  
  // Test 6: Gaming - Play Game
  console.log('\n6. Testing Gaming API...');
  await testAPI('/api/gaming/play-game', 'POST', {
    gameId: 'game_001',
    gameType: 'casual',
    score: 1500,
    duration: 300
  }, token);
  
  // Test 7: Gaming - Daily Tasks
  console.log('\n7. Testing Daily Tasks...');
  await testAPI('/api/gaming/daily-tasks', 'GET', null, token);
  
  // Test 8: Shop Products
  console.log('\n8. Testing Shop Products...');
  await testAPI('/api/shop/products', 'GET');
  
  // Test 9: Admin Dashboard (might fail if not admin)
  console.log('\n9. Testing Admin Dashboard...');
  await testAPI('/api/admin/dashboard', 'GET', null, token);
  
  console.log('\n🎉 API Tests Completed!');
}

// Run the tests
runTests().catch(console.error);
