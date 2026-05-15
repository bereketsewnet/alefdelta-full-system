const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testUserFlow() {
  try {
    // 1. Login as Admin
    console.log('Logging in as Admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'admin_1763847546518',
      password: 'uudlQ/niFtQYTBBMIMl3',
      actor: 'STAFF'
    });
    
    const adminToken = adminLogin.data.accessToken;
    console.log('Admin logged in successfully.');

    // 2. Create New User
    const newUsername = 'TestUser_' + Date.now();
    const newPassword = 'password123';
    
    console.log(`Creating new user: ${newUsername} with password: ${newPassword}`);
    
    try {
      await axios.post(
        `${API_URL}/users`, 
        {
          username: newUsername,
          email: 'test@example.com',
          phone: '+251911111111',
          role: 'TELLER',
          password: newPassword
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('User created successfully.');
    } catch (err) {
      console.error('Failed to create user:', err.response?.data || err.message);
      return;
    }

    // 3. Login as New User
    console.log('Attempting to login as new user...');
    try {
      const userLogin = await axios.post(`${API_URL}/auth/login`, {
        identifier: newUsername,
        password: newPassword,
        actor: 'STAFF'
      });
      console.log('New user logged in successfully!');
      console.log('Token:', userLogin.data.accessToken);
    } catch (err) {
      console.error('Failed to login as new user:', err.response?.data || err.message);
    }

    // 4. Test Case Insensitivity
    console.log('Attempting login with lowercase username...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        identifier: newUsername.toLowerCase(),
        password: newPassword,
        actor: 'STAFF'
      });
      console.log('Lowercase login successful!');
    } catch (err) {
      console.error('Lowercase login failed:', err.response?.data || err.message);
    }

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

testUserFlow();

