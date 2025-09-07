require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

async function createServer() {
  const app = express();

  // Parse JSON bodies first
  app.use(express.json());

  // CORS configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Simple test endpoint
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint is working!' });
  });

  // Import routes
  try {
    // Use dynamic imports to catch any module loading errors
    const authRoutes = require('./routes/auth');
    const historyRoutes = require('./routes/history');
    
    // API Routes - use explicit route paths
    app.use('/api/auth', authRoutes);
    app.use('/api/history', historyRoutes);
    
    console.log('Routes loaded successfully');
  } catch (error) {
    console.error('Error loading routes:', error);
    console.error(error.stack);
    process.exit(1);
  }

  // 404 handler - match all routes not handled above
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Using 3001 to avoid conflicts with AirPlay and other services
  const PORT = process.env.PORT || 3001;
  const HOST = '0.0.0.0';
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
  });

  return { app, server };
}

// Only start the server if this file is run directly
if (require.main === module) {
  createServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { createServer };
