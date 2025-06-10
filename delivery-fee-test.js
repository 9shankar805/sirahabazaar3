// Comprehensive testing for distance-based delivery fee calculation system
const baseUrl = 'http://localhost:5000';

// Test data for delivery zones (should match server mock zones)
const expectedZones = [
  { id: 1, name: "Inner City", minDistance: "0", maxDistance: "5", baseFee: "30.00", perKmRate: "5.00", isActive: true },
  { id: 2, name: "Suburban", minDistance: "5.01", maxDistance: "15", baseFee: "50.00", perKmRate: "8.00", isActive: true },
  { id: 3, name: "Rural", minDistance: "15.01", maxDistance: "30", baseFee: "80.00", perKmRate: "12.00", isActive: true },
  { id: 4, name: "Extended Rural", minDistance: "30.01", maxDistance: "100", baseFee: "120.00", perKmRate: "15.00", isActive: true }
];

async function testAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test delivery zone endpoint
async function testDeliveryZones() {
  console.log('\n=== TESTING DELIVERY ZONES ===');
  
  const zones = await testAPI('/api/delivery-zones');
  console.log('Get Delivery Zones:', zones.status === 200 ? 'SUCCESS' : 'FAILED');
  
  if (zones.status === 200) {
    console.log('Number of zones:', zones.data.length);
    zones.data.forEach(zone => {
      console.log(`Zone: ${zone.name} (${zone.minDistance}-${zone.maxDistance}km) - Base: Rs.${zone.baseFee}, Rate: Rs.${zone.perKmRate}/km`);
    });
  }
  
  return zones.status === 200;
}

// Test delivery fee calculation API
async function testDeliveryFeeCalculation() {
  console.log('\n=== TESTING DELIVERY FEE CALCULATION API ===');
  
  // Test cases with expected results
  const testCases = [
    { distance: 2.5, expectedZone: "Inner City", expectedFee: 30 + (2.5 * 5) }, // 42.50
    { distance: 5, expectedZone: "Inner City", expectedFee: 30 + (5 * 5) }, // 55.00
    { distance: 7.5, expectedZone: "Suburban", expectedFee: 50 + (7.5 * 8) }, // 110.00
    { distance: 15, expectedZone: "Suburban", expectedFee: 50 + (15 * 8) }, // 170.00
    { distance: 20, expectedZone: "Rural", expectedFee: 80 + (20 * 12) }, // 320.00
    { distance: 30, expectedZone: "Rural", expectedFee: 80 + (30 * 12) }, // 440.00
    { distance: 50, expectedZone: "Extended Rural", expectedFee: 120 + (50 * 15) }, // 870.00
    { distance: 0, expectedZone: "Inner City", expectedFee: 30 + (0 * 5) }, // 30.00
    { distance: 5.01, expectedZone: "Suburban", expectedFee: 50 + (5.01 * 8) }, // 90.08
    { distance: 15.01, expectedZone: "Rural", expectedFee: 80 + (15.01 * 12) }, // 260.12
    { distance: 30.01, expectedZone: "Extended Rural", expectedFee: 120 + (30.01 * 15) }, // 570.15
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const result = await testAPI('/api/calculate-delivery-fee', 'POST', { distance: testCase.distance });
    
    if (result.status === 200) {
      const { fee, zone, distance, breakdown } = result.data;
      const expectedFee = Math.round(testCase.expectedFee * 100) / 100;
      const actualFee = Math.round(fee * 100) / 100;
      
      const feeMatches = Math.abs(actualFee - expectedFee) < 0.01;
      const zoneMatches = zone && zone.name === testCase.expectedZone;
      
      if (feeMatches && zoneMatches) {
        console.log(`✅ ${testCase.distance}km -> ${zone.name} zone, Rs.${actualFee} (Expected: Rs.${expectedFee})`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.distance}km -> Expected ${testCase.expectedZone} zone Rs.${expectedFee}, Got ${zone?.name || 'null'} Rs.${actualFee}`);
      }
      
      if (breakdown) {
        console.log(`   Breakdown: Base Rs.${breakdown.baseFee} + Distance Rs.${breakdown.distanceFee} = Rs.${breakdown.totalFee}`);
      }
    } else {
      console.log(`❌ ${testCase.distance}km -> API Error: ${result.error || 'Unknown error'}`);
    }
  }
  
  console.log(`\nDelivery Fee Calculation: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Test edge cases
async function testEdgeCases() {
  console.log('\n=== TESTING EDGE CASES ===');
  
  const edgeCases = [
    { distance: -1, shouldFail: true, reason: "Negative distance" },
    { distance: "invalid", shouldFail: true, reason: "Invalid distance type" },
    { distance: null, shouldFail: true, reason: "Null distance" },
    { distance: undefined, shouldFail: true, reason: "Undefined distance" },
    { distance: 200, shouldFail: false, reason: "Distance beyond max zone (should use furthest zone)" },
    { distance: 0.1, shouldFail: false, reason: "Very small distance" },
    { distance: 999, shouldFail: false, reason: "Very large distance" }
  ];
  
  let passedTests = 0;
  let totalTests = edgeCases.length;
  
  for (const testCase of edgeCases) {
    const result = await testAPI('/api/calculate-delivery-fee', 'POST', { distance: testCase.distance });
    
    if (testCase.shouldFail) {
      if (result.status !== 200) {
        console.log(`✅ ${testCase.reason} -> Correctly rejected`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.reason} -> Should have failed but returned Rs.${result.data.fee}`);
      }
    } else {
      if (result.status === 200) {
        console.log(`✅ ${testCase.reason} -> Rs.${result.data.fee} (Zone: ${result.data.zone?.name || 'Fallback'})`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.reason} -> Should have succeeded but failed: ${result.error}`);
      }
    }
  }
  
  console.log(`\nEdge Cases: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Test zone boundary conditions
async function testZoneBoundaries() {
  console.log('\n=== TESTING ZONE BOUNDARIES ===');
  
  const boundaryTests = [
    { distance: 5.0, expectedZone: "Inner City", description: "Upper boundary of Inner City" },
    { distance: 5.01, expectedZone: "Suburban", description: "Lower boundary of Suburban" },
    { distance: 15.0, expectedZone: "Suburban", description: "Upper boundary of Suburban" },
    { distance: 15.01, expectedZone: "Rural", description: "Lower boundary of Rural" },
    { distance: 30.0, expectedZone: "Rural", description: "Upper boundary of Rural" },
    { distance: 30.01, expectedZone: "Extended Rural", description: "Lower boundary of Extended Rural" },
  ];
  
  let passedTests = 0;
  let totalTests = boundaryTests.length;
  
  for (const testCase of boundaryTests) {
    const result = await testAPI('/api/calculate-delivery-fee', 'POST', { distance: testCase.distance });
    
    if (result.status === 200) {
      const { zone } = result.data;
      if (zone && zone.name === testCase.expectedZone) {
        console.log(`✅ ${testCase.description}: ${testCase.distance}km -> ${zone.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.description}: ${testCase.distance}km -> Expected ${testCase.expectedZone}, Got ${zone?.name || 'null'}`);
      }
    } else {
      console.log(`❌ ${testCase.description}: API Error`);
    }
  }
  
  console.log(`\nZone Boundaries: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Test calculation accuracy
async function testCalculationAccuracy() {
  console.log('\n=== TESTING CALCULATION ACCURACY ===');
  
  // Test with precise calculations
  const precisionTests = [
    { distance: 2.75, zone: expectedZones[0] }, // Inner City
    { distance: 8.33, zone: expectedZones[1] }, // Suburban
    { distance: 22.67, zone: expectedZones[2] }, // Rural
    { distance: 45.99, zone: expectedZones[3] }  // Extended Rural
  ];
  
  let passedTests = 0;
  let totalTests = precisionTests.length;
  
  for (const testCase of precisionTests) {
    const result = await testAPI('/api/calculate-delivery-fee', 'POST', { distance: testCase.distance });
    
    if (result.status === 200) {
      const { fee, breakdown } = result.data;
      
      // Calculate expected fee manually
      const baseFee = parseFloat(testCase.zone.baseFee);
      const perKmRate = parseFloat(testCase.zone.perKmRate);
      const expectedFee = baseFee + (testCase.distance * perKmRate);
      const roundedExpectedFee = Math.round(expectedFee * 100) / 100;
      const roundedActualFee = Math.round(fee * 100) / 100;
      
      if (Math.abs(roundedActualFee - roundedExpectedFee) < 0.01) {
        console.log(`✅ ${testCase.distance}km -> Rs.${roundedActualFee} (Expected: Rs.${roundedExpectedFee})`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.distance}km -> Rs.${roundedActualFee} (Expected: Rs.${roundedExpectedFee})`);
      }
      
      if (breakdown) {
        const expectedDistanceFee = Math.round((testCase.distance * perKmRate) * 100) / 100;
        console.log(`   Breakdown: Base Rs.${breakdown.baseFee} + Distance Rs.${breakdown.distanceFee} (Expected: Rs.${expectedDistanceFee})`);
      }
    } else {
      console.log(`❌ ${testCase.distance}km -> API Error`);
    }
  }
  
  console.log(`\nCalculation Accuracy: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Performance test
async function testPerformance() {
  console.log('\n=== TESTING PERFORMANCE ===');
  
  const testCount = 50;
  const distances = Array.from({ length: testCount }, () => Math.random() * 100);
  
  const startTime = Date.now();
  let successCount = 0;
  
  for (const distance of distances) {
    const result = await testAPI('/api/calculate-delivery-fee', 'POST', { distance });
    if (result.status === 200) {
      successCount++;
    }
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / testCount;
  
  console.log(`Performance Test: ${successCount}/${testCount} requests successful`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average time per request: ${averageTime.toFixed(2)}ms`);
  
  return successCount === testCount && averageTime < 100; // Should be under 100ms per request
}

// Main test runner
async function runDeliveryFeeTests() {
  console.log('🚀 Starting Distance-Based Delivery Fee Testing');
  console.log('='.repeat(60));
  
  try {
    const zoneTest = await testDeliveryZones();
    const calculationTest = await testDeliveryFeeCalculation();
    const edgeTest = await testEdgeCases();
    const boundaryTest = await testZoneBoundaries();
    const accuracyTest = await testCalculationAccuracy();
    const performanceTest = await testPerformance();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DELIVERY FEE TESTING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Delivery Zones API: ${zoneTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Fee Calculation Logic: ${calculationTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Edge Case Handling: ${edgeTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Zone Boundary Logic: ${boundaryTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Calculation Accuracy: ${accuracyTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Performance: ${performanceTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    
    const allTestsPassed = zoneTest && calculationTest && edgeTest && boundaryTest && accuracyTest && performanceTest;
    console.log(`\nOverall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return false;
  }
}

// Run if this script is executed directly
if (typeof window === 'undefined') {
  runDeliveryFeeTests();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDeliveryFeeTests };
}