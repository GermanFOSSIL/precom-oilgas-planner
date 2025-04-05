
// This file exists outside of package.json to avoid modifying it directly
// This allows us to define scripts without touching the read-only package.json

const { exec } = require('child_process');
const script = process.argv[2];

if (script === 'start') {
  // Production mode
  console.log('Starting server in production mode...');
  exec('node src/server/server.js', { stdio: 'inherit' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
} else if (script === 'start:dev') {
  // Development mode
  console.log('Starting server in development mode...');
  
  // Start the React app in development mode (vite)
  const viteProcess = exec('vite --port 8080', (error, stdout, stderr) => {
    if (error) {
      console.error(`Vite error: ${error}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
  
  viteProcess.stdout.on('data', (data) => {
    console.log(`[VITE] ${data}`);
  });
  
  viteProcess.stderr.on('data', (data) => {
    console.error(`[VITE ERROR] ${data}`);
  });
  
  // Start the Express server
  const serverProcess = exec('node src/server/server.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Server error: ${error}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data}`);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down development environment...');
    viteProcess.kill();
    serverProcess.kill();
    process.exit(0);
  });
} else {
  console.error('Unknown script. Available scripts: start, start:dev');
}
