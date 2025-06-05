#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
  console.log('📦 Dependencies not found. Please run: npm install\n');
} else {
  console.log('✅ Dependencies are installed.\n');
}

console.log('🎯 Next steps:');
console.log('1. Update DATABASE_URL in your .env file');
console.log('2. Create a PostgreSQL database');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run dev');
console.log('5. Open http://localhost:5000 in your browser\n');

console.log('📚 For detailed instructions, check the README.md file.');
console.log('🔧 VS Code settings have been configured automatically.\n');

console.log('Happy coding! 🎉');