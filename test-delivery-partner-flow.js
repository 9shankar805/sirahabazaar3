
const https = require('https');
const http = require('http');

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const isHttps = process.env.REPL_URL && process.env.REPL_URL.startsWith('https');
    const hostname = process.env.REPL_URL ? process.env.REPL_URL.replace(/https?:\/\//, '') : 'localhost';
    const port = process.env.REPL_URL ? (isHttps ? 443 : 80) : 5000;
    
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = (isHttps ? https : http).request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            ok: false,
            status: res.statusCode,
            data: { error: responseData }
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

function logResult(testName, success, details = '') {
  const status = success ? '✅ WORKING' : '❌ ISSUE';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testDeliveryPartnerFlow() {
  console.log('🚚 TESTING DELIVERY PARTNER APPLICATION FLOW');
  console.log('=' .repeat(60));

  const timestamp = Date.now();
  
  // Test 1: Register a new user for delivery partner
  console.log('\n1. Testing User Registration for Delivery Partner:');
  const registrationData = {
    email: `delivery-partner-${timestamp}@test.com`,
    password: 'password123',
    fullName: 'Test Delivery Partner',
    phone: `+977-98${timestamp.toString().slice(-8)}`,
    address: 'Test Address, Siraha',
    role: 'delivery_partner'
  };

  const registrationResult = await makeRequest('/api/auth/register', 'POST', registrationData);
  
  if (!registrationResult.ok) {
    logResult('User Registration', false, `Error: ${JSON.stringify(registrationResult.data)}`);
    return;
  }

  const userId = registrationResult.data.user?.id || registrationResult.data.id;
  logResult('User Registration', true, `User ID: ${userId}`);

  // Test 2: Create delivery partner application
  console.log('\n2. Testing Delivery Partner Application:');
  const deliveryPartnerData = {
    userId: userId,
    vehicleType: 'motorcycle',
    vehicleNumber: 'BA-1-PA-1234',
    drivingLicense: 'DL123456789',
    idProofType: 'Aadhar',
    idProofNumber: '123456789012',
    deliveryAreas: ['Siraha', 'Lahan'],
    emergencyContact: '+977-9876543210',
    bankAccountNumber: '1234567890',
    ifscCode: 'BANK001234'
  };

  const applicationResult = await makeRequest('/api/delivery-partners/signup', 'POST', deliveryPartnerData);
  
  if (!applicationResult.ok) {
    logResult('Delivery Partner Application', false, `Error: ${JSON.stringify(applicationResult.data)}`);
    return;
  }

  const partnerId = applicationResult.data.id;
  logResult('Delivery Partner Application', true, `Partner ID: ${partnerId}`);

  // Test 3: Check if application appears in admin panel
  console.log('\n3. Testing Admin Panel - View Applications:');
  const allPartnersResult = await makeRequest('/api/delivery-partners');
  
  if (allPartnersResult.ok) {
    const foundPartner = allPartnersResult.data.find(p => p.id === partnerId);
    if (foundPartner) {
      logResult('Admin Panel - View Applications', true, `Status: ${foundPartner.status}`);
    } else {
      logResult('Admin Panel - View Applications', false, 'Partner not found in admin panel');
    }
  } else {
    logResult('Admin Panel - View Applications', false, `API Error: ${JSON.stringify(allPartnersResult.data)}`);
  }

  // Test 4: Check pending applications endpoint
  console.log('\n4. Testing Admin Panel - Pending Applications:');
  const pendingResult = await makeRequest('/api/delivery-partners/pending');
  
  if (pendingResult.ok) {
    const foundPending = pendingResult.data.find(p => p.id === partnerId);
    if (foundPending) {
      logResult('Admin Panel - Pending Applications', true, `Found in pending list`);
    } else {
      logResult('Admin Panel - Pending Applications', false, 'Partner not found in pending list');
    }
  } else {
    logResult('Admin Panel - Pending Applications', false, `API Error: ${JSON.stringify(pendingResult.data)}`);
  }

  // Test 5: Approve the application (simulate admin action)
  console.log('\n5. Testing Admin Approval:');
  const approvalResult = await makeRequest(`/api/delivery-partners/${partnerId}/approve`, 'POST', { adminId: 1 });
  
  if (approvalResult.ok) {
    logResult('Admin Approval', true, `Partner approved successfully`);
    
    // Test 6: Verify status change
    const statusCheckResult = await makeRequest(`/api/delivery-partners/user?userId=${userId}`);
    if (statusCheckResult.ok && statusCheckResult.data.status === 'approved') {
      logResult('Status Verification', true, 'Status changed to approved');
    } else {
      logResult('Status Verification', false, `Status: ${statusCheckResult.data?.status || 'unknown'}`);
    }
  } else {
    logResult('Admin Approval', false, `Error: ${JSON.stringify(approvalResult.data)}`);
  }

  console.log('\n🎉 DELIVERY PARTNER APPLICATION FLOW TEST COMPLETED');
}

testDeliveryPartnerFlow().catch(console.error);
