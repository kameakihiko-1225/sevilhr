#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';

console.log(`🚀 Starting HRSEVIL ATS in ${isProduction ? 'production' : 'development'} mode...\n`);

// Ensure Prisma Client is generated
async function ensurePrismaGenerated() {
  return new Promise((resolve, reject) => {
    console.log('📦 Generating Prisma Client...');
    const prismaGen = spawn('npx', ['prisma', 'generate'], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'inherit',
      shell: true,
    });

    prismaGen.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma Client generated successfully\n');
        resolve();
      } else {
        console.error('❌ Failed to generate Prisma Client');
        reject(new Error(`Prisma generate exited with code ${code}`));
      }
    });
  });
}

// Sync database schema in production using db push
async function syncDatabaseSchema() {
  if (!isProduction) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    console.log('🔄 Syncing database schema...');
    const dbPush = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'inherit',
      shell: true,
    });

    dbPush.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database schema synced\n');
        resolve();
      } else {
        console.error('❌ Database schema sync failed');
        // In production, continue anyway as schema might already be in sync
        console.warn('⚠️  Continuing despite schema sync failure...');
        resolve();
      }
    });
  });
}

// Start backend server
function startBackend() {
  console.log('🔧 Starting backend server...');
  const backendPath = path.join(__dirname, '../backend');
  const backendScript = isProduction ? 'start' : 'dev';
  
  return spawn('npm', ['run', backendScript], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: isProduction ? 'production' : 'development',
    },
  });
}

// Start frontend server
function startFrontend() {
  console.log('🎨 Starting frontend server...');
  const frontendPath = path.join(__dirname, '../frontend');
  const frontendScript = isProduction ? 'start' : 'dev';
  
  return spawn('npm', ['run', frontendScript], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: isProduction ? 'production' : 'development',
    },
  });
}

// Main execution
(async () => {
  try {
    // Generate Prisma Client first
    await ensurePrismaGenerated();

    // Sync database schema in production
    if (isProduction) {
      await syncDatabaseSchema();
    }

    // Start backend and frontend
    const backend = startBackend();
    const frontend = startFrontend();

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

    // Handle child process errors
    backend.on('error', (error) => {
      console.error('❌ Backend error:', error);
      process.exit(1);
    });

    frontend.on('error', (error) => {
      console.error('❌ Frontend error:', error);
      process.exit(1);
    });

    backend.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Backend exited with code ${code}`);
        frontend.kill();
        process.exit(1);
      }
    });

    frontend.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Frontend exited with code ${code}`);
        backend.kill();
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
})();

