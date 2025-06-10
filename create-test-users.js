#!/usr/bin/env node

// Script to create comprehensive test users for all roles
const baseUrl = 'http://localhost:5000';

async function createUser(userData) {
  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function setupTestUsers() {
  console.log('Creating comprehensive test users...');
  
  // Create customer user
  const customer = await createUser({
    email: 'customer@example.com',
    password: 'password123',
    fullName: 'Test Customer',
    username: 'testcustomer',
    role: 'customer'
  });
  console.log('Customer user:', customer.status === 201 ? 'CREATED' : 'EXISTS');
  
  // Create store owner user
  const storeOwner = await createUser({
    email: 'teststore@demo.com',
    password: 'password123',
    fullName: 'Test Store Owner',
    username: 'teststore',
    role: 'store_owner'
  });
  console.log('Store owner user:', storeOwner.status === 201 ? 'CREATED' : 'EXISTS');
  
  // Create restaurant owner user
  const restaurantOwner = await createUser({
    email: 'testrestaurant@demo.com',
    password: 'password123',
    fullName: 'Test Restaurant Owner',
    username: 'testrestaurant',
    role: 'restaurant_owner'
  });
  console.log('Restaurant owner user:', restaurantOwner.status === 201 ? 'CREATED' : 'EXISTS');
  
  // Create delivery partner user
  const deliveryPartner = await createUser({
    email: 'testdelivery@demo.com',
    password: 'password123',
    fullName: 'Test Delivery Partner',
    username: 'testdelivery',
    role: 'delivery_partner'
  });
  console.log('Delivery partner user:', deliveryPartner.status === 201 ? 'CREATED' : 'EXISTS');
  
  console.log('Test users setup completed!');
}

setupTestUsers();