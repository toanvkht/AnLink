const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'anlink_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('AnLink Database connected');
});

pool.on('error', (err) => {
  console.error('AnLink Database connection error:', err);
  process.exit(-1);
});

// Helper function to query
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query
};