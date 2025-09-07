# QuickDrop Backend

This is the backend service for the QuickDrop application, built with Node.js, Express, and Supabase.

## Features

- User authentication (register, login, profile)
- Detection history management
- Real-time data processing
- Secure API endpoints
- Integration with Supabase for database and authentication

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Environment variables configured (see .env.example)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/QuickDrop.git
   cd QuickDrop/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your Supabase credentials.

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL migrations from `supabase/migrations/0001_initial_schema.sql`
   - Configure authentication providers in Supabase dashboard

## Running the Application

### Development

```bash
npm run dev
```

This will start the development server with hot-reload enabled.

### Production

```bash
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user profile (requires authentication)

### Detection History

- `POST /api/history` - Add new detection record (requires authentication)
- `GET /api/history?userId=<userId>` - Get detection history
- `GET /api/history/summary?userId=<userId>&startDate=<date>&endDate=<date>` - Get summary statistics

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Environment Variables

- `PORT` - Port to run the server on (default: 5000)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Environment (development, test, production)

## Deployment

1. Set up a production database in Supabase
2. Configure environment variables in your hosting platform
3. Deploy the application using your preferred method (Docker, PM2, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
