# Database Design Package - Anti-Phishing System

## 📦 Package Contents

This comprehensive database design package includes:

1. **README.md** - This file (overview and quick reference)
2. **IMPLEMENTATION_GUIDE.md** - 🆕 **Complete step-by-step setup guide (START HERE!)**
3. **database_design.md** - High-level database architecture document
4. **database_schema.sql** - PostgreSQL DDL scripts (ready to execute)
5. **dynamodb_tables.md** - DynamoDB table definitions with CloudFormation
6. **data_dictionary.md** - Complete data dictionary with all table/column details
7. **erd_diagram.png** - Visual Entity Relationship Diagram

---

## 🎯 Quick Start

---

### 🆕 **NEW: Complete Step-by-Step Implementation Guide**

**👉 First time setting up? Start here:**  
### **[📖 IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)**

The implementation guide includes:
- ✅ **Software installation** (PostgreSQL, AWS CLI, pgAdmin, Git)
- ✅ **Step-by-step AWS account setup** with screenshots
- ✅ **Local development database creation** (Windows/Mac/Linux)
- ✅ **RDS production deployment** instructions
- ✅ **DynamoDB table creation** (both GUI and CLI methods)
- ✅ **Environment configuration** and connection setup
- ✅ **Testing & verification scripts** to ensure everything works
- ✅ **Troubleshooting solutions** for common problems
- ✅ **Application integration examples** (Node.js & Python)

**⚠️ Recommended for beginners or first-time setup!**

---

### Quick Setup (For Experienced Users)

### Step 1: Review the Architecture
Start by reading **database_design.md** to understand:
- Hybrid PostgreSQL + DynamoDB approach
- Table purposes and relationships
- Data flow examples
- Scalability considerations

### Step 2: Set Up PostgreSQL Database
```bash
# Create database
createdb antiphishing_db

# Execute schema
psql -d antiphishing_db -f database_schema.sql

# Verify tables created
psql -d antiphishing_db -c "\dt"
```

### Step 3: Set Up DynamoDB Tables (AWS)
```bash
# Deploy CloudFormation stack
cd dynamodb_tables/
aws cloudformation create-stack \
  --stack-name antiphishing-dynamodb \
  --template-body file://dynamodb-tables.yaml \
  --region ap-southeast-1
```

### Step 4: Reference the Data Dictionary
Use **data_dictionary.md** during development to understand:
- Every column's purpose
- Enum values and meanings
- Business rules
- Example data

---

## 📊 Database Architecture Overview

### Hybrid Approach: PostgreSQL + DynamoDB

**PostgreSQL (Amazon RDS)** - Relational data requiring complex queries:
- ✅ User management
- ✅ Phishing reports & community feedback
- ✅ Educational content
- ✅ Historical analytics

**DynamoDB** - High-throughput, low-latency operations:
- ⚡ Real-time URL scans (browser extension)
- ⚡ Live dashboard metrics
- ⚡ Extension session tracking
- ⚡ API rate limiting

### Key Design Decisions

1. **URL Hashing**: SHA-256 hashes enable O(1) duplicate detection
2. **JSON Columns**: JSONB stores flexible metadata (scan details, heuristics)
3. **Triggers**: Auto-increment counters, timestamp updates
4. **Views**: Pre-built queries for common dashboard needs
5. **TTL**: Automatic cleanup of stale cache data
6. **Indexes**: Strategic indexes for all high-frequency queries

---

## 📐 Database Schema Summary

### 7 Main Table Groups

#### 1️⃣ User Management (2 tables)
- `users` - User accounts with RBAC
- `user_activity_logs` - Audit trail

#### 2️⃣ URL & Phishing Detection (4 tables)
- `suspicious_urls` - All submitted URLs
- `known_phishing_urls` - Confirmed blacklist
- `url_checks` - Scan history
- `scan_results` - Detailed algorithm analysis

#### 3️⃣ Third-Party Integration (4 tables)
- `safebrowsing_cache` - Google Safe Browsing cache
- `threat_feeds` - External feed registry
- `feed_items` - Feed entries
- `feed_matches` - Match records

#### 4️⃣ Community Reporting (2 tables)
- `reports` - User-submitted reports
- `community_feedback` - Votes & comments

#### 5️⃣ Educational & Statistics (3 tables)
- `education_content` - Learning materials
- `quiz_attempts` - Gamification tracking
- `system_statistics` - Daily aggregates

#### 6️⃣ Browser Extension (2 tables)
- `extension_sessions` - Usage sessions
- `extension_alerts` - Alert logs

#### 7️⃣ System Configuration (1 table)
- `system_settings` - Key-value config

**Total PostgreSQL Tables: 18**

---

## 🔗 Key Relationships

### Core Data Flow
```
users → reports → suspicious_urls
              ↓
        url_checks → scan_results
              ↓
     known_phishing_urls
```

### URL Check Process
```
1. User submits URL → suspicious_urls (if new)
2. System creates url_checks record
3. Algorithm analyzes → scan_results (component-by-component)
4. Check Google Safe Browsing → safebrowsing_cache
5. Check threat feeds → feed_matches
6. Aggregate results → url_checks.aggregated_recommendation
7. Log activity → user_activity_logs
```

---

## 🗂️ File Descriptions

### 1. database_design.md (24 KB)
**Purpose**: Architecture overview and design documentation

**Contents**:
- Database technology rationale (PostgreSQL + DynamoDB)
- All 18 PostgreSQL table schemas with attributes
- 4 DynamoDB table designs
- Entity relationship summary
- Data flow examples
- Indexing strategy
- Security considerations
- Backup & disaster recovery
- Scalability roadmap
- Sample SQL queries

**When to use**: 
- Understanding overall architecture
- Planning implementation
- Explaining design to team members

---

### 2. database_schema.sql (22 KB)
**Purpose**: Executable PostgreSQL DDL script

**Contents**:
- CREATE TABLE statements for all 18 tables
- All indexes (26 total)
- Foreign key constraints
- Check constraints
- Triggers (2 automated functions)
- Views (3 common queries)
- Default admin user seed
- System settings seed
- Role permissions
- Inline comments

**When to use**:
- Setting up development database
- Creating staging/production databases
- Reference for ORM configuration

**Usage**:
```bash
psql -d your_database -f database_schema.sql
```

---

### 3. dynamodb_tables.md (17 KB)
**Purpose**: DynamoDB table specifications and CloudFormation template

**Contents**:
- Table 1: RealTimeScans (URL scan cache)
- Table 2: LiveDashboard (metrics aggregation)
- Table 3: ExtensionSessions (browser extension tracking)
- Table 4: ApiRateLimits (abuse prevention)
- CloudFormation YAML template
- Deployment instructions
- Cost estimation
- Data migration strategy
- Monitoring setup
- Node.js integration examples

**When to use**:
- Deploying high-throughput components
- Optimizing real-time operations
- Setting up auto-scaling

**Deployment**:
```bash
aws cloudformation create-stack \
  --stack-name antiphishing-dynamodb \
  --template-body file://dynamodb-tables.yaml
```

---

### 4. data_dictionary.md (31 KB)
**Purpose**: Complete reference for every database field

**Contents**:
- All 18 PostgreSQL tables detailed
- Every column with: name, type, constraints, description, examples
- All enum values explained
- Indexes documentation
- Business rules
- Foreign key relationships
- Data retention policies
- Compliance notes (GDPR)
- Change log

**When to use**:
- During development (lookup column purposes)
- Writing API documentation
- Training new team members
- Database migrations

**Example lookup**:
```
Q: What values can reports.status have?
A: pending, under_review, confirmed, rejected, duplicate
```

---

### 5. erd_diagram.png (210 KB)
**Purpose**: Visual representation of all tables and relationships

**Features**:
- Color-coded by module:
  - 🔵 Blue: User Management
  - 🟢 Green: URL Detection
  - 🟠 Orange: Third-party Integration
  - 🟣 Purple: Community Reporting
  - 🟢 Teal: Education
  - 🟤 Brown: Browser Extension
- Shows primary keys (🔑)
- Shows foreign keys (🔗)
- Relationship cardinality
- Key columns only (for clarity)

**When to use**:
- Presentations
- Documentation
- Understanding table relationships
- Onboarding developers

---

## 🔧 Implementation Guide

### Phase 1: Core Tables (Week 1)
```sql
-- Priority 1: User system
users
user_activity_logs

-- Priority 2: URL detection
suspicious_urls
known_phishing_urls
url_checks
scan_results
```

### Phase 2: Integration (Week 2)
```sql
-- External APIs
safebrowsing_cache
threat_feeds
feed_items
feed_matches
```

### Phase 3: Community Features (Week 3)
```sql
-- Reporting system
reports
community_feedback
```

### Phase 4: Additional Features (Week 4)
```sql
-- Education & extension
education_content
quiz_attempts
extension_sessions
extension_alerts
system_statistics
system_settings
```

---

## 📝 Sample Queries

### Check if URL is phishing
```sql
SELECT 
  su.original_url,
  kp.severity,
  kp.target_brand
FROM suspicious_urls su
JOIN known_phishing_urls kp ON su.url_id = kp.url_id
WHERE su.domain = 'suspicious-bank.com'
  AND kp.active = TRUE;
```

### Get user's recent scans
```sql
SELECT 
  uc.checked_at,
  su.original_url,
  uc.aggregated_recommendation,
  uc.algorithm_score
FROM url_checks uc
JOIN suspicious_urls su ON uc.url_id = su.url_id
WHERE uc.user_id = 'user-uuid-here'
ORDER BY uc.checked_at DESC
LIMIT 50;
```

### Moderator dashboard
```sql
SELECT 
  r.report_id,
  r.priority,
  su.original_url,
  u.full_name AS reporter,
  COUNT(cf.feedback_id) AS votes
FROM reports r
JOIN suspicious_urls su ON r.url_id = su.url_id
JOIN users u ON r.reported_by = u.user_id
LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
WHERE r.status = 'pending'
GROUP BY r.report_id, r.priority, su.original_url, u.full_name
ORDER BY r.priority DESC;
```

### Daily statistics
```sql
SELECT 
  stat_date,
  total_scans,
  phishing_count,
  ROUND(phishing_count::NUMERIC / NULLIF(total_scans, 0) * 100, 2) AS phishing_rate_percent
FROM system_statistics
WHERE stat_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY stat_date DESC;
```

---

## 🔐 Security Considerations

### Encryption
- ✅ Passwords: Bcrypt with 12 rounds
- ✅ At-rest: AWS KMS encryption
- ✅ In-transit: TLS 1.3 only
- ✅ PII fields: Application-level encryption

### Access Control
- ✅ PostgreSQL: Role-based (app_readonly, app_readwrite, app_admin)
- ✅ DynamoDB: IAM policies
- ✅ AWS: VPC isolation
- ✅ Application: JWT with short expiry

### Audit & Compliance
- ✅ All admin actions logged
- ✅ GDPR right-to-deletion support
- ✅ Data retention policies
- ✅ Anonymization for analytics

---

## 📊 Performance Optimization

### Indexes Created
- **26 indexes** across 18 tables
- Covering indexes for frequent queries
- Composite indexes for multi-column lookups
- GIN index for full-text search
- Partial indexes for filtered queries

### Query Optimization
- Views cache complex joins
- Materialized views for slow aggregations (future)
- Partitioning for large tables (url_checks, user_activity_logs)
- DynamoDB for sub-millisecond reads

### Caching Strategy
```
Layer 1: Application cache (Redis) - 5 min TTL
Layer 2: DynamoDB - Real-time data
Layer 3: PostgreSQL - Source of truth
```

---

## 🧪 Testing Checklist

### Database Setup
- [ ] PostgreSQL 14+ installed
- [ ] All tables created successfully
- [ ] All indexes created
- [ ] Triggers working (check_count increment)
- [ ] Views returning data
- [ ] Default admin user exists

### Data Integrity
- [ ] Foreign keys enforced
- [ ] Check constraints working
- [ ] Unique constraints preventing duplicates
- [ ] Cascading deletes correct
- [ ] ENUM values validated

### DynamoDB
- [ ] Tables created in correct region
- [ ] GSIs created
- [ ] TTL enabled
- [ ] Point-in-time recovery enabled

### Integration
- [ ] Application connects to PostgreSQL
- [ ] Application connects to DynamoDB
- [ ] Sample data inserted successfully
- [ ] Queries return expected results

---

## 🚀 Deployment Checklist

### Development Environment
- [ ] Local PostgreSQL instance
- [ ] Sample data seeded
- [ ] All queries tested
- [ ] Migrations documented

### Staging Environment
- [ ] AWS RDS PostgreSQL Multi-AZ
- [ ] DynamoDB tables deployed
- [ ] Automated backups configured
- [ ] Monitoring enabled

### Production Environment
- [ ] Read replicas created
- [ ] Auto-scaling configured
- [ ] Backup retention set (30 days)
- [ ] Disaster recovery tested
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## 📚 Additional Resources

### AWS Documentation
- [RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)

### PostgreSQL Resources
- [PostgreSQL 14 Documentation](https://www.postgresql.org/docs/14/)
- [Index Types](https://www.postgresql.org/docs/14/indexes-types.html)

### Tools
- **pgAdmin** - GUI for PostgreSQL
- **DBeaver** - Universal database tool
- **NoSQL Workbench** - DynamoDB design tool
- **dbdiagram.io** - ERD visualization (can import from SQL)

---

## 🐛 Troubleshooting

### Issue: Tables not created
**Solution**: Check PostgreSQL version (requires 14+)
```bash
psql --version
```

### Issue: Foreign key errors
**Solution**: Ensure tables created in correct order (schema.sql handles this)

### Issue: DynamoDB table creation fails
**Solution**: Check IAM permissions
```bash
aws iam get-user
aws dynamodb list-tables
```

### Issue: Slow queries
**Solution**: Analyze and add missing indexes
```sql
EXPLAIN ANALYZE SELECT ...;
CREATE INDEX idx_custom ON table_name(column);
```

---

## 📞 Support

For questions about this database design:
1. Review the **data_dictionary.md** for column details
2. Check the **database_design.md** for architecture decisions
3. Refer to **erd_diagram.png** for relationships

---

## 📜 License & Usage

This database design is created for the Anti-Phishing System project as part of a university final project. Feel free to:
- ✅ Use in your implementation
- ✅ Modify table structures as needed
- ✅ Add custom indexes
- ✅ Extend with additional tables

Remember to:
- 🔒 Update default passwords
- 🔒 Configure proper security groups
- 🔒 Enable encryption
- 🔒 Set up monitoring

---

## 🎓 Learning Outcomes

By using this database design, you'll gain experience with:
- ✅ PostgreSQL advanced features (JSONB, triggers, views)
- ✅ DynamoDB key design and GSIs
- ✅ Hybrid database architectures
- ✅ Database normalization (3NF)
- ✅ AWS cloud services (RDS, DynamoDB)
- ✅ Security best practices
- ✅ Performance optimization

---

**Version**: 1.0  
**Last Updated**: October 31, 2025  
**Author**: Database Design for Anti-Phishing System

**Next Steps**: 
1. ✅ Review architecture → Read `database_design.md`
2. ✅ Create database → Execute `database_schema.sql`
3. ✅ Deploy DynamoDB → Use CloudFormation in `dynamodb_tables.md`
4. ✅ Start coding → Reference `data_dictionary.md`

Good luck with your implementation! 🚀
