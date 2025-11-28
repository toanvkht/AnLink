# 🚀 Complete Step-by-Step Implementation Guide
## Anti-Phishing System Database Setup

---

## 📋 Table of Contents

1. [Prerequisites & Software Installation](#prerequisites--software-installation)
2. [Local Development Setup](#local-development-setup)
3. [AWS Cloud Setup](#aws-cloud-setup)
4. [Database Creation & Configuration](#database-creation--configuration)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Next Steps - Application Integration](#next-steps---application-integration)

---

## Prerequisites & Software Installation

### Step 1.1: Install PostgreSQL

#### For Windows:
1. **Download PostgreSQL 14 or higher**
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Choose PostgreSQL 14.x (or latest version)
   - File size: ~300 MB

2. **Run the Installer**
   ```
   Double-click: postgresql-14.x-windows-x64.exe
   ```

3. **Installation Wizard**
   - Click "Next" through welcome screen
   - Installation directory: `C:\Program Files\PostgreSQL\14` (default is fine)
   - Select components: ✅ Check ALL boxes
     - PostgreSQL Server
     - pgAdmin 4
     - Stack Builder
     - Command Line Tools
   - Data directory: `C:\Program Files\PostgreSQL\14\data` (default)
   - **Set password for 'postgres' user**: 
     ```
     Password: YourStrongPassword123!
     (WRITE THIS DOWN - YOU'LL NEED IT!)
     ```
   - Port: `5432` (default)
   - Locale: `Default locale`
   - Click "Next" → "Install"

4. **Verify Installation**
   - Open Command Prompt (cmd)
   ```bash
   psql --version
   ```
   Expected output: `psql (PostgreSQL) 14.x`

#### For macOS:
1. **Install Homebrew** (if not installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install PostgreSQL**
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

3. **Set password for postgres user**
   ```bash
   psql postgres
   \password postgres
   # Enter password: YourStrongPassword123!
   \q
   ```

#### For Linux (Ubuntu/Debian):
```bash
# Update package list
sudo apt update

# Install PostgreSQL 14
sudo apt install postgresql-14 postgresql-contrib-14

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password
sudo -u postgres psql
\password postgres
# Enter password: YourStrongPassword123!
\q
```

---

### Step 1.2: Install pgAdmin (GUI Tool)

#### If not installed with PostgreSQL:

**Windows/Mac:**
- Download from: https://www.pgadmin.org/download/
- Run installer
- Launch pgAdmin 4
- Set master password (for pgAdmin itself)

**Linux:**
```bash
sudo apt install pgadmin4
```

---

### Step 1.3: Install AWS CLI (for DynamoDB setup)

#### Windows:
1. Download: https://awscli.amazonaws.com/AWSCLIV2.msi
2. Run installer
3. Verify:
   ```cmd
   aws --version
   ```

#### macOS:
```bash
brew install awscli
aws --version
```

#### Linux:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

---

### Step 1.4: Install Git (to download your files)

**Download**: https://git-scm.com/downloads

Verify:
```bash
git --version
```

---

### Step 1.5: Install a Code Editor (Optional but recommended)

**VS Code** (Recommended):
- Download: https://code.visualcode.com/
- Install with default settings
- Install extension: **PostgreSQL** by Chris Kolkman

**Or DBeaver** (Database-specific):
- Download: https://dbeaver.io/download/
- Supports PostgreSQL with visual query builder

---

## Local Development Setup

### Step 2.1: Create Local PostgreSQL Database

#### Method A: Using Command Line

1. **Open Terminal/Command Prompt**

2. **Connect to PostgreSQL**
   ```bash
   psql -U postgres
   # Enter password: YourStrongPassword123!
   ```

3. **Create Database**
   ```sql
   CREATE DATABASE antiphishing_dev;
   ```
   Expected output: `CREATE DATABASE`

4. **Verify database created**
   ```sql
   \l
   ```
   You should see `antiphishing_dev` in the list

5. **Connect to your database**
   ```sql
   \c antiphishing_dev
   ```
   Expected output: `You are now connected to database "antiphishing_dev"`

6. **Exit psql**
   ```sql
   \q
   ```

#### Method B: Using pgAdmin (GUI)

1. **Launch pgAdmin 4**
2. **Right-click on "Databases" → Create → Database**
3. **Fill in form**:
   - Database: `antiphishing_dev`
   - Owner: `postgres`
   - Encoding: `UTF8`
4. **Click "Save"**

---

### Step 2.2: Load Database Schema

#### Method A: Using Command Line

1. **Download your database_schema.sql file** (from outputs folder)

2. **Navigate to the file location**
   ```bash
   cd /path/to/your/downloads
   # Example Windows: cd C:\Users\YourName\Downloads
   # Example Mac/Linux: cd ~/Downloads
   ```

3. **Execute the SQL script**
   ```bash
   psql -U postgres -d antiphishing_dev -f database_schema.sql
   ```
   
4. **Enter password when prompted**

5. **Expected output**:
   ```
   CREATE EXTENSION
   CREATE TABLE
   CREATE INDEX
   CREATE TABLE
   ... (repeats for all 18 tables)
   CREATE TRIGGER
   CREATE VIEW
   INSERT 0 1
   ```

#### Method B: Using pgAdmin

1. **Open pgAdmin**
2. **Navigate**: Servers → PostgreSQL 14 → Databases → antiphishing_dev
3. **Right-click on antiphishing_dev → Query Tool**
4. **Open file**: File → Open → Select `database_schema.sql`
5. **Execute**: Press F5 or click ▶️ (Execute/Refresh) button
6. **Check messages tab** for success/errors

---

### Step 2.3: Verify Tables Created

#### Using Command Line:
```bash
psql -U postgres -d antiphishing_dev

# List all tables
\dt

# Expected output: List of relations showing all 18 tables
```

Expected tables:
```
 Schema |         Name         | Type  |  Owner   
--------+----------------------+-------+----------
 public | community_feedback   | table | postgres
 public | education_content    | table | postgres
 public | extension_alerts     | table | postgres
 public | extension_sessions   | table | postgres
 public | feed_items           | table | postgres
 public | feed_matches         | table | postgres
 public | known_phishing_urls  | table | postgres
 public | quiz_attempts        | table | postgres
 public | reports              | table | postgres
 public | safebrowsing_cache   | table | postgres
 public | scan_results         | table | postgres
 public | suspicious_urls      | table | postgres
 public | system_settings      | table | postgres
 public | system_statistics    | table | postgres
 public | threat_feeds         | table | postgres
 public | url_checks           | table | postgres
 public | user_activity_logs   | table | postgres
 public | users                | table | postgres
(18 rows)
```

#### Check default admin user:
```sql
SELECT email, full_name, role FROM users;
```

Expected output:
```
        email          |      full_name       | role  
-----------------------+----------------------+-------
 admin@antiphishing.vn | System Administrator | admin
```

---

### Step 2.4: Test Sample Queries

```sql
-- Test 1: Insert a test user
INSERT INTO users (email, password_hash, full_name, role) 
VALUES (
  'test@example.com', 
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva',
  'Test User',
  'community_user'
);

-- Test 2: Insert a suspicious URL
INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, domain)
VALUES (
  'https://fake-vietinbank.com/login',
  'https://fake-vietinbank.com/login',
  'abc123def456',
  'fake-vietinbank.com'
);

-- Test 3: Query the URL
SELECT * FROM suspicious_urls WHERE domain = 'fake-vietinbank.com';

-- Test 4: Check system settings
SELECT setting_key, setting_value FROM system_settings;
```

---

## AWS Cloud Setup

### Step 3.1: Create AWS Account

1. **Go to**: https://aws.amazon.com/
2. **Click "Create an AWS Account"**
3. **Fill in details**:
   - Email address
   - Password
   - AWS account name: `antiphishing-project`
4. **Contact information**:
   - Account type: Personal (for student projects)
   - Full name, phone, address
5. **Payment information**:
   - Credit/debit card (required, but free tier available)
6. **Identity verification**:
   - Receive SMS/phone call with code
7. **Select Support Plan**:
   - Choose "Basic support - Free"
8. **Complete!**

---

### Step 3.2: Configure AWS CLI

1. **Create IAM User** (safer than using root account)

   a. **Login to AWS Console**: https://console.aws.amazon.com/
   
   b. **Navigate to IAM**:
      - Search bar → type "IAM" → click "IAM"
   
   c. **Create User**:
      - Left menu → Users → "Add users"
      - User name: `antiphishing-admin`
      - Access type: ✅ Programmatic access
      - Click "Next: Permissions"
   
   d. **Set Permissions**:
      - "Attach existing policies directly"
      - Search and select:
        - ✅ AmazonDynamoDBFullAccess
        - ✅ AmazonRDSFullAccess
        - ✅ AmazonS3FullAccess
        - ✅ CloudWatchFullAccess
        - ✅ IAMFullAccess
      - Click "Next: Tags" → "Next: Review" → "Create user"
   
   e. **Save Credentials** (VERY IMPORTANT!):
      ```
      Access key ID: AKIAIOSFODNN7EXAMPLE
      Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
      
      ⚠️ SAVE THESE IMMEDIATELY! Secret key shown only once!
      ```

2. **Configure AWS CLI**
   ```bash
   aws configure
   ```

   Enter when prompted:
   ```
   AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
   AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   Default region name [None]: ap-southeast-1
   Default output format [None]: json
   ```

3. **Verify Configuration**
   ```bash
   aws sts get-caller-identity
   ```

   Expected output:
   ```json
   {
       "UserId": "AIDAJ...",
       "Account": "123456789012",
       "Arn": "arn:aws:iam::123456789012:user/antiphishing-admin"
   }
   ```

---

### Step 3.3: Create DynamoDB Tables

#### Method A: Using AWS CLI + CloudFormation (Recommended)

1. **Save CloudFormation template from dynamodb_tables.md**
   
   Create a file: `dynamodb-tables.yaml`
   
   Copy the CloudFormation template from the dynamodb_tables.md file (starting from `AWSTemplateFormatVersion: '2010-09-09'`)

2. **Deploy Stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name antiphishing-dynamodb \
     --template-body file://dynamodb-tables.yaml \
     --region ap-southeast-1
   ```

3. **Monitor Creation**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name antiphishing-dynamodb \
     --region ap-southeast-1 \
     --query 'Stacks[0].StackStatus'
   ```

   Keep running until output is: `"CREATE_COMPLETE"`

4. **Verify Tables Created**
   ```bash
   aws dynamodb list-tables --region ap-southeast-1
   ```

   Expected output:
   ```json
   {
       "TableNames": [
           "AntiPhishing-RealTimeScans",
           "AntiPhishing-LiveDashboard",
           "AntiPhishing-ExtensionSessions",
           "AntiPhishing-ApiRateLimits"
       ]
   }
   ```

#### Method B: Using AWS Console (GUI)

1. **Login to AWS Console**: https://console.aws.amazon.com/

2. **Navigate to DynamoDB**:
   - Search bar → "DynamoDB" → Click

3. **Create Table 1: RealTimeScans**
   - Click "Create table"
   - **Table name**: `AntiPhishing-RealTimeScans`
   - **Partition key**: `url_hash` (String)
   - **Sort key**: `timestamp` (Number)
   - **Table settings**: Default settings
   - Scroll down to **Secondary indexes**:
     - Click "Create global index"
     - Index name: `UserScansIndex`
     - Partition key: `user_id` (String)
     - Sort key: `timestamp` (Number)
     - Click "Create index"
   - Add another index:
     - Index name: `ThreatLevelIndex`
     - Partition key: `recommendation` (String)
     - Sort key: `timestamp` (Number)
   - Enable **Time to Live (TTL)**:
     - Click "Additional settings"
     - TTL attribute: `ttl`
   - Click "Create table"

4. **Repeat for remaining 3 tables** (LiveDashboard, ExtensionSessions, ApiRateLimits)
   - Use specifications from `dynamodb_tables.md`

---

### Step 3.4: Create RDS PostgreSQL (Production Database)

⚠️ **Note**: This is for production deployment. For development, use local PostgreSQL from Step 2.

1. **Navigate to RDS in AWS Console**
   - Search → "RDS" → Click

2. **Create Database**
   - Click "Create database"
   - **Creation method**: Standard create
   - **Engine options**: PostgreSQL
   - **Engine version**: PostgreSQL 14.x
   - **Templates**: Free tier (for learning) or Production (for real deployment)

3. **Settings**:
   - **DB instance identifier**: `antiphishing-db`
   - **Master username**: `postgres`
   - **Master password**: `YourStrongPassword123!`
   - Confirm password

4. **Instance configuration**:
   - **DB instance class**: db.t3.micro (free tier eligible)
   - **Storage**: 
     - Storage type: General Purpose SSD (gp2)
     - Allocated storage: 20 GB
     - Enable storage autoscaling: ✅
     - Maximum storage threshold: 100 GB

5. **Connectivity**:
   - **Virtual Private Cloud (VPC)**: Default VPC
   - **Public access**: Yes (for development - set to No for production)
   - **VPC security group**: Create new
     - Name: `antiphishing-db-sg`
   - **Availability Zone**: No preference
   - **Database port**: 5432

6. **Additional configuration**:
   - **Initial database name**: `antiphishing_db`
   - **Backup retention period**: 7 days
   - **Enable encryption**: ✅ (recommended)
   - **Enable Enhanced Monitoring**: ✅

7. **Click "Create database"**
   - Wait ~10-15 minutes for creation

8. **Get Connection Endpoint**:
   - Once status shows "Available"
   - Click on database name → "Connectivity & security"
   - Copy **Endpoint**: `antiphishing-db.xxxxx.ap-southeast-1.rds.amazonaws.com`

9. **Connect to RDS**:
   ```bash
   psql -h antiphishing-db.xxxxx.ap-southeast-1.rds.amazonaws.com \
        -U postgres \
        -d antiphishing_db \
        -p 5432
   ```
   Enter password when prompted

10. **Load Schema to RDS**:
    ```bash
    psql -h antiphishing-db.xxxxx.ap-southeast-1.rds.amazonaws.com \
         -U postgres \
         -d antiphishing_db \
         -f database_schema.sql
    ```

---

## Database Creation & Configuration

### Step 4.1: Create Database Connection File

Create a file: `database_config.json`

```json
{
  "development": {
    "postgresql": {
      "host": "localhost",
      "port": 5432,
      "database": "antiphishing_dev",
      "user": "postgres",
      "password": "YourStrongPassword123!",
      "ssl": false
    },
    "dynamodb": {
      "region": "ap-southeast-1",
      "endpoint": "http://localhost:8000",
      "accessKeyId": "local",
      "secretAccessKey": "local"
    }
  },
  "production": {
    "postgresql": {
      "host": "antiphishing-db.xxxxx.ap-southeast-1.rds.amazonaws.com",
      "port": 5432,
      "database": "antiphishing_db",
      "user": "postgres",
      "password": "YourStrongPassword123!",
      "ssl": true,
      "sslmode": "require"
    },
    "dynamodb": {
      "region": "ap-southeast-1",
      "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
      "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    }
  }
}
```

⚠️ **Important**: 
- Never commit this file to Git!
- Add to `.gitignore`
- Use environment variables in production

---

### Step 4.2: Set Up Environment Variables (Recommended)

Instead of config file, use environment variables:

#### Windows (PowerShell):
```powershell
# Development
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="antiphishing_dev"
$env:DB_USER="postgres"
$env:DB_PASSWORD="YourStrongPassword123!"

# AWS
$env:AWS_REGION="ap-southeast-1"
$env:AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
$env:AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

#### Mac/Linux (Bash):
```bash
# Add to ~/.bashrc or ~/.zshrc
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="antiphishing_dev"
export DB_USER="postgres"
export DB_PASSWORD="YourStrongPassword123!"

export AWS_REGION="ap-southeast-1"
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Reload shell
source ~/.bashrc
```

---

### Step 4.3: Create Database Users with Proper Permissions

```sql
-- Connect to database
psql -U postgres -d antiphishing_dev

-- Create application user roles
CREATE ROLE app_readonly LOGIN PASSWORD 'readonly_password_123';
CREATE ROLE app_readwrite LOGIN PASSWORD 'readwrite_password_123';
CREATE ROLE app_admin LOGIN PASSWORD 'admin_password_123';

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_readwrite;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_readwrite;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_admin;

-- For future tables (ALTER DEFAULT PRIVILEGES)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT ON TABLES TO app_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE ON TABLES TO app_readwrite;

-- Verify
\du
```

---

### Step 4.4: Configure Connection Pooling (for application)

If using Node.js, install pg pool:

```bash
npm install pg
```

Create `db.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'antiphishing_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = { pool };
```

Test connection:

```javascript
const { pool } = require('./db');

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testConnection();
```

---

## Testing & Verification

### Step 5.1: Run Test Queries

Create file: `test_database.sql`

```sql
-- Test 1: Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Test 3: Check foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
ORDER BY tc.table_name;

-- Test 4: Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Test 5: Insert and retrieve test data
BEGIN;

-- Insert test user
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('test@example.com', '$2b$12$test', 'Test User', 'community_user')
RETURNING user_id, email, role;

-- Insert test URL
INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, domain)
VALUES (
  'https://fake-paypal.com/login',
  'https://fake-paypal.com/login',
  'hash123456',
  'fake-paypal.com'
)
RETURNING url_id, domain, status;

-- Insert URL check
INSERT INTO url_checks (url_id, check_source, algorithm_score)
VALUES (
  (SELECT url_id FROM suspicious_urls WHERE url_hash = 'hash123456'),
  'web_form',
  0.85
)
RETURNING check_id, algorithm_score, checked_at;

-- Verify check_count was incremented (by trigger)
SELECT url_id, domain, check_count, last_checked
FROM suspicious_urls
WHERE url_hash = 'hash123456';

ROLLBACK; -- Remove test data
```

Execute:
```bash
psql -U postgres -d antiphishing_dev -f test_database.sql
```

---

### Step 5.2: Test DynamoDB Tables

Create file: `test_dynamodb.js`

```javascript
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function testDynamoDB() {
  console.log('Testing DynamoDB...\n');

  // Test 1: List tables
  const dynamodbService = new AWS.DynamoDB();
  const tables = await dynamodbService.listTables().promise();
  console.log('✅ Tables found:', tables.TableNames);

  // Test 2: Put item in RealTimeScans
  const testItem = {
    url_hash: 'test_hash_123',
    timestamp: Date.now(),
    original_url: 'https://test-phishing.com',
    scan_result: {
      algorithm: { score: 0.85, result: 'dangerous' },
      recommendation: 'block'
    },
    ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  };

  await dynamodb.put({
    TableName: 'AntiPhishing-RealTimeScans',
    Item: testItem
  }).promise();
  console.log('✅ Item inserted into RealTimeScans');

  // Test 3: Get item
  const result = await dynamodb.get({
    TableName: 'AntiPhishing-RealTimeScans',
    Key: {
      url_hash: 'test_hash_123',
      timestamp: testItem.timestamp
    }
  }).promise();
  console.log('✅ Item retrieved:', result.Item);

  // Test 4: Query by user (using GSI)
  const queryResult = await dynamodb.query({
    TableName: 'AntiPhishing-RealTimeScans',
    IndexName: 'ThreatLevelIndex',
    KeyConditionExpression: 'recommendation = :rec',
    ExpressionAttributeValues: {
      ':rec': 'block'
    },
    Limit: 10
  }).promise();
  console.log(`✅ Query successful, found ${queryResult.Items.length} items`);

  // Cleanup
  await dynamodb.delete({
    TableName: 'AntiPhishing-RealTimeScans',
    Key: {
      url_hash: 'test_hash_123',
      timestamp: testItem.timestamp
    }
  }).promise();
  console.log('✅ Test item deleted');

  console.log('\n✅ All DynamoDB tests passed!');
}

testDynamoDB().catch(console.error);
```

Run:
```bash
npm install aws-sdk
node test_dynamodb.js
```

---

### Step 5.3: Performance Testing

Create file: `performance_test.sql`

```sql
-- Enable timing
\timing on

-- Test 1: Fast URL lookup by hash (should be <1ms)
EXPLAIN ANALYZE
SELECT * FROM suspicious_urls WHERE url_hash = 'test_hash_123';

-- Test 2: User's recent checks (should use index)
EXPLAIN ANALYZE
SELECT uc.*, su.original_url
FROM url_checks uc
JOIN suspicious_urls su ON uc.url_id = su.url_id
WHERE uc.user_id = (SELECT user_id FROM users LIMIT 1)
ORDER BY uc.checked_at DESC
LIMIT 50;

-- Test 3: Moderator queue (should be fast with indexes)
EXPLAIN ANALYZE
SELECT r.*, su.original_url, COUNT(cf.feedback_id) as votes
FROM reports r
JOIN suspicious_urls su ON r.url_id = su.url_id
LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
WHERE r.status = 'pending'
GROUP BY r.report_id, su.original_url
ORDER BY r.priority DESC, r.reported_at ASC
LIMIT 20;

-- Test 4: Dashboard statistics (should use pre-built view)
EXPLAIN ANALYZE
SELECT * FROM v_dashboard_daily_stats
WHERE check_date >= CURRENT_DATE - INTERVAL '7 days';
```

Run:
```bash
psql -U postgres -d antiphishing_dev -f performance_test.sql
```

Look for:
- ✅ "Index Scan" (good) vs "Seq Scan" (bad for large tables)
- ✅ Execution time < 10ms for simple queries
- ✅ Execution time < 100ms for complex joins

---

### Step 5.4: Security Verification

```sql
-- Test 1: Verify password hashing (should never show actual password)
SELECT user_id, email, password_hash FROM users LIMIT 1;
-- password_hash should be bcrypt hash starting with $2b$

-- Test 2: Check role-based permissions
SET ROLE app_readonly;
SELECT * FROM users LIMIT 1;  -- Should work
INSERT INTO users (email, password_hash, full_name) 
VALUES ('test@test.com', 'hash', 'Test');  -- Should FAIL

RESET ROLE;

-- Test 3: Verify foreign key constraints
BEGIN;
INSERT INTO url_checks (url_id, check_source)
VALUES ('00000000-0000-0000-0000-000000000000', 'web_form');
-- Should FAIL with foreign key violation
ROLLBACK;

-- Test 4: Check enum constraints
BEGIN;
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('bad@test.com', 'hash', 'Bad Role', 'invalid_role');
-- Should FAIL with check constraint violation
ROLLBACK;
```

---

## Troubleshooting Guide

### Problem 1: "psql: command not found"

**Solution**:
- **Windows**: Add PostgreSQL to PATH
  ```
  Control Panel → System → Advanced → Environment Variables
  Add to PATH: C:\Program Files\PostgreSQL\14\bin
  ```
- **Mac/Linux**: Reinstall PostgreSQL or add to PATH
  ```bash
  export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
  ```

---

### Problem 2: "psql: FATAL: password authentication failed"

**Solution**:
1. Reset password:
   ```bash
   sudo -u postgres psql
   \password postgres
   ```

2. Or edit `pg_hba.conf`:
   - Location: `C:\Program Files\PostgreSQL\14\data\pg_hba.conf` (Windows)
   - Change `md5` to `trust` temporarily for local connections
   - Restart PostgreSQL service

---

### Problem 3: "relation does not exist"

**Cause**: Schema not loaded properly

**Solution**:
1. Verify you're connected to correct database:
   ```sql
   SELECT current_database();
   ```

2. Re-run schema:
   ```bash
   psql -U postgres -d antiphishing_dev -f database_schema.sql
   ```

---

### Problem 4: "permission denied for table"

**Solution**:
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

---

### Problem 5: AWS CLI "Unable to locate credentials"

**Solution**:
```bash
# Reconfigure AWS CLI
aws configure

# Or check credentials file
cat ~/.aws/credentials  # Mac/Linux
type %USERPROFILE%\.aws\credentials  # Windows
```

---

### Problem 6: DynamoDB "Table already exists"

**Solution**:
1. Delete existing table:
   ```bash
   aws dynamodb delete-table --table-name AntiPhishing-RealTimeScans
   ```

2. Wait for deletion:
   ```bash
   aws dynamodb wait table-not-exists --table-name AntiPhishing-RealTimeScans
   ```

3. Recreate table

---

### Problem 7: "Connection timed out" to RDS

**Solution**:
1. Check security group inbound rules:
   - EC2 Dashboard → Security Groups → Find your DB security group
   - Inbound rules should allow:
     - Type: PostgreSQL
     - Port: 5432
     - Source: Your IP address (get from https://whatismyip.com)

2. Verify public accessibility:
   - RDS → Databases → Your database → Connectivity
   - "Publicly accessible" should be "Yes"

---

### Problem 8: "Too many connections" error

**Solution**:
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '5 minutes';

-- Increase max_connections (requires restart)
ALTER SYSTEM SET max_connections = 200;
```

---

## Next Steps - Application Integration

### Step 7.1: Install Database Drivers

**Node.js**:
```bash
npm install pg  # PostgreSQL
npm install aws-sdk  # DynamoDB
```

**Python**:
```bash
pip install psycopg2-binary  # PostgreSQL
pip install boto3  # AWS/DynamoDB
```

---

### Step 7.2: Create Database Connection Module

**Node.js** (`database.js`):
```javascript
const { Pool } = require('pg');
const AWS = require('aws-sdk');

// PostgreSQL connection
const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
});

// DynamoDB connection
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports = { pgPool, dynamoDB };
```

**Python** (`database.py`):
```python
import psycopg2
from psycopg2 import pool
import boto3
import os

# PostgreSQL connection pool
pg_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD')
)

# DynamoDB connection
dynamodb = boto3.resource('dynamodb',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)
```

---

### Step 7.3: Example API Endpoints

**Check URL Endpoint** (Node.js + Express):
```javascript
const express = require('express');
const { pgPool, dynamoDB } = require('./database');
const app = express();

app.post('/api/check-url', async (req, res) => {
  const { url } = req.body;
  
  try {
    // 1. Hash the URL
    const urlHash = crypto.createHash('sha256').update(url).digest('hex');
    
    // 2. Check DynamoDB cache first (fast!)
    const cachedResult = await dynamoDB.get({
      TableName: 'AntiPhishing-RealTimeScans',
      Key: { url_hash: urlHash, timestamp: Date.now() }
    }).promise();
    
    if (cachedResult.Item) {
      return res.json(cachedResult.Item.scan_result);
    }
    
    // 3. Not in cache, check PostgreSQL
    const client = await pgPool.connect();
    
    // Insert or get suspicious_urls
    const urlResult = await client.query(`
      INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, domain)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (url_hash) DO UPDATE SET original_url = EXCLUDED.original_url
      RETURNING url_id
    `, [url, url.toLowerCase(), urlHash, extractDomain(url)]);
    
    const urlId = urlResult.rows[0].url_id;
    
    // 4. Run detection algorithm (your custom logic here)
    const algorithmResult = await runPhishingDetection(url);
    
    // 5. Insert check record
    await client.query(`
      INSERT INTO url_checks (url_id, check_source, algorithm_score, algorithm_result)
      VALUES ($1, 'api', $2, $3)
    `, [urlId, algorithmResult.score, algorithmResult.result]);
    
    client.release();
    
    // 6. Cache in DynamoDB for future requests
    await dynamoDB.put({
      TableName: 'AntiPhishing-RealTimeScans',
      Item: {
        url_hash: urlHash,
        timestamp: Date.now(),
        original_url: url,
        scan_result: algorithmResult,
        ttl: Math.floor(Date.now() / 1000) + 604800 // 7 days
      }
    }).promise();
    
    res.json(algorithmResult);
    
  } catch (error) {
    console.error('Error checking URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));
```

---

### Step 7.4: Set Up Monitoring

**CloudWatch Alarms** (AWS Console):
1. Navigate to CloudWatch → Alarms
2. Create alarm for RDS:
   - Metric: CPUUtilization
   - Threshold: > 80%
   - Action: Send SNS notification

3. Create alarm for DynamoDB:
   - Metric: ConsumedReadCapacityUnits
   - Threshold: > 80% of provisioned
   - Action: Auto-scale or alert

**Application Logging**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log database queries
pgPool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err });
});
```

---

### Step 7.5: Backup Strategy

**Automated RDS Backups**:
- Already configured (7-day retention)
- To take manual snapshot:
  ```bash
  aws rds create-db-snapshot \
    --db-instance-identifier antiphishing-db \
    --db-snapshot-identifier antiphishing-backup-$(date +%Y%m%d)
  ```

**DynamoDB Point-in-Time Recovery**:
- Already enabled in CloudFormation
- Can restore to any point in last 35 days

**Export PostgreSQL Data**:
```bash
# Full database dump
pg_dump -U postgres -d antiphishing_dev -F c -f backup_$(date +%Y%m%d).dump

# Restore from dump
pg_restore -U postgres -d antiphishing_dev -c backup_20241031.dump
```

---

## 🎉 Congratulations!

You now have:
- ✅ PostgreSQL database with 18 tables
- ✅ DynamoDB tables for high-throughput operations
- ✅ AWS RDS for production (optional)
- ✅ Connection configuration
- ✅ Test suite
- ✅ Security setup
- ✅ Monitoring basics

### Quick Reference Card

**Connect to Local Database**:
```bash
psql -U postgres -d antiphishing_dev
```

**Check Database Status**:
```sql
\dt  -- List tables
\di  -- List indexes
\du  -- List users
\l   -- List databases
```

**Common Tasks**:
```bash
# Backup
pg_dump -U postgres -d antiphishing_dev > backup.sql

# Restore
psql -U postgres -d antiphishing_dev < backup.sql

# Reset database
dropdb antiphishing_dev
createdb antiphishing_dev
psql -U postgres -d antiphishing_dev -f database_schema.sql
```

### Need Help?

- 📖 PostgreSQL Docs: https://www.postgresql.org/docs/
- 📖 AWS DynamoDB Docs: https://docs.aws.amazon.com/dynamodb/
- 📖 AWS RDS Docs: https://docs.aws.amazon.com/rds/
- 🎓 PostgreSQL Tutorial: https://www.postgresqltutorial.com/

---

**You're ready to start building your Anti-Phishing application!** 🚀
