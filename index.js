#!/usr/bin/env node

// Main application entry point
console.log('Starting Siraha Bazaar application...');

// Import and run the server
import('./server/index.ts').then(() => {
  console.log('Application started successfully');
}).catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});