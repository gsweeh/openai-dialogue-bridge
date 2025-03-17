
const { exec } = require('child_process');
const path = require('path');

// Start the API server
const apiServer = exec('node src/api/index.js', (error) => {
  if (error) {
    console.error(`Error starting API server: ${error}`);
    return;
  }
});

apiServer.stdout.on('data', (data) => {
  console.log(`API Server: ${data}`);
});

apiServer.stderr.on('data', (data) => {
  console.error(`API Server Error: ${data}`);
});

// Start the frontend development server
const frontendServer = exec('npm run dev', (error) => {
  if (error) {
    console.error(`Error starting frontend: ${error}`);
    return;
  }
});

frontendServer.stdout.on('data', (data) => {
  console.log(`Frontend: ${data}`);
});

frontendServer.stderr.on('data', (data) => {
  console.error(`Frontend Error: ${data}`);
});

console.log('Starting servers...');
