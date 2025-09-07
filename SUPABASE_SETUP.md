# Supabase Integration Guide

This guide will help you set up and integrate Supabase with your QuickDrop backend.

## Prerequisites

1. A Supabase account (sign up at [https://supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Basic understanding of REST APIs and JWT authentication

## Setup Instructions

### 1. Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in your project details and database password
4. Wait for your project to be provisioned

### 2. Set up environment variables

Update your `.env` file with the following Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
```

You can find these values in your Supabase project settings:
- Go to Project Settings > API
- `SUPABASE_URL` is the Project URL
- `SUPABASE_ANON_KEY` is the anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` is the service_role key (keep this secure!)

### 3. Set up the database schema

1. Go to the SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy the contents of `supabase/migrations/0001_initial_schema.sql`
4. Run the query to create the necessary tables and functions

### 4. Configure Authentication Providers (Optional)

In your Supabase dashboard:
1. Go to Authentication > Providers
2. Enable Email/Password provider (or any other providers you want to use)
3. Configure the provider settings as needed

### 5. Configure CORS (if needed)

If your frontend is running on a different domain:
1. Go to Authentication > URL Configuration
2. Add your frontend URL to the "Site URL" and any additional redirect URLs
3. Add your frontend domain to the CORS origins in the API settings

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }
  ```

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- `GET /api/auth/me` - Get current user profile (requires auth token)

### Detection History

- `POST /api/history` - Add new detection
  ```json
  {
    "user_id": "user-uuid-here",
    "people_count": 5
  }
  ```

- `GET /api/history?userId=user-uuid-here&limit=10&offset=0` - Get detection history
- `GET /api/history/summary?userId=user-uuid-here&startDate=2023-01-01&endDate=2023-12-31` - Get summary statistics

## Security Notes

1. Never expose your `SUPABASE_SERVICE_ROLE_KEY` in client-side code
2. Always use HTTPS in production
3. Keep your JWT secret secure and don't commit it to version control
4. Regularly rotate your secrets in production

## Troubleshooting

- If you get authentication errors, verify your Supabase credentials
- Check the browser console and network tab for detailed error messages
- Make sure your database tables and RLS policies are set up correctly
- Check the Supabase logs for any server-side errors

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client Reference](https://supabase.com/docs/reference/javascript/initializing)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
