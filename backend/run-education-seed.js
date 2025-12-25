const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runEducationSeed() {
  try {
    console.log('Running education seed data...');

    const seedPath = path.join(__dirname, '..', 'database', 'education_seed_data.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    // Execute the SQL directly - pg can handle dollar-quoted strings
    await pool.query(sql);

    console.log('Education seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

runEducationSeed();
