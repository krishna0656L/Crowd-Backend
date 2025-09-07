require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

async function createServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
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

  const PORT = parseInt(process.env.PORT || '3000', 10);
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node.js server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Python server will run on port: ${process.env.PYTHON_PORT || 10000}`);
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
