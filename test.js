#!/usr/bin/env node

console.log('Running tests...');

// Run existing test files
import('./comprehensive-test.js').then(() => {
  console.log('✓ Comprehensive tests passed');
}).catch(err => {
  console.error('✗ Comprehensive tests failed:', err.message);
});

import('./delivery-fee-test.js').then(() => {
  console.log('✓ Delivery fee tests passed');
}).catch(err => {
  console.error('✗ Delivery fee tests failed:', err.message);
});

console.log('Test suite completed!');