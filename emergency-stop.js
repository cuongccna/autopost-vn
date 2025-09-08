#!/usr/bin/env node

console.log('🚨 EMERGENCY: Force stopping all Node.js processes...');

const { exec } = require('child_process');

// Try multiple methods to stop Node.js processes
const stopCommands = [
  'taskkill /f /im node.exe',
  'powershell "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"',
  'wmic process where "name=\'node.exe\'" delete'
];

async function tryStop() {
  for (const cmd of stopCommands) {
    try {
      console.log(`Trying: ${cmd}`);
      await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.log(`Command failed: ${error.message}`);
            reject(error);
          } else {
            console.log(`Success: ${stdout}`);
            resolve(stdout);
          }
        });
      });
      break; // If successful, break out of loop
    } catch (error) {
      console.log(`Failed, trying next method...`);
    }
  }
}

tryStop().then(() => {
  console.log('✅ Processes stopped. You can now restart with: npm run dev');
}).catch(() => {
  console.log('❌ Could not stop processes. Try manually closing terminals.');
});
