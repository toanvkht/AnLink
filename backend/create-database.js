const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to postgres database to create our new database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database first
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const checkDB = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    if (checkDB.rows.length > 0) {
      console.log(`Database '${process.env.DB_NAME}' already exists`);
    } else {
      // Create the database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database '${process.env.DB_NAME}' created successfully`);
    }

    await client.end();
  } catch (error) {
    console.error('Error creating database:', error.message);
    process.exit(1);
  }
}

createDatabase();
