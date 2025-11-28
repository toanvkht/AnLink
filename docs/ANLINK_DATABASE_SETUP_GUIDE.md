# AnLink Database Setup Guide
## Complete Step-by-Step Instructions

**Project**: AnLink - Link Safety, Verified  
**Database**: PostgreSQL 14+  
**Date**: November 2025

---

## 📋 **What You'll Need:**

- ✅ PostgreSQL 14+ installed
- ✅ Command line or pgAdmin access
- ✅ 2 SQL files (provided):
  - `anlink_schema.sql` - Database structure
  - `anlink_seed_data.sql` - Sample data

---

## 🚀 **Method 1: Command Line (Recommended)**

### **STEP 1: Connect to PostgreSQL**

```bash
# Open terminal/command prompt
# Connect as postgres user
psql -U postgres

# Enter your postgres password when prompted
```

### **STEP 2: Create Database**

```sql
-- Create the database
CREATE DATABASE anlink_dev;

-- Add description
COMMENT ON DATABASE anlink_dev IS 'AnLink Development Database - Anti-Phishing System';

-- Verify it was created
\l

-- You should see anlink_dev in the list
```

### **STEP 3: Exit psql**

```sql
\q
```

### **STEP 4: Execute Schema File**

```bash
# Navigate to where your SQL files are
cd /path/to/your/anlink/database/

# Execute the schema (creates all 18 tables)
psql -U postgres -d anlink_dev -f anlink_schema.sql

# This will take 10-30 seconds
# You should see many "CREATE TABLE" messages
```

**Expected Output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
... (repeats 18 times)
CREATE INDEX
CREATE INDEX
... (repeats 26 times)
CREATE FUNCTION
CREATE TRIGGER
... (repeats 2 times)
CREATE VIEW
... (repeats 3 times)
NOTICE:  ✅ AnLink Database Schema Created Successfully!
NOTICE:  📊 Tables: 18 | Indexes: 26 | Triggers: 2 | Views: 3
NOTICE:  👤 Default admin: admin@anlink.vn (password: Admin123!)
```

### **STEP 5: Execute Seed Data File**

```bash
# Import sample data
psql -U postgres -d anlink_dev -f anlink_seed_data.sql

# This will take 5-15 seconds
```

**Expected Output:**
```
INSERT 0 5
INSERT 0 2
INSERT 0 10
... (multiple inserts)
NOTICE:  === AnLink Seed Data Summary ===
NOTICE:  Users: 7
NOTICE:  Suspicious URLs: 22
NOTICE:  Known Phishing: 6
NOTICE:  URL Checks: 4
NOTICE:  Reports: 2
NOTICE:  Community Feedback: 2
NOTICE:  Threat Feeds: 4
NOTICE:  Education Content: 2
NOTICE:  System Statistics: 7
NOTICE:  ✅ Seed data imported successfully!

NOTICE:  🔐 DEFAULT LOGIN CREDENTIALS:
NOTICE:  Admin: admin@anlink.vn / Admin123!
NOTICE:  Moderator: moderator@anlink.vn / Mod123!
NOTICE:  User: user1@gmail.com / User123!
```

### **STEP 6: Verify Installation**

```bash
# Connect to the database
psql -U postgres -d anlink_dev
```

```sql
-- List all tables (should show 18 tables)
\dt

-- Expected output:
--  Schema |         Name              | Type  |  Owner   
-- --------+---------------------------+-------+----------
--  public | community_feedback        | table | postgres
--  public | education_content         | table | postgres
--  public | extension_alerts          | table | postgres
--  public | extension_sessions        | table | postgres
--  public | feed_items                | table | postgres
--  public | feed_matches              | table | postgres
--  public | known_phishing_urls       | table | postgres
--  public | quiz_attempts             | table | postgres
--  public | reports                   | table | postgres
--  public | safebrowsing_cache        | table | postgres
--  public | scan_results              | table | postgres
--  public | suspicious_urls           | table | postgres
--  public | system_settings           | table | postgres
--  public | system_statistics         | table | postgres
--  public | threat_feeds              | table | postgres
--  public | url_checks                | table | postgres
--  public | user_activity_logs        | table | postgres
--  public | users                     | table | postgres
-- (18 rows)

-- Check a specific table
SELECT * FROM users;

-- You should see 7 users (1 admin, 2 moderators, 4 community users)

-- Check suspicious URLs
SELECT COUNT(*) FROM suspicious_urls;
-- Should return: 22

-- Check system settings
SELECT * FROM system_settings;
-- Should show 8 settings

-- Exit
\q
```

---

## 🖥️ **Method 2: Using pgAdmin (GUI)**

### **STEP 1: Open pgAdmin 4**

1. Launch pgAdmin 4
2. Enter master password
3. Connect to your PostgreSQL server (localhost)

### **STEP 2: Create Database**

1. Right-click **"Databases"** → **"Create"** → **"Database..."**
2. Fill in:
   - **Database**: `anlink_dev`
   - **Owner**: `postgres`
   - **Encoding**: `UTF8`
   - **Comment**: `AnLink Development Database`
3. Click **"Save"**

### **STEP 3: Execute Schema File**

1. Click on **anlink_dev** database to select it
2. Click **Tools** → **Query Tool** (or press Alt+Shift+Q)
3. Click **folder icon** (Open File)
4. Select `anlink_schema.sql`
5. Click **▶️ Execute/Refresh** (or press F5)
6. Wait for execution (10-30 seconds)
7. Check **Messages** tab for success messages

### **STEP 4: Execute Seed Data File**

1. In the same Query Tool
2. Click **folder icon** again
3. Select `anlink_seed_data.sql`
4. Click **▶️ Execute/Refresh** (or press F5)
5. Check **Messages** tab for summary

### **STEP 5: Verify Tables**

1. In left sidebar, expand **anlink_dev** → **Schemas** → **public** → **Tables**
2. You should see 18 tables
3. Right-click any table → **View/Edit Data** → **All Rows**
4. Check that data is present

---

## ✅ **Verification Checklist**

After setup, verify everything works:

```bash
# Connect
psql -U postgres -d anlink_dev
```

```sql
-- 1. Check table count (should be 18)
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected: 18

-- 2. Check if users were created (should be 7)
SELECT COUNT(*) FROM users;

-- Expected: 7

-- 3. Check default admin exists
SELECT email, full_name, role 
FROM users 
WHERE role = 'admin';

-- Expected:
--        email         |      full_name       | role  
-- ---------------------+----------------------+-------
--  admin@anlink.vn    | AnLink Administrator | admin

-- 4. Check indexes were created (should be 26)
SELECT COUNT(*) 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Expected: 26+

-- 5. Check triggers were created (should be 2)
SELECT COUNT(*) 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Expected: 2

-- 6. Check views were created (should be 3)
SELECT COUNT(*) 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Expected: 3

-- 7. Test a view
SELECT * FROM v_recent_scans LIMIT 5;

-- Should show recent URL checks

-- 8. Check sample URLs
SELECT domain, status 
FROM suspicious_urls 
WHERE status = 'confirmed_phishing' 
LIMIT 5;

-- Should show phishing URLs like paypa1.com, faceb00k.com, etc.

-- All good? Exit!
\q
```

---

## 🔐 **Default Login Credentials**

**IMPORTANT**: These are for development only. **Change in production!**

### **Admin Account:**
```
Email: admin@anlink.vn
Password: Admin123!
Role: admin
```

### **Moderator Account:**
```
Email: moderator@anlink.vn
Password: Mod123!
Role: moderator
```

### **Regular User Account:**
```
Email: user1@gmail.com
Password: User123!
Role: community_user
```

**Password Hash Algorithm**: bcrypt with 12 rounds

---

## 📊 **Database Summary**

After successful setup, you'll have:

### **Tables (18 total):**
1. `users` - 7 records (1 admin, 2 moderators, 4 users)
2. `user_activity_logs` - 0 records (empty, fills during usage)
3. `suspicious_urls` - 22 records (10 safe brands + 12 phishing)
4. `known_phishing_urls` - 6 records (confirmed patterns)
5. `url_checks` - 4 records (sample scans)
6. `scan_results` - 0 records (fills during checks)
7. `safebrowsing_cache` - 0 records (fills during API calls)
8. `threat_feeds` - 4 records (APWG, PhishTank, OpenPhish, Google)
9. `feed_items` - 0 records (fills during feed sync)
10. `feed_matches` - 0 records (fills during matching)
11. `reports` - 2 records (sample user reports)
12. `community_feedback` - 2 records (sample votes/comments)
13. `education_content` - 2 records (2 articles)
14. `quiz_attempts` - 0 records (fills when users take quizzes)
15. `system_statistics` - 7 records (last 7 days)
16. `extension_sessions` - 0 records (fills with extension usage)
17. `extension_alerts` - 0 records (fills with extension alerts)
18. `system_settings` - 8 records (configuration)

### **Indexes:** 26
### **Triggers:** 2
- Auto-increment `check_count` in `suspicious_urls`
- Auto-update `updated_at` in `education_content`

### **Views:** 3
- `v_recent_scans` - Recent URL checks with details
- `v_pending_reports` - Reports awaiting moderation
- `v_dashboard_daily_stats` - Daily statistics summary

---

## 🔧 **Next Steps**

After database is set up:

### **1. Connect Backend to Database**

Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anlink_dev
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Example:
# DB_PASSWORD=AnLink2025!
```

Create `backend/src/config/database.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0]);
  }
});

module.exports = { pool };
```

### **2. Test Backend Connection**

Create `backend/test-db.js`:
```javascript
require('dotenv').config();
const { pool } = require('./src/config/database');

async function testDatabase() {
  try {
    // Test 1: Connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful:', result.rows[0]);

    // Test 2: Count users
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('✅ Users in database:', userCount.rows[0].count);

    // Test 3: Get admin user
    const admin = await pool.query(
      'SELECT email, full_name, role FROM users WHERE role = $1',
      ['admin']
    );
    console.log('✅ Admin user:', admin.rows[0]);

    // Test 4: Get phishing URLs
    const phishing = await pool.query(
      'SELECT COUNT(*) FROM suspicious_urls WHERE status = $1',
      ['confirmed_phishing']
    );
    console.log('✅ Phishing URLs:', phishing.rows[0].count);

    console.log('\n🎉 All database tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database test failed:', err);
    process.exit(1);
  }
}

testDatabase();
```

Run test:
```bash
cd backend
node test-db.js
```

Expected output:
```
✅ Database connected: { now: 2025-11-28T... }
✅ Connection successful: { now: 2025-11-28T... }
✅ Users in database: 7
✅ Admin user: { email: 'admin@anlink.vn', full_name: 'AnLink Administrator', role: 'admin' }
✅ Phishing URLs: 6

🎉 All database tests passed!
```

### **3. Create First API Endpoint**

Create `backend/src/routes/auth.js`:
```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Test endpoint: Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, email, full_name, role, status, created_at FROM users'
    );
    
    res.json({
      service: 'AnLink API',
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Database error'
    });
  }
});

module.exports = router;
```

Update `backend/src/server.js`:
```javascript
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

Test:
```bash
# Start backend
npm run dev

# In another terminal or browser:
curl http://localhost:5000/api/auth/users

# Or open in browser:
http://localhost:5000/api/auth/users
```

---

## 🐛 **Troubleshooting**

### **Problem 1: "database anlink_dev does not exist"**
**Solution:**
```sql
-- Connect to postgres database first
psql -U postgres

-- Then create anlink_dev
CREATE DATABASE anlink_dev;
\q

-- Now run schema
psql -U postgres -d anlink_dev -f anlink_schema.sql
```

### **Problem 2: "permission denied"**
**Solution:**
```sql
-- Grant all permissions
psql -U postgres -d anlink_dev

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### **Problem 3: "relation already exists"**
**Solution:** Database already has tables. To reset:
```sql
-- CAREFUL! This deletes everything
DROP DATABASE anlink_dev;
CREATE DATABASE anlink_dev;
-- Then run schema again
```

### **Problem 4: Backend can't connect**
**Solution:**
```bash
# Check .env file exists
ls backend/.env

# Check PostgreSQL is running
# Windows:
services.msc  # Look for postgresql service

# Mac:
brew services list

# Linux:
sudo systemctl status postgresql

# Check connection manually
psql -U postgres -d anlink_dev
```

### **Problem 5: "password authentication failed"**
**Solution:**
```bash
# Reset postgres password
psql -U postgres
\password postgres
# Enter new password
\q

# Update .env file with new password
```

---

## 📝 **Database Maintenance**

### **Backup Database**
```bash
# Backup entire database
pg_dump -U postgres anlink_dev > anlink_backup_$(date +%Y%m%d).sql

# Backup only schema (no data)
pg_dump -U postgres --schema-only anlink_dev > anlink_schema_backup.sql

# Backup only data
pg_dump -U postgres --data-only anlink_dev > anlink_data_backup.sql
```

### **Restore Database**
```bash
# Drop existing (CAREFUL!)
psql -U postgres -c "DROP DATABASE anlink_dev;"

# Create new
psql -U postgres -c "CREATE DATABASE anlink_dev;"

# Restore
psql -U postgres -d anlink_dev < anlink_backup_20251128.sql
```

### **Reset to Fresh State**
```bash
# Complete reset
psql -U postgres -c "DROP DATABASE IF EXISTS anlink_dev;"
psql -U postgres -c "CREATE DATABASE anlink_dev;"
psql -U postgres -d anlink_dev -f anlink_schema.sql
psql -U postgres -d anlink_dev -f anlink_seed_data.sql
```

---

## ✅ **Success!**

Your AnLink database is now ready! 🎉

**What you have:**
- ✅ PostgreSQL database: `anlink_dev`
- ✅ 18 tables with proper relationships
- ✅ 26 indexes for fast queries
- ✅ 2 triggers for automation
- ✅ 3 views for common queries
- ✅ 7 sample users (including admin)
- ✅ 22 sample URLs (safe + phishing)
- ✅ Sample reports and feedback
- ✅ System configuration ready

**Next Steps:**
1. ✅ Connect backend to database
2. ⏳ Create API endpoints (Week 5-7)
3. ⏳ Implement algorithm (Week 6)
4. ⏳ Build frontend (Week 8-10)

**Keep this guide handy for reference!** 📚

---

**AnLink Database Setup Complete!** 🛡️

For questions or issues, refer to:
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Your project files in /mnt/user-data/outputs/
