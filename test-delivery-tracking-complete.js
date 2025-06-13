import fetch from 'node-fetch';
import WebSocket from 'ws';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws';

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  return response.json();
}

function logResult(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   ${details}`);
}

async function testHereMapsIntegration() {
  console.log('\n🗺️  TESTING HERE MAPS INTEGRATION');
  
  // Test route calculation
  try {
    const routeData = {
      origin: { lat: 26.4499, lng: 80.3319 },
      destination: { lat: 26.4700, lng: 80.3500 },
      transportMode: 'bicycle'
    };
    
    const routeResult = await makeRequest('/api/maps/route', 'POST', routeData);
    
    if (routeResult.error) {
      logResult('HERE Maps Route Calculation', false, `Error: ${routeResult.error}`);
      if (routeResult.fallback && routeResult.googleMapsLink) {
        logResult('Google Maps Fallback Available', true, routeResult.googleMapsLink);
      }
    } else {
      logResult('HERE Maps Route Calculation', true, `Distance: ${routeResult.distance}m, Duration: ${routeResult.duration}s`);
    }
  } catch (error) {
    logResult('HERE Maps Route Calculation', false, error.message);
  }
  
  // Test geocoding
  try {
    const geocodeResult = await makeRequest('/api/maps/geocode', 'POST', {
      address: 'Kanpur, Uttar Pradesh, India'
    });
    
    if (geocodeResult && geocodeResult.lat && geocodeResult.lng) {
      logResult('HERE Maps Geocoding', true, `Location: ${geocodeResult.lat}, ${geocodeResult.lng}`);
    } else {
      logResult('HERE Maps Geocoding', false, 'No coordinates returned');
    }
  } catch (error) {
    logResult('HERE Maps Geocoding', false, error.message);
  }
  
  // Test travel time estimation
  try {
    const travelTimeResult = await makeRequest('/api/maps/travel-time', 'POST', {
      origin: { lat: 26.4499, lng: 80.3319 },
      destination: { lat: 26.4700, lng: 80.3500 },
      transportMode: 'bicycle'
    });
    
    if (travelTimeResult.duration && travelTimeResult.distance) {
      logResult('HERE Maps Travel Time', true, `${travelTimeResult.duration}s, ${travelTimeResult.distance}m`);
    } else {
      logResult('HERE Maps Travel Time', false, 'Invalid response');
    }
  } catch (error) {
    logResult('HERE Maps Travel Time', false, error.message);
  }
}

async function testDeliveryTrackingWorkflow() {
  console.log('\n🚴 TESTING DELIVERY TRACKING WORKFLOW');
  
  // First, check if we have any existing deliveries
  try {
    const deliveries = await makeRequest('/api/deliveries');
    
    if (deliveries && deliveries.length > 0) {
      const testDeliveryId = deliveries[0].id;
      logResult('Found Existing Delivery', true, `Delivery ID: ${testDeliveryId}`);
      
      // Test tracking initialization
      try {
        const initResult = await makeRequest(`/api/tracking/initialize/${testDeliveryId}`, 'POST');
        logResult('Tracking Initialization', initResult.success, initResult.error || 'Tracking initialized');
      } catch (error) {
        logResult('Tracking Initialization', false, error.message);
      }
      
      // Test location update
      try {
        const locationUpdate = {
          deliveryId: testDeliveryId,
          deliveryPartnerId: 1,
          latitude: 26.4500,
          longitude: 80.3320,
          heading: 45,
          speed: 15,
          accuracy: 5
        };
        
        const locationResult = await makeRequest('/api/tracking/location', 'POST', locationUpdate);
        logResult('Location Update', locationResult.success, locationResult.message || locationResult.error);
      } catch (error) {
        logResult('Location Update', false, error.message);
      }
      
      // Test status update
      try {
        const statusUpdate = {
          status: 'en_route_pickup',
          description: 'Delivery partner is on the way to pickup location',
          latitude: 26.4500,
          longitude: 80.3320,
          updatedBy: 1
        };
        
        const statusResult = await makeRequest(`/api/tracking/status/${testDeliveryId}`, 'PATCH', statusUpdate);
        logResult('Status Update', statusResult.success, statusResult.message || statusResult.error);
      } catch (error) {
        logResult('Status Update', false, error.message);
      }
      
      // Test tracking data retrieval
      try {
        const trackingData = await makeRequest(`/api/tracking/${testDeliveryId}`);
        
        if (trackingData && trackingData.delivery) {
          logResult('Tracking Data Retrieval', true, `Status: ${trackingData.delivery.status || trackingData.delivery.deliveries?.status}`);
          
          if (trackingData.currentLocation) {
            logResult('Current Location Available', true, `Lat: ${trackingData.currentLocation.latitude}, Lng: ${trackingData.currentLocation.longitude}`);
          }
          
          if (trackingData.route) {
            logResult('Route Information Available', true, `Distance: ${trackingData.route.distance}m`);
          }
          
          if (trackingData.statusHistory && trackingData.statusHistory.length > 0) {
            logResult('Status History Available', true, `${trackingData.statusHistory.length} status updates`);
          }
        } else {
          logResult('Tracking Data Retrieval', false, 'No tracking data found');
        }
      } catch (error) {
        logResult('Tracking Data Retrieval', false, error.message);
      }
      
    } else {
      logResult('Existing Deliveries Check', false, 'No deliveries found for testing');
    }
  } catch (error) {
    logResult('Delivery System Check', false, error.message);
  }
}

async function testWebSocketRealTimeConnection() {
  console.log('\n🔗 TESTING WEBSOCKET REAL-TIME CONNECTION');
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      let authSuccess = false;
      let messageReceived = false;
      
      const timeout = setTimeout(() => {
        ws.close();
        logResult('WebSocket Connection Timeout', false, 'Connection timed out after 10 seconds');
        resolve();
      }, 10000);
      
      ws.on('open', () => {
        logResult('WebSocket Connection Established', true);
        
        // Test authentication
        ws.send(JSON.stringify({
          type: 'auth',
          userId: 1,
          userType: 'delivery_partner',
          token: 'test_token'
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth_success') {
            authSuccess = true;
            logResult('WebSocket Authentication', true, message.message);
            
            // Test location update broadcast
            ws.send(JSON.stringify({
              type: 'location_update',
              payload: {
                deliveryId: 1,
                deliveryPartnerId: 1,
                latitude: 26.4501,
                longitude: 80.3321,
                heading: 90,
                speed: 20
              }
            }));
          }
          
          if (message.type === 'location_updated') {
            messageReceived = true;
            logResult('Real-time Location Broadcast', true, 'Location update received');
          }
          
          if (message.type === 'error') {
            logResult('WebSocket Error Response', false, message.message);
          }
          
        } catch (error) {
          logResult('WebSocket Message Parsing', false, error.message);
        }
      });
      
      ws.on('error', (error) => {
        logResult('WebSocket Connection Error', false, error.message);
        clearTimeout(timeout);
        resolve();
      });
      
      ws.on('close', () => {
        clearTimeout(timeout);
        logResult('WebSocket Connection Closed', true);
        
        if (authSuccess) {
          logResult('WebSocket Authentication Flow', true, 'Auth completed successfully');
        }
        
        resolve();
      });
      
    } catch (error) {
      logResult('WebSocket Test Setup', false, error.message);
      resolve();
    }
  });
}

async function testNotificationSystem() {
  console.log('\n🔔 TESTING NOTIFICATION SYSTEM');
  
  // Test delivery assignment notification
  try {
    const notification = await makeRequest('/api/notifications', 'POST', {
      userId: 1,
      type: 'delivery_assignment',
      title: 'New Delivery Assignment',
      message: 'You have been assigned a new delivery order',
      orderId: 1,
      data: {
        pickupAddress: 'Test Store, Kanpur',
        deliveryAddress: 'Customer Address, Kanpur',
        distance: '2.5 km'
      }
    });
    
    if (notification && notification.id) {
      logResult('Delivery Assignment Notification', true, `Notification ID: ${notification.id}`);
    } else {
      logResult('Delivery Assignment Notification', false, 'Failed to create notification');
    }
  } catch (error) {
    logResult('Delivery Assignment Notification', false, error.message);
  }
  
  // Test push notification functionality (if implemented)
  try {
    const pushResult = await makeRequest('/api/notifications/push', 'POST', {
      userId: 1,
      title: 'Order Status Update',
      body: 'Your delivery is now in progress',
      data: { orderId: 1, status: 'en_route' }
    });
    
    logResult('Push Notification System', pushResult.success, pushResult.message || pushResult.error);
  } catch (error) {
    logResult('Push Notification System', false, 'Push notification endpoint not found (may not be implemented)');
  }
}

async function testNavigationFeatures() {
  console.log('\n🧭 TESTING NAVIGATION FEATURES');
  
  // Test Google Maps fallback link generation
  try {
    const routeData = {
      origin: { lat: 26.4499, lng: 80.3319 },
      destination: { lat: 26.4700, lng: 80.3500 }
    };
    
    const routeResult = await makeRequest('/api/maps/route', 'POST', routeData);
    
    if (routeResult.googleMapsLink) {
      logResult('Google Maps Fallback Link', true, 'Fallback navigation available');
      console.log(`   Link: ${routeResult.googleMapsLink}`);
    } else {
      logResult('Google Maps Fallback Link', false, 'No fallback link provided');
    }
  } catch (error) {
    logResult('Google Maps Fallback Test', false, error.message);
  }
}

async function testDeliveryPartnerDashboard() {
  console.log('\n📱 TESTING DELIVERY PARTNER DASHBOARD');
  
  // Test delivery partner deliveries endpoint
  try {
    const partnerDeliveries = await makeRequest('/api/tracking/partner/1/deliveries');
    
    if (Array.isArray(partnerDeliveries)) {
      logResult('Partner Deliveries Endpoint', true, `Found ${partnerDeliveries.length} deliveries`);
    } else {
      logResult('Partner Deliveries Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logResult('Partner Deliveries Endpoint', false, error.message);
  }
  
  // Test delivery status transitions
  const statusFlow = ['assigned', 'en_route_pickup', 'arrived_pickup', 'picked_up', 'en_route_delivery', 'arrived_delivery', 'delivered'];
  
  for (const status of statusFlow) {
    try {
      const statusUpdate = {
        status,
        description: `Status updated to ${status}`,
        latitude: 26.4500 + Math.random() * 0.01,
        longitude: 80.3320 + Math.random() * 0.01,
        updatedBy: 1
      };
      
      const result = await makeRequest('/api/tracking/status/1', 'PATCH', statusUpdate);
      logResult(`Status Transition: ${status}`, result.success, result.message || result.error);
    } catch (error) {
      logResult(`Status Transition: ${status}`, false, error.message);
    }
  }
}

async function runComprehensiveDeliveryTrackingTest() {
  console.log('🚀 COMPREHENSIVE DELIVERY TRACKING SYSTEM TEST');
  console.log('='.repeat(60));
  
  await testHereMapsIntegration();
  await testDeliveryTrackingWorkflow();
  await testWebSocketRealTimeConnection();
  await testNotificationSystem();
  await testNavigationFeatures();
  await testDeliveryPartnerDashboard();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ Comprehensive testing completed');
  console.log('📋 Review the results above to identify any missing features');
  console.log('🔧 Fix any failed tests to ensure complete implementation');
}

runComprehensiveDeliveryTrackingTest().catch(console.error);