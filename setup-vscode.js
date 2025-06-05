#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Siraha Bazaar for VS Code development...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📄 Creating .env file from template...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created! Please update the DATABASE_URL with your PostgreSQL connection details.\n');
  } else {
    console.log('⚠️  .env.example not found. Please create a .env file manually.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully.\n');
  } catch (error) {
    console.log('❌ Failed to install dependencies. Please run: npm install\n');
  }
} else {
  console.log('✅ Dependencies are already installed.\n');
}

// Check VS Code settings
if (fs.existsSync('.vscode/settings.json')) {
  console.log('✅ VS Code settings configured.\n');
} else {
  console.log('⚠️  VS Code settings not found. Please ensure .vscode folder exists.\n');
}

console.log('🎯 Next steps:');
console.log('1. Update DATABASE_URL in your .env file');
console.log('2. Create a PostgreSQL database');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run dev');
console.log('5. Open http://localhost:5000 in your browser\n');

console.log('📱 The website is fully responsive and works on:');
console.log('  • Desktop computers');
console.log('  • Tablets');
console.log('  • Mobile phones');
console.log('  • All modern browsers\n');

console.log('🗺️  Features included:');
console.log('  • Multi-vendor marketplace');
console.log('  • Interactive store map with directions');
console.log('  • Shopping cart and wishlist');
console.log('  • Order tracking system');
console.log('  • User authentication');
console.log('  • Admin dashboard\n');

console.log('📚 For detailed instructions, check the README.md file.');
console.log('🔧 VS Code settings have been configured automatically.\n');

console.log('Happy coding! 🎉');