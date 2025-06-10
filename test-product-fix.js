#!/usr/bin/env node

// Test product creation with auto-generated slug
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

async function testProductCreationFix() {
  console.log('Testing Product Creation with Auto-Generated Slug...');
  
  // Use existing store (ID 27 from logs - SS clothing center)
  const storeId = 27;
  
  // Test product creation WITHOUT slug
  const productData = {
    name: 'Test Clothing Item',
    description: 'A test clothing product',
    price: '599.99',
    originalPrice: '799.99',
    stock: 25,
    storeId: storeId,
    categoryId: 3,
    images: ['https://via.placeholder.com/400x400?text=Clothing'],
    productType: 'retail'
  };
  
  const productCreation = await testAPI('/api/products', 'POST', productData);
  console.log(`Product Creation (auto-slug): ${productCreation.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (!productCreation.success) {
    console.log('Error:', productCreation.data.error);
    if (productCreation.data.details) {
      console.log('Details:', productCreation.data.details);
    }
    return;
  }
  
  console.log(`Product ID: ${productCreation.data.id}`);
  console.log(`Product Name: ${productCreation.data.name}`);
  console.log(`Generated Slug: ${productCreation.data.slug}`);
  console.log('✅ Product creation is now working with auto-generated slug!');
  
  // Test another product with special characters in name
  const productData2 = {
    name: 'Men\'s Casual T-Shirt & Jeans Set!',
    description: 'Comfortable casual wear for men',
    price: '1299.99',
    stock: 15,
    storeId: storeId,
    categoryId: 3,
    productType: 'retail'
  };
  
  const productCreation2 = await testAPI('/api/products', 'POST', productData2);
  console.log(`Product Creation 2 (special chars): ${productCreation2.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (productCreation2.success) {
    console.log(`Generated Slug 2: ${productCreation2.data.slug}`);
  }
}

testProductCreationFix().catch(console.error);