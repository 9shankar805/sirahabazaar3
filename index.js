#!/usr/bin/env node

// Main application entry point
console.log('Starting Siraha Bazaar application...');

// Use tsx to run the TypeScript server
import { spawn } from 'child_process';

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(1);
  }
});

server.on('error', (error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

console.log('Application started successfully');