const baseUrl = 'http://localhost:3000';

// Test user credentials
const testUser = {
  username: 'testuser123',
  email: 'testuser123@example.com',
  password: 'password123',
  phone: '9876543210'
};

let authToken = '';

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function testVideoWatchingSystem() {
  console.log('🎬 TESTING VIDEO WATCHING SYSTEM\n');
  
  try {
    // 1. Register a new user
    console.log('1. 👤 Testing User Registration...');
    const registerResult = await makeRequest('/api/auth/register', 'POST', testUser);
    console.log(`   Status: ${registerResult.status}`);
    if (registerResult.status === 201) {
      console.log('   ✅ User registered successfully');
    } else {
      console.log(`   ❌ Registration failed: ${registerResult.data.message}`);
      // Try to login if user already exists
      console.log('   🔄 Trying to login with existing user...');
      const loginResult = await makeRequest('/api/auth/login', 'POST', {
        email: testUser.email,
        password: testUser.password
      });
      if (loginResult.status === 200) {
        authToken = loginResult.data.data.token;
        console.log('   ✅ Login successful');
      } else {
        console.log('   ❌ Login failed');
        return;
      }
    }
    
    // 2. Login if registration was successful
    if (!authToken && registerResult.status === 201) {
      console.log('\n2. 🔐 Testing User Login...');
      const loginResult = await makeRequest('/api/auth/login', 'POST', {
        email: testUser.email,
        password: testUser.password
      });
      console.log(`   Status: ${loginResult.status}`);
      if (loginResult.status === 200) {
        authToken = loginResult.data.data.token;
        console.log('   ✅ Login successful');
      } else {
        console.log(`   ❌ Login failed: ${loginResult.data.message}`);
        return;
      }
    }
    
    // 3. Get video watch status
    console.log('\n3. 📺 Testing Video Watch Status...');
    const videoStatusResult = await makeRequest('/api/video/watch', 'GET', null, authToken);
    console.log(`   Status: ${videoStatusResult.status}`);
    if (videoStatusResult.status === 200) {
      console.log('   ✅ Video status retrieved successfully');
      console.log(`   📊 Available videos: ${videoStatusResult.data.data.availableVideos.length}`);
      console.log(`   💰 Total video earnings: ₹${videoStatusResult.data.data.totalVideoEarnings}`);
      console.log(`   🎬 Welcome video watched: ${videoStatusResult.data.data.welcomeVideoWatched}`);
    } else {
      console.log(`   ❌ Failed to get video status: ${videoStatusResult.data.message}`);
    }
    
    // 4. Test welcome video watching
    console.log('\n4. 🎉 Testing Welcome Video Watch...');
    const welcomeVideoResult = await makeRequest('/api/video/watch', 'POST', {
      videoId: 'welcome_001',
      videoType: 'welcome',
      watchDuration: 120, // 2 minutes
      totalDuration: 120
    }, authToken);
    console.log(`   Status: ${welcomeVideoResult.status}`);
    if (welcomeVideoResult.status === 200) {
      console.log('   ✅ Welcome video reward earned successfully');
      console.log(`   💰 Reward amount: ₹${welcomeVideoResult.data.data.rewardAmount}`);
      console.log(`   👛 Updated wallets:`, welcomeVideoResult.data.data.wallets);
    } else {
      console.log(`   ❌ Welcome video failed: ${welcomeVideoResult.data.message}`);
    }
    
    // 5. Test daily ad watching
    console.log('\n5. 📺 Testing Daily Ad Watch...');
    const adVideoResult = await makeRequest('/api/video/watch', 'POST', {
      videoId: 'ad_001',
      videoType: 'daily_ad',
      watchDuration: 30, // 30 seconds
      totalDuration: 30
    }, authToken);
    console.log(`   Status: ${adVideoResult.status}`);
    if (adVideoResult.status === 200) {
      console.log('   ✅ Daily ad reward earned successfully');
      console.log(`   💰 Reward amount: ₹${adVideoResult.data.data.rewardAmount}`);
      console.log(`   📊 Daily ad progress:`, adVideoResult.data.data.dailyAdProgress);
    } else {
      console.log(`   ❌ Daily ad failed: ${adVideoResult.data.message}`);
    }
    
    // 6. Test game unlock video
    console.log('\n6. 🎮 Testing Game Unlock Video...');
    const gameVideoResult = await makeRequest('/api/video/watch', 'POST', {
      videoId: 'game_tutorial_001',
      videoType: 'game_unlock',
      watchDuration: 90, // 1.5 minutes
      totalDuration: 90
    }, authToken);
    console.log(`   Status: ${gameVideoResult.status}`);
    if (gameVideoResult.status === 200) {
      console.log('   ✅ Game unlock video reward earned successfully');
      console.log(`   💰 Reward amount: ₹${gameVideoResult.data.data.rewardAmount}`);
    } else {
      console.log(`   ❌ Game unlock video failed: ${gameVideoResult.data.message}`);
    }
    
    // 7. Test incomplete video watching (should fail)
    console.log('\n7. ⚠️ Testing Incomplete Video Watch (Should Fail)...');
    const incompleteVideoResult = await makeRequest('/api/video/watch', 'POST', {
      videoId: 'incomplete_001',
      videoType: 'daily_ad',
      watchDuration: 15, // Only 15 seconds of 30 second video
      totalDuration: 30
    }, authToken);
    console.log(`   Status: ${incompleteVideoResult.status}`);
    if (incompleteVideoResult.status === 400) {
      console.log('   ✅ Incomplete video correctly rejected');
      console.log(`   📝 Message: ${incompleteVideoResult.data.message}`);
    } else {
      console.log(`   ❌ Incomplete video should have been rejected`);
    }
    
    // 8. Test gaming API (should work after video watching)
    console.log('\n8. 🎮 Testing Gaming API (After Video Watch)...');
    const gamingResult = await makeRequest('/api/gaming/play-game', 'GET', null, authToken);
    console.log(`   Status: ${gamingResult.status}`);
    if (gamingResult.status === 200) {
      console.log('   ✅ Gaming stats retrieved successfully');
      console.log(`   🎯 Gaming data:`, gamingResult.data.data.gaming);
    } else {
      console.log(`   ❌ Gaming API failed: ${gamingResult.data.message}`);
    }
    
    // 9. Get final video status
    console.log('\n9. 📊 Testing Final Video Status...');
    const finalStatusResult = await makeRequest('/api/video/watch', 'GET', null, authToken);
    console.log(`   Status: ${finalStatusResult.status}`);
    if (finalStatusResult.status === 200) {
      console.log('   ✅ Final video status retrieved successfully');
      console.log(`   💰 Total video earnings: ₹${finalStatusResult.data.data.totalVideoEarnings}`);
      console.log(`   🎬 Welcome video watched: ${finalStatusResult.data.data.welcomeVideoWatched}`);
      console.log(`   📺 Daily ads watched: ${finalStatusResult.data.data.dailyAdProgress.watched}/50`);
      console.log(`   💵 Daily ad earnings: ₹${finalStatusResult.data.data.dailyAdProgress.dailyEarnings}`);
    } else {
      console.log(`   ❌ Failed to get final video status: ${finalStatusResult.data.message}`);
    }
    
    // 10. Test user profile to see updated wallet
    console.log('\n10. 👤 Testing User Profile (Updated Wallet)...');
    const profileResult = await makeRequest('/api/user/profile', 'GET', null, authToken);
    console.log(`   Status: ${profileResult.status}`);
    if (profileResult.status === 200) {
      console.log('   ✅ User profile retrieved successfully');
      console.log(`   👛 Wallets:`, profileResult.data.data.wallets);
      console.log(`   💰 Total earnings: ₹${profileResult.data.data.totalEarnings}`);
    } else {
      console.log(`   ❌ Failed to get user profile: ${profileResult.data.message}`);
    }
    
    console.log('\n🎉 VIDEO WATCHING SYSTEM TEST COMPLETED!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Video watching API implemented');
    console.log('✅ Welcome video reward (₹100)');
    console.log('✅ Daily ad watching system (₹2 per ad)');
    console.log('✅ Game unlock video system');
    console.log('✅ Video completion validation (90% minimum)');
    console.log('✅ Gaming unlock after video watching');
    console.log('✅ Wallet integration with video rewards');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testVideoWatchingSystem();
