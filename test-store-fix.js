#!/usr/bin/env node

// Quick test to verify store creation is working after the fix
const baseURL = 'http://localhost:5000';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${baseURL}${endpoint}`, config);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function testStoreCreationFix() {
  console.log('Testing Store Creation Fix...');
  
  const timestamp = Date.now();
  
  // Test with minimal required data (no postal_code)
  const testUser = {
    email: `fixtest${timestamp}@test.com`,
    password: 'password123',
    username: `fixtest${timestamp}`,
    role: 'shopkeeper',
    fullName: 'Fix Test User'
  };
  
  // Register and login
  const registration = await testAPI('/api/auth/register', 'POST', testUser);
  console.log(`Registration: ${registration.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (!registration.success) {
    console.log('Error:', registration.data.error);
    return;
  }
  
  const login = await testAPI('/api/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  console.log(`Login: ${login.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (!login.success) {
    console.log('Error:', login.data.error);
    return;
  }
  
  // Test store creation WITHOUT postal_code
  const storeData = {
    name: `Fix Test Store ${timestamp}`,
    description: 'Testing store creation without postal code',
    ownerId: login.data.user.id,
    address: 'Test Address, Test City',
    storeType: 'retail'
  };
  
  const storeCreation = await testAPI('/api/stores', 'POST', storeData);
  console.log(`Store Creation (no postal_code): ${storeCreation.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (!storeCreation.success) {
    console.log('Error:', storeCreation.data.error);
    if (storeCreation.data.details) {
      console.log('Details:', storeCreation.data.details);
    }
    return;
  }
  
  console.log(`Store ID: ${storeCreation.data.id}`);
  console.log(`Store Name: ${storeCreation.data.name}`);
  console.log('✅ Store creation is now working without postal_code!');
}

testStoreCreationFix().catch(console.error);