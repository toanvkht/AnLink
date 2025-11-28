const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'anlink_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL server is not running or not accessible.');
      console.log('   Please start PostgreSQL and try again.');
    } else if (error.code === '3D000') {
      console.log(`\n💡 Database "${process.env.DB_NAME}" does not exist.`);
      console.log('   Please create it first using:');
      console.log(`   CREATE DATABASE ${process.env.DB_NAME};`);
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed.');
      console.log('   Please check your DB_USER and DB_PASSWORD in .env file.');
    }
    
    process.exit(1);
  }
}

testConnection();
