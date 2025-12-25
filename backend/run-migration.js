const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log(`Connected to database: ${process.env.DB_NAME}`);

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'anlink_schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove the \c command as we're already connected
    sql = sql.replace(/\\c\s+\w+/g, '');

    // Remove comments starting with --
    sql = sql.split('\n')
      .filter(line => !line.trim().startsWith('--') || line.includes('COMMENT ON'))
      .join('\n');

    console.log('Running schema migration...');
    await client.query(sql);
    console.log('Schema migration completed successfully!');

    await client.end();
  } catch (error) {
    console.error('Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();
