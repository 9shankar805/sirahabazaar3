const BASE_URL = 'http://localhost:5000';

async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { error: error.message }
    };
  }
}

function logResult(testName, success, details = '') {
  const status = success ? '✅ WORKING' : '❌ ERROR FOUND';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function checkCoreAPIEndpoints() {
  console.log('🔍 CHECKING CORE API ENDPOINTS');
  console.log('=' .repeat(50));

  const endpoints = [
    { path: '/api/products', name: 'Products API' },
    { path: '/api/stores', name: 'Stores API' },
    { path: '/api/categories', name: 'Categories API' },
    { path: '/api/delivery-zones', name: 'Delivery Zones API' },
    { path: '/api/calculate-delivery-fee', name: 'Delivery Fee Calculator', method: 'POST', data: { distance: 5 } }
  ];

  let errorCount = 0;
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, endpoint.method || 'GET', endpoint.data);
    
    if (result.ok) {
      logResult(endpoint.name, true, `Status: ${result.status}`);
    } else {
      logResult(endpoint.name, false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
      errorCount++;
    }
  }

  return errorCount;
}

async function checkUserAuthentication() {
  console.log('\n🔐 CHECKING USER AUTHENTICATION');
  console.log('=' .repeat(50));

  let errorCount = 0;

  // Test user registration
  const registerData = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123',
    fullName: 'Test User',
    phone: '+977-98-12345678',
    address: 'Test Address',
    role: 'customer'
  };

  const registerResult = await makeRequest('/api/auth/register', 'POST', registerData);
  
  if (registerResult.ok) {
    logResult('User Registration', true, 'New user created successfully');
    
    // Test login with the registered user
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      email: registerData.email,
      password: registerData.password
    });
    
    if (loginResult.ok) {
      logResult('User Login', true, 'Login successful');
    } else {
      logResult('User Login', false, `Login failed: ${JSON.stringify(loginResult.data)}`);
      errorCount++;
    }
  } else {
    logResult('User Registration', false, `Registration failed: ${JSON.stringify(registerResult.data)}`);
    errorCount++;
  }

  return errorCount;
}

async function checkDatabaseConnectivity() {
  console.log('\n🗄️ CHECKING DATABASE CONNECTIVITY');
  console.log('=' .repeat(50));

  let errorCount = 0;

  // Test basic database queries through API
  const tests = [
    { endpoint: '/api/products', name: 'Products Query' },
    { endpoint: '/api/stores', name: 'Stores Query' },
    { endpoint: '/api/users', name: 'Users Query' }
  ];

  for (const test of tests) {
    const result = await makeRequest(test.endpoint);
    
    if (result.ok && Array.isArray(result.data)) {
      logResult(test.name, true, `Retrieved ${result.data.length} records`);
    } else {
      logResult(test.name, false, `Database query failed: ${JSON.stringify(result.data)}`);
      errorCount++;
    }
  }

  return errorCount;
}

async function checkBusinessLogic() {
  console.log('\n🧮 CHECKING BUSINESS LOGIC');
  console.log('=' .repeat(50));

  let errorCount = 0;

  // Test delivery fee calculation with different scenarios
  const deliveryTests = [
    { distance: 2, expectedZone: 'Inner City' },
    { distance: 8, expectedZone: 'Suburban' },
    { distance: 20, expectedZone: 'Rural' },
    { distance: 40, expectedZone: 'Extended Rural' }
  ];

  for (const test of deliveryTests) {
    const result = await makeRequest('/api/calculate-delivery-fee', 'POST', { distance: test.distance });
    
    if (result.ok && result.data.zone && result.data.fee) {
      const fee = parseFloat(result.data.fee);
      if (fee > 0) {
        logResult(`Delivery Calculation ${test.distance}km`, true, 
          `Zone: ${result.data.zone.name}, Fee: Rs.${fee}`);
      } else {
        logResult(`Delivery Calculation ${test.distance}km`, false, 'Invalid fee calculation');
        errorCount++;
      }
    } else {
      logResult(`Delivery Calculation ${test.distance}km`, false, 
        `Calculation failed: ${JSON.stringify(result.data)}`);
      errorCount++;
    }
  }

  return errorCount;
}

async function checkAdminFunctionality() {
  console.log('\n👑 CHECKING ADMIN FUNCTIONALITY');
  console.log('=' .repeat(50));

  let errorCount = 0;

  const adminEndpoints = [
    { path: '/api/admin/delivery-zones', name: 'Admin Delivery Zones' },
    { path: '/api/admin/users', name: 'Admin Users Management' },
    { path: '/api/admin/orders', name: 'Admin Orders Management' }
  ];

  for (const endpoint of adminEndpoints) {
    const result = await makeRequest(endpoint.path);
    
    if (result.ok) {
      logResult(endpoint.name, true, `Admin endpoint accessible`);
    } else {
      logResult(endpoint.name, false, `Admin endpoint error: ${JSON.stringify(result.data)}`);
      errorCount++;
    }
  }

  return errorCount;
}

async function checkDataValidation() {
  console.log('\n✅ CHECKING DATA VALIDATION');
  console.log('=' .repeat(50));

  let errorCount = 0;

  // Test invalid data submission
  const invalidTests = [
    {
      endpoint: '/api/auth/register',
      data: { email: 'invalid-email', password: '123' },
      name: 'Invalid Registration Data'
    },
    {
      endpoint: '/api/calculate-delivery-fee',
      data: { distance: -5 },
      name: 'Invalid Delivery Distance'
    },
    {
      endpoint: '/api/calculate-delivery-fee',
      data: { distance: 'not-a-number' },
      name: 'Non-numeric Distance'
    }
  ];

  for (const test of invalidTests) {
    const result = await makeRequest(test.endpoint, 'POST', test.data);
    
    // We expect these to fail with proper error messages
    if (!result.ok && result.data.error) {
      logResult(test.name, true, `Properly rejected with: ${result.data.error}`);
    } else {
      logResult(test.name, false, 'Should have rejected invalid data');
      errorCount++;
    }
  }

  return errorCount;
}

async function checkPerformance() {
  console.log('\n⚡ CHECKING PERFORMANCE');
  console.log('=' .repeat(50));

  let errorCount = 0;

  // Test response times
  const performanceTests = [
    { endpoint: '/api/products', name: 'Products Loading Speed' },
    { endpoint: '/api/stores', name: 'Stores Loading Speed' },
    { endpoint: '/api/delivery-zones', name: 'Delivery Zones Speed' }
  ];

  for (const test of performanceTests) {
    const startTime = Date.now();
    const result = await makeRequest(test.endpoint);
    const responseTime = Date.now() - startTime;
    
    if (result.ok) {
      if (responseTime < 2000) { // Under 2 seconds
        logResult(test.name, true, `Response time: ${responseTime}ms`);
      } else {
        logResult(test.name, false, `Slow response: ${responseTime}ms (>2000ms)`);
        errorCount++;
      }
    } else {
      logResult(test.name, false, `Failed to load: ${JSON.stringify(result.data)}`);
      errorCount++;
    }
  }

  return errorCount;
}

async function runComprehensiveErrorCheck() {
  console.log('🔍 COMPREHENSIVE WEBSITE ERROR CHECK');
  console.log('=' .repeat(60));
  console.log('Checking all website functionality for errors...\n');

  let totalErrors = 0;

  try {
    // Run all checks
    totalErrors += await checkCoreAPIEndpoints();
    totalErrors += await checkUserAuthentication();
    totalErrors += await checkDatabaseConnectivity();
    totalErrors += await checkBusinessLogic();
    totalErrors += await checkAdminFunctionality();
    totalErrors += await checkDataValidation();
    totalErrors += await checkPerformance();

    // Final summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 ERROR CHECK SUMMARY');
    console.log('=' .repeat(60));

    if (totalErrors === 0) {
      console.log('🎉 WEBSITE IS ERROR-FREE!');
      console.log('✅ All systems are working correctly');
      console.log('✅ All APIs are responding properly');
      console.log('✅ Database connectivity is stable');
      console.log('✅ Business logic is functioning');
      console.log('✅ Admin functionality is accessible');
      console.log('✅ Data validation is working');
      console.log('✅ Performance is within acceptable limits');
      console.log('\n📈 Website Status: FULLY OPERATIONAL');
    } else {
      console.log(`❌ FOUND ${totalErrors} ERROR${totalErrors > 1 ? 'S' : ''}`);
      console.log('⚠️ Please review the detailed results above');
      console.log('\n📈 Website Status: NEEDS ATTENTION');
    }

    return totalErrors === 0;

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR during testing:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the comprehensive error check
runComprehensiveErrorCheck().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});