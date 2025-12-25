const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runEducationSeed() {
  const client = await pool.connect();

  try {
    console.log('Running education seed data...');

    const seedPath = path.join(__dirname, '..', 'database', 'education_seed_data.sql');
    let sql = fs.readFileSync(seedPath, 'utf8');

    // Split by INSERT statements and execute one by one
    const statements = sql
      .split(/;\s*(?=INSERT|DELETE|--)/i)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Found ${statements.length} statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.toLowerCase().startsWith('insert') || stmt.toLowerCase().startsWith('delete')) {
        try {
          await client.query(stmt + ';');
          console.log(`Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          console.error(`Error in statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }

    console.log('Education seed data completed!');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    client.release();
    process.exit(1);
  }
}

runEducationSeed();
