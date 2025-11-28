const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const { pool } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    service: 'AnLink API',
    status: 'OK', 
    message: 'AnLink backend is running!',
    version: '1.0.0',
    database: 'connected'
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    res.json({
      service: 'AnLink API',
      database: 'connected',
      timestamp: result.rows[0].current_time,
      users: result.rows[0].user_count
    });
  } catch (error) {
    res.status(500).json({
      service: 'AnLink API',
      database: 'error',
      error: error.message
    });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    service: 'AnLink API',
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ AnLink Server error:', err);
  res.status(500).json({
    service: 'AnLink API',
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(' AnLink API Server');
  console.log('═══════════════════════════════════════');
  console.log(' Server running on port:', PORT);
  console.log(' Health check:', `http://localhost:${PORT}/api/health`);
  console.log(' Auth endpoints:');
  console.log('   POST', `http://localhost:${PORT}/api/auth/register`);
  console.log('   POST', `http://localhost:${PORT}/api/auth/login`);
  console.log('   GET ', `http://localhost:${PORT}/api/auth/profile`);
  console.log('═══════════════════════════════════════');
});

