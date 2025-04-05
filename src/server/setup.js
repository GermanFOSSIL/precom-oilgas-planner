
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Setting up SQLite database and server...');

// Install dependencies if not already installed
console.log('Checking dependencies...');
const dependencies = ['better-sqlite3', 'express', 'cors', 'body-parser'];

const checkDependencies = () => {
  try {
    dependencies.forEach(dep => require.resolve(dep));
    console.log('All dependencies installed.');
    return true;
  } catch (e) {
    console.log('Missing dependencies, installing...');
    return false;
  }
};

if (!checkDependencies()) {
  exec('npm install better-sqlite3 express cors body-parser', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing dependencies: ${error}`);
      return;
    }
    console.log(`Dependencies installed successfully.`);
    initDatabase();
  });
} else {
  initDatabase();
}

function initDatabase() {
  try {
    // This will initialize the database when required
    require('./db');
    console.log('Database initialized successfully.');
    console.log('\nSetup complete! You can now start the server with:');
    console.log('  npm run start     # For production');
    console.log('  npm run start:dev # For development with auto-reload');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
