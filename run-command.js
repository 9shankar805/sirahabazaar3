#!/usr/bin/env node

// This script runs the equivalent of: npm run lint && npm run test && node index.js

import { spawn } from 'child_process';

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    console.log('Step 1: Running lint...');
    await runCommand('node', ['lint.js']);
    
    console.log('\nStep 2: Running tests...');
    await runCommand('node', ['test.js']);
    
    console.log('\nStep 3: Starting application...');
    await runCommand('node', ['index.js']);
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

main();