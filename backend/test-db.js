require('dotenv').config();
const { pool, query } = require('./src/config/database');

async function testDatabase() {
  console.log('Testing AnLink Database Connection...\n');

  try {
    const timeResult = await query('SELECT NOW() as current_time');
    console.log('   Test 1: Connection successful');
    console.log('   Current time:', timeResult.rows[0].current_time);

    const tablesResult = await query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n Test 2: Tables check');
    console.log('   Total tables:', tablesResult.rows[0].table_count);

    const usersResult = await query('SELECT COUNT(*) as user_count FROM users');
    console.log('\nTest 3: Users check');
    console.log('   Total users:', usersResult.rows[0].user_count);

    const adminResult = await query(`
      SELECT email, full_name, role 
      FROM users 
      WHERE role = 'admin' 
      LIMIT 1
    `);
    console.log('\n Test 4: Admin user check');
    console.log('   Admin:', adminResult.rows[0]);

    const urlsResult = await query('SELECT COUNT(*) as url_count FROM suspicious_urls');
    console.log('\n Test 5: URLs check');
    console.log('   Total URLs:', urlsResult.rows[0].url_count);

    const settingsResult = await query('SELECT COUNT(*) as settings_count FROM system_settings');
    console.log('\n Test 6: System settings check');
    console.log('   Total settings:', settingsResult.rows[0].settings_count);

    console.log('\n All database tests passed!');
    console.log(' AnLink backend is ready to connect to database!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n Database test failed:', error.message);
    console.error('\n Check your .env file settings:');
    console.error('   DB_HOST:', process.env.DB_HOST);
    console.error('   DB_PORT:', process.env.DB_PORT);
    console.error('   DB_NAME:', process.env.DB_NAME);
    console.error('   DB_USER:', process.env.DB_USER);
    console.error('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
    process.exit(1);
  }
}

testDatabase();