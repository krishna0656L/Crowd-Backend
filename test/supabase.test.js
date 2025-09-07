const request = require('supertest');
const { createServer } = require('../index');
const { createClient } = require('@supabase/supabase-js');
const uuid = require('uuid');
const { v4: uuidv4 } = uuid;
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock the auth middleware to always set a user for testing
jest.mock('../middleware/auth', () => (req, res, next) => {
  // Skip auth for specific test routes if needed
  if (req.path === '/api/auth/register' || req.path === '/api/auth/login') {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  if (token === 'valid-token') {
    req.userId = 'mock-user-id';
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid token' });
});

// Mock Supabase client
jest.mock('@supabase/supabase-js');

// Mock data
const mockUser = {
  id: uuidv4(),
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
  created_at: new Date().toISOString()
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: mockUser
};

// Mock Supabase client methods
const mockFrom = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockData = jest.fn().mockResolvedValue({ data: [], error: null });

// Mock Supabase client implementation
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    admin: {
      listUsers: jest.fn().mockResolvedValue({ data: { users: [mockUser] }, error: null }),
      deleteUser: jest.fn().mockResolvedValue({ error: null }),
      createUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      updateUserById: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
    }
  },
  from: mockFrom,
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  in: mockIn,
  data: mockData
};

// Mock the createClient function
createClient.mockImplementation(() => mockSupabaseClient);

let app, server;

// Setup before all tests
beforeAll(async () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Mock the database responses
  mockFrom.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    data: jest.fn().mockResolvedValue({ data: [], error: null })
  }));

  // Create server instance with a different port for testing
  process.env.PORT = '0'; // Let the OS assign a random port
  const serverInstance = await createServer();
  app = serverInstance.app;
  server = serverInstance.server;
  
  // Wait for server to start
  await new Promise(resolve => server.on('listening', resolve));
});

// Cleanup after all tests
afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('Authentication API', () => {
  let app, server;
  
  beforeAll(async () => {
    // Create server instance before tests
    const serverInstance = await createServer();
    app = serverInstance.app;
    server = serverInstance.server;
  });
  
  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test@12345',
        name: 'Test User'
      };

      // Mock the Supabase auth response
      const mockAuthResponse = {
        data: { 
          user: { 
            id: mockUser.id, 
            email: userData.email,
            user_metadata: { name: userData.name }
          }, 
          session: { 
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: {
              id: mockUser.id,
              email: userData.email,
              user_metadata: { name: userData.name }
            }
          } 
        },
        error: null
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce(mockAuthResponse);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 if email is already registered', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test@12345',
        name: 'Test User'
      };

      // Mock the Supabase auth response for existing user
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User already registered');
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Test@12345'
      };

      // Mock the Supabase auth response
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { 
          user: { 
            id: mockUser.id, 
            email: credentials.email,
            user_metadata: { name: 'Test User' }
          }, 
          session: { 
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token'
          } 
        },
        error: null
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(credentials.email);
    });

    it('should return 401 with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123'
      };

      // Mock the Supabase auth response for invalid credentials
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid login credentials');
    });
    
    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      // Mock the Supabase auth response
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { 
          user: {
            id: mockUser.id,
            email: mockUser.email,
            user_metadata: { name: 'Test User' }
          } 
        },
        error: null
      });

      // Mock the database response
      mockFrom().select.mockResolvedValueOnce({
        data: [{
          id: mockUser.id,
          email: mockUser.email,
          name: 'Test User',
          created_at: new Date().toISOString()
        }],
        error: null
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', mockUser.id);
      expect(response.body).toHaveProperty('email', mockUser.email);
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });
    
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});

describe('Detection History API', () => {
  let app, server;
  const mockDetection = {
    id: uuidv4(),
    user_id: 'mock-user-id',
    people_count: 5,
    timestamp: new Date().toISOString()
  };
  
  beforeAll(async () => {
    // Create server instance before tests
    const serverInstance = await createServer();
    app = serverInstance.app;
    server = serverInstance.server;
  });
  
  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the database methods
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      data: jest.fn().mockResolvedValue({ data: [], error: null })
    }));
  });

  describe('POST /api/history', () => {
    it('should add a new detection record', async () => {
      // Mock the database insert
      mockFrom().insert.mockResolvedValueOnce({
        data: [mockDetection],
        error: null
      });

      const response = await request(app)
        .post('/api/history')
        .set('Authorization', 'Bearer valid-token')
        .send({
          people_count: 5,
          timestamp: mockDetection.timestamp
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('people_count', 5);
      expect(response.body).toHaveProperty('user_id', 'mock-user-id');
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/history')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .post('/api/history')
        .send({
          people_count: 5,
          timestamp: mockDetection.timestamp
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('GET /api/history', () => {
    it('should return detection history for the user', async () => {
      // Mock the database select
      mockFrom().select.mockResolvedValueOnce({
        data: [{
          ...mockDetection,
          user_id: 'mock-user-id'
        }],
        error: null
      });

      const response = await request(app)
        .get('/api/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('user_id', 'mock-user-id');
    });
    
    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/history');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });
    
    it('should return empty array if no detections found', async () => {
      // Mock empty response
      mockFrom().select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const response = await request(app)
        .get('/api/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/history/summary', () => {
    it('should return detection summary', async () => {
      // Mock the database query for summary
      mockFrom().select.mockResolvedValueOnce({
        data: [
          { count: 15, type: 'total_people' },
          { count: 5, type: 'average_people' },
          { count: 3, type: 'detection_count' }
        ],
        error: null
      });

      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/history/summary?start_date=${today}&end_date=${today}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_people', 15);
      expect(response.body).toHaveProperty('average_people', 5);
      expect(response.body).toHaveProperty('detection_count', 3);
    });
    
    it('should return 400 if date range is invalid', async () => {
      const response = await request(app)
        .get('/api/history/summary?start_date=invalid-date&end_date=invalid-date')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return 401 without valid token', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/history/summary?start_date=${today}&end_date=${today}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });
});
