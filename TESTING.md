# Testing Guide for QuickDrop Backend

This guide provides instructions for setting up and running tests for the QuickDrop backend.

## Prerequisites

- Node.js 18 or higher (20+ recommended)
- npm or yarn
- A Supabase project with the required tables and RLS policies

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.test
   ```

2. Update `.env.test` with your Supabase project details:
   ```env
   # Server Configuration
   PORT=5001  # Use a different port for testing
   NODE_ENV=test

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_key_here
   ```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npx jest test/supabase.test.js
```

## Test Structure

- `test/setup.js` - Global test setup and configuration
- `test/supabase.test.js` - Integration tests for Supabase functionality

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required variables are set in `.env.test`
   - Check for typos in variable names

2. **Supabase Connection Issues**
   - Verify your Supabase URL and API keys are correct
   - Check that your Supabase project is running and accessible
   - Ensure CORS is properly configured in your Supabase dashboard

3. **Test Timeouts**
   - Some tests may take longer to run, especially with real API calls
   - Increase the timeout in `jest.config.js` if needed

## Writing New Tests

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Clean up any test data after tests
4. Mock external services when possible to improve test reliability

## Code Coverage

To generate a coverage report:

```bash
npm test -- --coverage
```

The coverage report will be available in the `coverage` directory.
