const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const reportRoutes = require('./routes/reportRoutes');           // ⬅️ NEW
const feedbackRoutes = require('./routes/feedbackRoutes');       // ⬅️ NEW
const moderatorRoutes = require('./routes/moderatorRoutes');     // ⬅️ NEW
const adminRoutes = require('./routes/adminRoutes');             // ⬅️ NEW
const educationRoutes = require('./routes/educationRoutes');     // ⬅️ NEW

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    service: 'AnLink API',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: ['authentication', 'url-scanning', 'algorithm', 'reports', 'moderation', 'admin', 'education']
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Database connection successful',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/reports', reportRoutes);           // ⬅️ NEW
app.use('/api/feedback', feedbackRoutes);        // ⬅️ NEW
app.use('/api/moderator', moderatorRoutes);      // ⬅️ NEW
app.use('/api/admin', adminRoutes);              // ⬅️ NEW
app.use('/api/education', educationRoutes);      // ⬅️ NEW

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    service: 'AnLink API',
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET  /api/health',
      'GET  /api/db-test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/profile',
      'PUT  /api/auth/profile',
      'POST /api/auth/change-password',
      'POST /api/scan/check',
      'POST /api/scan/quick',
      'GET  /api/scan/history',
      'GET  /api/scan/details/:checkId',
      'POST /api/reports',
      'GET  /api/reports',
      'GET  /api/reports/my',
      'GET  /api/reports/:reportId',
      'PUT  /api/reports/:reportId',
      'POST /api/feedback',
      'GET  /api/feedback/report/:reportId',
      'PUT  /api/feedback/:feedbackId/helpful',
      'GET  /api/moderator/dashboard',
      'GET  /api/moderator/queue',
      'POST /api/moderator/assign/:reportId',
      'POST /api/moderator/confirm/:reportId',
      'POST /api/moderator/reject/:reportId',
      'GET  /api/moderator/moderators',
      'GET  /api/admin/stats',
      'GET  /api/admin/users',
      'PUT  /api/admin/users/:userId',
      'DELETE /api/admin/users/:userId',
      'GET  /api/admin/logs',
      'GET  /api/education',
      'GET  /api/education/:slug',
      'POST /api/education',
      'PUT  /api/education/:contentId',
      'DELETE /api/education/:contentId'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    service: 'AnLink API',
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   AnLink API Server Running`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================\n');
  console.log('📍 Available Endpoints:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/db-test');
  console.log('\n🔐 Authentication:');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/profile');
  console.log('   PUT  /api/auth/profile');
  console.log('   POST /api/auth/change-password');
  console.log('\n🔍 URL Scanning:');
  console.log('   POST /api/scan/check');
  console.log('   POST /api/scan/quick');
  console.log('   GET  /api/scan/history');
  console.log('   GET  /api/scan/details/:checkId');
  console.log('\n📢 Reports:');
  console.log('   POST /api/reports');
  console.log('   GET  /api/reports');
  console.log('   GET  /api/reports/my');
  console.log('   GET  /api/reports/:reportId');
  console.log('   PUT  /api/reports/:reportId');
  console.log('\n💬 Feedback:');
  console.log('   POST /api/feedback');
  console.log('   GET  /api/feedback/report/:reportId');
  console.log('   PUT  /api/feedback/:feedbackId/helpful');
  console.log('\n👮 Moderator:');
  console.log('   GET  /api/moderator/dashboard');
  console.log('   GET  /api/moderator/queue');
  console.log('   POST /api/moderator/assign/:reportId');
  console.log('   POST /api/moderator/confirm/:reportId');
  console.log('   POST /api/moderator/reject/:reportId');
  console.log('   GET  /api/moderator/moderators');
  console.log('\n👑 Admin:');
  console.log('   GET  /api/admin/stats');
  console.log('   GET  /api/admin/users');
  console.log('   PUT  /api/admin/users/:userId');
  console.log('   DELETE /api/admin/users/:userId');
  console.log('   GET  /api/admin/logs');
  console.log('\n📚 Education:');
  console.log('   GET  /api/education');
  console.log('   GET  /api/education/:slug');
  console.log('   POST /api/education');
  console.log('   PUT  /api/education/:contentId');
  console.log('   DELETE /api/education/:contentId');
  console.log('\n========================================\n');
});