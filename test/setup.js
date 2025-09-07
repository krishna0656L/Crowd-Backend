// Load environment variables from .env.test
const path = require('path');
const dotenv = require('dotenv');

// Load .env.test file
const envPath = path.resolve(__dirname, '..', '.env.test');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.warn('Warning: .env.test file not found or could not be loaded');
  console.warn('Please create a .env.test file with the required variables.');
  console.warn('You can copy .env.example to .env.test and update the values.');
}

// Define required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

// Check for missing required variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMessage = `\n❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please create a .env.test file with the following variables:\n' +
    'SUPABASE_URL=your_supabase_project_url\n' +
    'SUPABASE_ANON_KEY=your_supabase_anon_key\n' +
    'JWT_SECRET=your_secure_jwt_secret\n\n' +
    'You can copy .env.example to .env.test and update the values.\n';
  
  console.error('\x1b[31m%s\x1b[0m', errorMessage);
  process.exit(1);
}

// Log environment status
console.log('\n🔧 Test Environment Configuration:');
console.log(`- Node.js version: ${process.version}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`- SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`- SUPABASE_SERVICE_ROLE: ${process.env.SUPABASE_SERVICE_ROLE ? '✅ Set' : '⚠️  Not set (some tests may be skipped)'}\n`);

// Mock the JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, callback) => {
    if (token === 'valid-token') {
      callback(null, { sub: 'mock-user-id' });
    } else {
      callback(new Error('Invalid token'));
    }
  })
}));

// Set default test timeout
const TEST_TIMEOUT = 60000; // 60 seconds
jest.setTimeout(TEST_TIMEOUT);

// Global test state
let testStartTime;

// Add global test lifecycle hooks
beforeEach(() => {
  testStartTime = Date.now();
  const testName = expect.getState().currentTestName;
  console.log(`\n🚀 Starting test: ${testName}`);
  console.log('─'.repeat(20 + testName.length));
});

afterEach(() => {
  const duration = Date.now() - testStartTime;
  const state = expect.getState();
  
  if (state.testPath) {
    const status = state.testResults[state.currentTestId]?.status || 'unknown';
    const statusIcon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`\n${statusIcon} Test '${state.currentTestName}' ${status} in ${duration}ms`);
    console.log('─'.repeat(20 + state.currentTestName.length + duration.toString().length + 20));
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n🚨 Uncaught Exception:', error);
  process.exit(1);
});

console.log('✅ Test environment initialized with timeout:', `${TEST_TIMEOUT}ms\n`);
