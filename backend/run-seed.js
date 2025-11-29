const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');
require('dotenv').config();

async function runSeed() {
  try {
    console.log('🌱 Starting seed data insertion...\n');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'seed-test-data.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Seed data inserted successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seed data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runSeed();

