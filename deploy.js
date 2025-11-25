#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    log(`\n${'='.repeat(50)}`, 'blue');
    log(`Running: ${command}`, 'yellow');
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
    return true;
  } catch (error) {
    log(`\nError executing: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function getGitChanges() {
  try {
    // Get staged and unstaged changes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const diff = execSync('git diff HEAD', { encoding: 'utf-8' });
    const diffStaged = execSync('git diff --cached', { encoding: 'utf-8' });
    
    return {
      status,
      diff: diff + diffStaged,
      hasChanges: status.trim().length > 0
    };
  } catch (error) {
    return { status: '', diff: '', hasChanges: false };
  }
}

function generateCommitMessage() {
  const changes = getGitChanges();
  
  if (!changes.hasChanges) {
    return 'chore: deployment';
  }
  
  const statusLines = changes.status.split('\n').filter(line => line.trim());
  const added = statusLines.filter(line => line.startsWith('A ')).length;
  const modified = statusLines.filter(line => line.startsWith('M ') || line.startsWith(' M')).length;
  const deleted = statusLines.filter(line => line.startsWith('D ')).length;
  const untracked = statusLines.filter(line => line.startsWith('??')).length;
  
  const parts = [];
  if (added > 0) parts.push(`${added} file(s) added`);
  if (modified > 0) parts.push(`${modified} file(s) modified`);
  if (deleted > 0) parts.push(`${deleted} file(s) deleted`);
  if (untracked > 0) parts.push(`${untracked} file(s) added`);
  
  // Try to detect what changed from the diff
  const diff = changes.diff.toLowerCase();
  let changeType = 'chore';
  let description = 'update';
  
  if (diff.includes('firebase') || diff.includes('config')) {
    changeType = 'config';
    description = 'update Firebase configuration';
  } else if (diff.includes('package.json') || diff.includes('dependencies')) {
    changeType = 'deps';
    description = 'update dependencies';
  } else if (diff.includes('component') || diff.includes('jsx') || diff.includes('tsx')) {
    changeType = 'feat';
    description = 'update components';
  } else if (diff.includes('style') || diff.includes('css')) {
    changeType = 'style';
    description = 'update styles';
  } else if (diff.includes('fix') || diff.includes('bug')) {
    changeType = 'fix';
    description = 'fix issues';
  }
  
  const summary = parts.length > 0 ? `: ${parts.join(', ')}` : '';
  return `${changeType}: ${description}${summary}`;
}

function main() {
  log('\n🚀 Starting deployment process...', 'green');
  
  // Step 1: Build
  log('\n📦 Step 1: Building project...', 'blue');
  exec('npm run build');
  
  // Step 2: Deploy Functions (if functions directory exists)
  const functionsDir = path.join(process.cwd(), 'functions')
  if (fs.existsSync(functionsDir)) {
    log('\n🔥 Step 2a: Installing function dependencies...', 'blue');
    const functionsPackageJson = path.join(functionsDir, 'package.json')
    if (fs.existsSync(functionsPackageJson)) {
      try {
        exec('npm install', { cwd: functionsDir });
        log('✅ Function dependencies installed', 'green');
      } catch (error) {
        log('⚠️  Failed to install function dependencies, continuing...', 'yellow');
      }
    }
    
    log('\n🔥 Step 2b: Deploying Cloud Functions...', 'blue');
    try {
      exec('firebase deploy --only functions');
    } catch (error) {
      log('⚠️  Functions deployment failed, continuing with hosting...', 'yellow');
    }
  } else {
    log('⚠️  Functions directory not found, skipping functions deployment', 'yellow');
  }

  // Step 2c: Firebase deploy hosting
  log('\n🔥 Step 2c: Deploying to Firebase Hosting...', 'blue');
  exec('firebase deploy --only hosting');
  
  // Step 3: Git operations
  log('\n📝 Step 3: Committing changes to Git...', 'blue');
  
  // Check if git is initialized
  const gitDir = path.join(process.cwd(), '.git')
  if (!fs.existsSync(gitDir)) {
    log('Initializing git repository...', 'yellow');
    exec('git init');
  }

  // Check if remote is set
  try {
    execSync('git remote get-url origin', { stdio: 'ignore', encoding: 'utf8' });
  } catch (error) {
    log('Setting git remote...', 'yellow');
    exec('git remote add origin git@github.com:colorbulb/nextelitemasteradmin.git');
  }
  
  // Add all changes
  exec('git add .');
  
  // Generate commit message
  const commitMessage = generateCommitMessage();
  log(`\nGenerated commit message: ${commitMessage}`, 'yellow');
  
  // Commit
  exec(`git commit -m "${commitMessage}"`);
  
  // Push
  log('\n📤 Step 4: Pushing to remote...', 'blue');
  exec('git push origin main || git push origin master || git push -u origin main');
  
  log('\n✅ Deployment completed successfully!', 'green');
}

main();

