# 🚀 Quick Reference Card - Anti-Phishing Database

## Essential Commands Cheat Sheet

---

## PostgreSQL Commands

### Connection
```bash
# Connect to database
psql -U postgres -d antiphishing_dev

# Connect to remote (RDS)
psql -h your-rds-endpoint.amazonaws.com -U postgres -d antiphishing_db
```

### Database Operations
```bash
# Create database
createdb antiphishing_dev

# Drop database (⚠️ CAREFUL!)
dropdb antiphishing_dev

# Load schema
psql -U postgres -d antiphishing_dev -f database_schema.sql

# Backup database
pg_dump -U postgres -d antiphishing_dev > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres -d antiphishing_dev < backup_20241106.sql
```

### Inside psql
```sql
-- List databases
\l

-- Connect to database
\c antiphishing_dev

-- List tables
\dt

-- Describe table
\d users

-- List indexes
\di

-- List users/roles
\du

-- Show current database
SELECT current_database();

-- Exit
\q
```

---

## Common SQL Queries

### User Management
```sql
-- Create new user
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('user@example.com', '$2b$12$...', 'John Doe', 'community_user');

-- Get user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Update user role
UPDATE users SET role = 'moderator' WHERE email = 'user@example.com';

-- Activate/suspend user
UPDATE users SET status = 'suspended' WHERE user_id = 'uuid-here';
```

### URL Checking
```sql
-- Check if URL exists
SELECT * FROM suspicious_urls WHERE url_hash = 'hash-here';

-- Get URL check history
SELECT uc.*, su.original_url
FROM url_checks uc
JOIN suspicious_urls su ON uc.url_id = su.url_id
WHERE su.domain = 'suspicious-site.com'
ORDER BY uc.checked_at DESC;

-- Find high-risk URLs
SELECT su.original_url, kp.severity, kp.target_brand
FROM suspicious_urls su
JOIN known_phishing_urls kp ON su.url_id = kp.url_id
WHERE kp.severity IN ('high', 'critical') AND kp.active = true;
```

### Reports & Moderation
```sql
-- Get pending reports
SELECT r.*, su.original_url, u.email AS reporter
FROM reports r
JOIN suspicious_urls su ON r.url_id = su.url_id
JOIN users u ON r.reported_by = u.user_id
WHERE r.status = 'pending'
ORDER BY r.priority DESC, r.reported_at ASC;

-- Confirm phishing report
UPDATE reports 
SET status = 'confirmed', 
    reviewed_by = 'admin-uuid',
    reviewed_at = CURRENT_TIMESTAMP
WHERE report_id = 'report-uuid';

-- Add to blacklist
INSERT INTO known_phishing_urls (url_id, domain_pattern, severity, confirmed_by)
VALUES ('url-uuid', 'phishing-site.com', 'high', 'admin-uuid');
```

### Statistics
```sql
-- Today's stats
SELECT 
  COUNT(*) as total_scans,
  SUM(CASE WHEN aggregated_recommendation = 'safe' THEN 1 ELSE 0 END) as safe,
  SUM(CASE WHEN aggregated_recommendation = 'suspicious' THEN 1 ELSE 0 END) as suspicious,
  SUM(CASE WHEN aggregated_recommendation = 'block' THEN 1 ELSE 0 END) as blocked
FROM url_checks
WHERE DATE(checked_at) = CURRENT_DATE;

-- Top targeted brands
SELECT target_brand, COUNT(*) as count
FROM known_phishing_urls
WHERE active = true
GROUP BY target_brand
ORDER BY count DESC
LIMIT 10;

-- User activity summary
SELECT 
  u.email,
  COUNT(DISTINCT uc.check_id) as scans,
  COUNT(DISTINCT r.report_id) as reports
FROM users u
LEFT JOIN url_checks uc ON u.user_id = uc.user_id
LEFT JOIN reports r ON u.user_id = r.reported_by
WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.email
ORDER BY scans DESC;
```

---

## AWS CLI Commands

### DynamoDB
```bash
# List tables
aws dynamodb list-tables --region ap-southeast-1

# Describe table
aws dynamodb describe-table \
  --table-name AntiPhishing-RealTimeScans \
  --region ap-southeast-1

# Get item
aws dynamodb get-item \
  --table-name AntiPhishing-RealTimeScans \
  --key '{"url_hash": {"S": "abc123"}, "timestamp": {"N": "1698765432000"}}' \
  --region ap-southeast-1

# Scan table (⚠️ expensive for large tables)
aws dynamodb scan \
  --table-name AntiPhishing-RealTimeScans \
  --max-items 10 \
  --region ap-southeast-1

# Delete table (⚠️ CAREFUL!)
aws dynamodb delete-table \
  --table-name AntiPhishing-RealTimeScans \
  --region ap-southeast-1
```

### RDS
```bash
# List databases
aws rds describe-db-instances --region ap-southeast-1

# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier antiphishing-db \
  --db-snapshot-identifier backup-$(date +%Y%m%d) \
  --region ap-southeast-1

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier antiphishing-db-restored \
  --db-snapshot-identifier backup-20241106 \
  --region ap-southeast-1
```

### CloudFormation
```bash
# Create stack
aws cloudformation create-stack \
  --stack-name antiphishing-dynamodb \
  --template-body file://dynamodb-tables.yaml \
  --region ap-southeast-1

# Check status
aws cloudformation describe-stacks \
  --stack-name antiphishing-dynamodb \
  --region ap-southeast-1

# Delete stack
aws cloudformation delete-stack \
  --stack-name antiphishing-dynamodb \
  --region ap-southeast-1
```

---

## Application Integration

### Node.js Connection Test
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'antiphishing_dev',
  user: 'postgres',
  password: 'your-password'
});

// Test query
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
```

### Python Connection Test
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="antiphishing_dev",
    user="postgres",
    password="your-password"
)

cursor = conn.cursor()
cursor.execute("SELECT NOW()")
print(cursor.fetchone())
cursor.close()
conn.close()
```

---

## Maintenance Tasks

### Daily
```sql
-- Vacuum analyze (optimize tables)
VACUUM ANALYZE;

-- Check database size
SELECT pg_size_pretty(pg_database_size('antiphishing_dev'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Weekly
```bash
# Backup database
pg_dump -U postgres -d antiphishing_dev -F c -f backup_weekly.dump

# Clean old activity logs (keep 90 days)
psql -U postgres -d antiphishing_dev -c "
DELETE FROM user_activity_logs 
WHERE timestamp < CURRENT_DATE - INTERVAL '90 days'
"

# Update statistics tables
psql -U postgres -d antiphishing_dev -c "
INSERT INTO system_statistics (stat_date, total_scans, ...)
SELECT ...
"
```

### Monthly
```sql
-- Rebuild indexes
REINDEX DATABASE antiphishing_dev;

-- Check for unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Troubleshooting

### Database won't start
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # Linux
brew services list  # Mac

# Restart service
sudo systemctl restart postgresql  # Linux
brew services restart postgresql  # Mac
```

### Connection refused
```bash
# Check if PostgreSQL is listening
sudo netstat -tlnp | grep 5432  # Linux
lsof -i :5432  # Mac

# Check pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Reload config
sudo systemctl reload postgresql
```

### Slow queries
```sql
-- Enable timing
\timing on

-- Explain query
EXPLAIN ANALYZE
SELECT * FROM suspicious_urls WHERE domain = 'example.com';

-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Disk space full
```bash
# Check disk usage
df -h

# Find large tables
SELECT 
  schemaname || '.' || tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

# Clean old data
DELETE FROM user_activity_logs WHERE timestamp < CURRENT_DATE - INTERVAL '30 days';
VACUUM FULL;
```

---

## Emergency Contacts & Resources

### Documentation
- PostgreSQL: https://www.postgresql.org/docs/14/
- AWS RDS: https://docs.aws.amazon.com/rds/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/

### Support
- PostgreSQL Community: https://www.postgresql.org/support/
- AWS Support: https://console.aws.amazon.com/support/
- Stack Overflow: https://stackoverflow.com/questions/tagged/postgresql

### Monitoring
- pgAdmin: GUI tool for PostgreSQL
- AWS CloudWatch: Metrics and logs
- DBeaver: Universal database tool

---

## Quick Checks

### ✅ Database Health Check
```sql
-- Connection test
SELECT 1;

-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 18

-- Check default admin exists
SELECT email FROM users WHERE role = 'admin';
-- Expected: admin@antiphishing.vn

-- Check recent activity
SELECT COUNT(*) FROM url_checks WHERE checked_at > CURRENT_DATE - INTERVAL '24 hours';
```

### ✅ AWS Resources Check
```bash
# RDS running
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]'

# DynamoDB tables active
aws dynamodb list-tables | jq '.TableNames | length'
# Expected: 4

# CloudFormation stack healthy
aws cloudformation describe-stacks --query 'Stacks[*].[StackName,StackStatus]'
```

---

## Emergency Recovery

### Restore Database from Backup
```bash
# 1. Stop application
sudo systemctl stop your-app

# 2. Drop corrupted database
dropdb antiphishing_dev

# 3. Create new database
createdb antiphishing_dev

# 4. Restore from backup
psql -U postgres -d antiphishing_dev < backup_20241106.sql

# 5. Verify restoration
psql -U postgres -d antiphishing_dev -c "\dt"

# 6. Start application
sudo systemctl start your-app
```

### Rollback Migration
```sql
-- If schema changes broke something
BEGIN;

-- Your rollback SQL here
DROP TABLE IF EXISTS new_table_that_broke_things;

-- Verify
\dt

COMMIT;  -- or ROLLBACK if not right
```

---

## Performance Tips

1. **Use connection pooling** (pg-pool2 for Node.js)
2. **Index frequently queried columns** (already done in schema)
3. **Use EXPLAIN ANALYZE** before production deployment
4. **Set appropriate timeouts** (statement_timeout = 30s)
5. **Monitor slow queries** (pg_stat_statements extension)
6. **Use DynamoDB for high-frequency reads**
7. **Cache frequently accessed data** (Redis)
8. **Partition large tables** (url_checks by date)

---

**Print this card and keep it handy during development!** 📄
