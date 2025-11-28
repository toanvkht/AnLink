# Database Design for Fraud Detection & Anti-Phishing System

## Database Technology: Amazon DynamoDB (Primary) + PostgreSQL (Optional for relational data)

Given your AWS focus and the need for scalability, I'm designing a **hybrid approach**:
- **DynamoDB** for high-throughput operations (URL checks, real-time scanning)
- **PostgreSQL/RDS** for complex relational queries (user management, reporting, analytics)

---

## Database Schema Design

### 1. USER MANAGEMENT TABLES

#### 1.1 users
**Purpose**: Store all user accounts across three roles (Community User, Moderator, Admin)

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| user_id | UUID | PRIMARY KEY | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| role | ENUM('community_user', 'moderator', 'admin') | NOT NULL, DEFAULT 'community_user' | User role |
| status | ENUM('active', 'suspended', 'pending') | DEFAULT 'active' | Account status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |
| last_login | TIMESTAMP | NULL | Last login time |
| phone_number | VARCHAR(20) | NULL | Optional contact |
| location | VARCHAR(100) | NULL | User location (for localization) |
| language_preference | VARCHAR(10) | DEFAULT 'vi' | Preferred language (vi/en) |

**Indexes**:
- PRIMARY KEY on user_id
- UNIQUE INDEX on email
- INDEX on role, status

---

#### 1.2 user_activity_logs
**Purpose**: Track user actions for security and audit purposes

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| log_id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique log entry |
| user_id | UUID | FOREIGN KEY → users(user_id) | User who performed action |
| action_type | VARCHAR(50) | NOT NULL | Type of action (login, report, scan, etc.) |
| action_details | JSON | NULL | Additional action metadata |
| ip_address | VARCHAR(45) | NULL | IPv4/IPv6 address |
| user_agent | TEXT | NULL | Browser/extension info |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When action occurred |

**Indexes**:
- PRIMARY KEY on log_id
- INDEX on user_id, timestamp
- INDEX on action_type

---

### 2. URL & PHISHING DETECTION TABLES

#### 2.1 suspicious_urls
**Purpose**: Store all URLs submitted for checking or reported

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| url_id | UUID | PRIMARY KEY | Unique URL identifier |
| original_url | TEXT | NOT NULL | Full URL as submitted |
| normalized_url | TEXT | NOT NULL | Standardized URL (lowercase, etc.) |
| url_hash | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 hash for fast lookup |
| scheme | VARCHAR(10) | NULL | http/https |
| domain | VARCHAR(255) | NOT NULL | Main domain |
| subdomain | VARCHAR(255) | NULL | Subdomain if present |
| path | TEXT | NULL | URL path |
| query_params | TEXT | NULL | Query parameters |
| first_seen | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When first submitted |
| last_checked | TIMESTAMP | NULL | Last scan time |
| check_count | INT | DEFAULT 0 | Number of times checked |
| status | ENUM('pending', 'safe', 'suspicious', 'confirmed_phishing') | DEFAULT 'pending' | Current status |

**Indexes**:
- PRIMARY KEY on url_id
- UNIQUE INDEX on url_hash
- INDEX on domain
- INDEX on status, last_checked

---

#### 2.2 known_phishing_urls
**Purpose**: Confirmed phishing URLs (master blacklist)

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| phishing_id | UUID | PRIMARY KEY | Unique phishing entry |
| url_id | UUID | FOREIGN KEY → suspicious_urls(url_id) | Link to original URL |
| domain_pattern | VARCHAR(255) | NOT NULL | Pattern for matching (e.g., *-paypal.com) |
| full_url_pattern | TEXT | NULL | Complete URL pattern |
| severity | ENUM('low', 'medium', 'high', 'critical') | DEFAULT 'medium' | Threat level |
| phishing_type | VARCHAR(50) | NULL | Type (credential theft, malware, etc.) |
| target_brand | VARCHAR(100) | NULL | Impersonated brand (e.g., "VietinBank") |
| confirmed_by | UUID | FOREIGN KEY → users(user_id) | Moderator/Admin who confirmed |
| confirmed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Confirmation date |
| active | BOOLEAN | DEFAULT TRUE | Is this entry active? |
| notes | TEXT | NULL | Additional information |

**Indexes**:
- PRIMARY KEY on phishing_id
- INDEX on domain_pattern
- INDEX on severity, active
- INDEX on target_brand

---

#### 2.3 url_checks
**Purpose**: Record of each URL scan/check performed

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| check_id | UUID | PRIMARY KEY | Unique check identifier |
| url_id | UUID | FOREIGN KEY → suspicious_urls(url_id) | URL being checked |
| user_id | UUID | FOREIGN KEY → users(user_id), NULL | User who initiated (NULL for extension auto-checks) |
| check_source | ENUM('web_form', 'browser_extension', 'api', 'scheduled') | NOT NULL | How check was initiated |
| algorithm_score | DECIMAL(3,2) | NULL | Score from local algorithm (0.00-1.00) |
| algorithm_result | ENUM('safe', 'suspicious', 'dangerous') | NULL | Algorithm classification |
| safebrowsing_status | VARCHAR(50) | NULL | Google Safe Browsing result |
| feed_match_count | INT | DEFAULT 0 | Number of threat feed matches |
| aggregated_recommendation | ENUM('safe', 'suspicious', 'block') | NULL | Final recommendation |
| response_time_ms | INT | NULL | Time taken for check (milliseconds) |
| checked_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When check occurred |

**Indexes**:
- PRIMARY KEY on check_id
- INDEX on url_id, checked_at
- INDEX on user_id
- INDEX on aggregated_recommendation

---

#### 2.4 scan_results
**Purpose**: Detailed component-level analysis from algorithm

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| result_id | UUID | PRIMARY KEY | Unique result identifier |
| check_id | UUID | FOREIGN KEY → url_checks(check_id) | Associated check |
| component_type | VARCHAR(50) | NOT NULL | Which component (domain, path, query, etc.) |
| component_value | TEXT | NULL | Actual value analyzed |
| similarity_score | DECIMAL(3,2) | NULL | Similarity to known phishing (0.00-1.00) |
| matched_pattern | TEXT | NULL | Pattern it matched against |
| matched_phishing_id | UUID | FOREIGN KEY → known_phishing_urls(phishing_id), NULL | Which phishing entry matched |
| heuristic_flags | JSON | NULL | List of triggered heuristics |
| details | JSON | NULL | Additional analysis data |

**Indexes**:
- PRIMARY KEY on result_id
- INDEX on check_id
- INDEX on component_type, similarity_score

---

### 3. THIRD-PARTY INTEGRATION TABLES

#### 3.1 safebrowsing_cache
**Purpose**: Cache Google Safe Browsing API results to reduce API calls

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| cache_id | UUID | PRIMARY KEY | Unique cache entry |
| url_hash | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 of URL |
| threat_type | VARCHAR(100) | NULL | Threat type from API |
| platform_type | VARCHAR(50) | NULL | Platform (any, windows, etc.) |
| threat_entry_type | VARCHAR(50) | NULL | Entry type (URL, executable) |
| response_data | JSON | NULL | Full API response |
| cached_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Cache creation time |
| expires_at | TIMESTAMP | NOT NULL | When cache expires (24-48 hours) |

**Indexes**:
- PRIMARY KEY on cache_id
- UNIQUE INDEX on url_hash
- INDEX on expires_at

---

#### 3.2 threat_feeds
**Purpose**: Register external threat intelligence feeds

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| feed_id | UUID | PRIMARY KEY | Unique feed identifier |
| feed_name | VARCHAR(100) | NOT NULL | Feed name (e.g., "APWG", "PhishTank") |
| feed_url | TEXT | NULL | Feed source URL |
| feed_type | VARCHAR(50) | NOT NULL | Type (blacklist, whitelist, mixed) |
| update_frequency | INT | NULL | Update interval in hours |
| last_updated | TIMESTAMP | NULL | Last successful update |
| status | ENUM('active', 'inactive', 'error') | DEFAULT 'active' | Feed status |
| priority | INT | DEFAULT 50 | Priority level (1-100) |

**Indexes**:
- PRIMARY KEY on feed_id
- INDEX on status, priority

---

#### 3.3 feed_items
**Purpose**: Individual entries from threat feeds

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| item_id | UUID | PRIMARY KEY | Unique item identifier |
| feed_id | UUID | FOREIGN KEY → threat_feeds(feed_id) | Source feed |
| url_pattern | TEXT | NOT NULL | URL or pattern from feed |
| item_type | VARCHAR(50) | NULL | Type from feed (phishing, malware, etc.) |
| severity | VARCHAR(20) | NULL | Severity level |
| added_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When added to our DB |
| expires_at | TIMESTAMP | NULL | Expiration if temporary |
| metadata | JSON | NULL | Additional feed-specific data |

**Indexes**:
- PRIMARY KEY on item_id
- INDEX on feed_id, added_at
- INDEX on url_pattern (text search)

---

#### 3.4 feed_matches
**Purpose**: Track when a URL matches a threat feed entry

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| match_id | UUID | PRIMARY KEY | Unique match identifier |
| check_id | UUID | FOREIGN KEY → url_checks(check_id) | Associated check |
| feed_id | UUID | FOREIGN KEY → threat_feeds(feed_id) | Which feed matched |
| item_id | UUID | FOREIGN KEY → feed_items(item_id) | Specific feed item |
| match_type | ENUM('exact', 'pattern', 'partial') | NOT NULL | How it matched |
| match_confidence | DECIMAL(3,2) | NULL | Confidence score (0.00-1.00) |
| matched_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When match occurred |

**Indexes**:
- PRIMARY KEY on match_id
- INDEX on check_id
- INDEX on feed_id, match_type

---

### 4. COMMUNITY REPORTING TABLES

#### 4.1 reports
**Purpose**: User-submitted phishing reports

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| report_id | UUID | PRIMARY KEY | Unique report identifier |
| url_id | UUID | FOREIGN KEY → suspicious_urls(url_id) | Reported URL |
| reported_by | UUID | FOREIGN KEY → users(user_id) | User who reported |
| report_reason | TEXT | NOT NULL | Why user thinks it's phishing |
| evidence_urls | JSON | NULL | Screenshots or additional links |
| incident_description | TEXT | NULL | What happened to the user |
| status | ENUM('pending', 'under_review', 'confirmed', 'rejected', 'duplicate') | DEFAULT 'pending' | Report status |
| assigned_to | UUID | FOREIGN KEY → users(user_id), NULL | Moderator assigned |
| reviewed_by | UUID | FOREIGN KEY → users(user_id), NULL | Who reviewed it |
| reviewed_at | TIMESTAMP | NULL | Review timestamp |
| review_notes | TEXT | NULL | Moderator's notes |
| reported_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission time |
| priority | ENUM('low', 'medium', 'high', 'urgent') | DEFAULT 'medium' | Priority level |

**Indexes**:
- PRIMARY KEY on report_id
- INDEX on url_id
- INDEX on reported_by, reported_at
- INDEX on status, priority

---

#### 4.2 community_feedback
**Purpose**: Votes and comments on reported URLs

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| feedback_id | UUID | PRIMARY KEY | Unique feedback entry |
| report_id | UUID | FOREIGN KEY → reports(report_id) | Associated report |
| user_id | UUID | FOREIGN KEY → users(user_id) | User providing feedback |
| feedback_type | ENUM('vote_phishing', 'vote_safe', 'comment') | NOT NULL | Type of feedback |
| comment_text | TEXT | NULL | Comment content (if applicable) |
| helpful_count | INT | DEFAULT 0 | How many found this helpful |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Feedback timestamp |

**Indexes**:
- PRIMARY KEY on feedback_id
- INDEX on report_id
- INDEX on user_id, created_at
- UNIQUE INDEX on (report_id, user_id, feedback_type) to prevent duplicate votes

---

### 5. EDUCATIONAL & STATISTICS TABLES

#### 5.1 education_content
**Purpose**: Store educational materials and tips

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| content_id | UUID | PRIMARY KEY | Unique content identifier |
| title | VARCHAR(255) | NOT NULL | Content title |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| content_type | ENUM('article', 'video', 'infographic', 'quiz', 'audio') | NOT NULL | Type of content |
| content_body | TEXT | NULL | Main content (HTML/Markdown) |
| media_url | TEXT | NULL | S3 URL for media files |
| language | VARCHAR(10) | DEFAULT 'vi' | Content language |
| difficulty_level | ENUM('beginner', 'intermediate', 'advanced') | DEFAULT 'beginner' | Difficulty |
| view_count | INT | DEFAULT 0 | Number of views |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update |
| is_published | BOOLEAN | DEFAULT FALSE | Publication status |

**Indexes**:
- PRIMARY KEY on content_id
- UNIQUE INDEX on slug
- INDEX on content_type, language

---

#### 5.2 quiz_attempts
**Purpose**: Track user quiz attempts for gamification

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| attempt_id | UUID | PRIMARY KEY | Unique attempt identifier |
| user_id | UUID | FOREIGN KEY → users(user_id) | User taking quiz |
| content_id | UUID | FOREIGN KEY → education_content(content_id) | Quiz taken |
| score | INT | NOT NULL | Points scored |
| max_score | INT | NOT NULL | Maximum possible score |
| time_taken_seconds | INT | NULL | Time to complete |
| answers | JSON | NULL | User's answers |
| completed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Completion time |

**Indexes**:
- PRIMARY KEY on attempt_id
- INDEX on user_id, completed_at
- INDEX on content_id

---

#### 5.3 system_statistics
**Purpose**: Aggregate statistics for dashboard display

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| stat_id | UUID | PRIMARY KEY | Unique statistic entry |
| stat_date | DATE | NOT NULL | Date of statistics |
| total_scans | INT | DEFAULT 0 | Total URL checks performed |
| safe_count | INT | DEFAULT 0 | URLs marked safe |
| suspicious_count | INT | DEFAULT 0 | URLs marked suspicious |
| phishing_count | INT | DEFAULT 0 | Confirmed phishing sites |
| new_reports | INT | DEFAULT 0 | New user reports |
| active_users | INT | DEFAULT 0 | Daily active users |
| extension_installs | INT | DEFAULT 0 | Total extension installations |
| avg_response_time_ms | INT | NULL | Average check response time |
| top_targeted_brands | JSON | NULL | Most impersonated brands |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |

**Indexes**:
- PRIMARY KEY on stat_id
- UNIQUE INDEX on stat_date

---

### 6. BROWSER EXTENSION TABLES

#### 6.1 extension_sessions
**Purpose**: Track browser extension usage sessions

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| session_id | UUID | PRIMARY KEY | Unique session identifier |
| user_id | UUID | FOREIGN KEY → users(user_id), NULL | User (if logged in) |
| extension_version | VARCHAR(20) | NOT NULL | Extension version |
| browser_type | VARCHAR(50) | NOT NULL | Chrome, Firefox, Edge, etc. |
| install_date | TIMESTAMP | NULL | When extension was installed |
| session_start | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session start time |
| session_end | TIMESTAMP | NULL | Session end time |
| urls_checked | INT | DEFAULT 0 | URLs checked in session |
| threats_blocked | INT | DEFAULT 0 | Threats blocked in session |

**Indexes**:
- PRIMARY KEY on session_id
- INDEX on user_id
- INDEX on session_start

---

#### 6.2 extension_alerts
**Purpose**: Log alerts shown to users by extension

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| alert_id | UUID | PRIMARY KEY | Unique alert identifier |
| session_id | UUID | FOREIGN KEY → extension_sessions(session_id) | Associated session |
| url_id | UUID | FOREIGN KEY → suspicious_urls(url_id) | URL that triggered alert |
| alert_type | ENUM('warning', 'block', 'info') | NOT NULL | Alert severity |
| user_action | ENUM('proceeded', 'blocked', 'reported', 'dismissed') | NULL | What user did |
| shown_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When alert appeared |
| dismissed_at | TIMESTAMP | NULL | When user dismissed |

**Indexes**:
- PRIMARY KEY on alert_id
- INDEX on session_id
- INDEX on url_id, alert_type

---

### 7. SYSTEM CONFIGURATION TABLES

#### 7.1 system_settings
**Purpose**: Store configurable system parameters

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| setting_id | UUID | PRIMARY KEY | Unique setting identifier |
| setting_key | VARCHAR(100) | UNIQUE, NOT NULL | Setting name (e.g., "max_scan_rate") |
| setting_value | TEXT | NOT NULL | Setting value |
| value_type | ENUM('string', 'integer', 'boolean', 'json') | NOT NULL | Data type |
| description | TEXT | NULL | What this setting does |
| updated_by | UUID | FOREIGN KEY → users(user_id) | Admin who updated |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- PRIMARY KEY on setting_id
- UNIQUE INDEX on setting_key

---

## DynamoDB Tables (for High-Throughput Operations)

### DynamoDB Table 1: RealTimeScans

**Purpose**: Handle high-frequency URL scan requests from browser extensions

**Partition Key**: url_hash (STRING)
**Sort Key**: timestamp (NUMBER - Unix timestamp)

**Attributes**:
- url_hash: SHA-256 of normalized URL
- original_url: Full URL string
- scan_result: JSON object with algorithm + API results
- user_id: Optional user identifier
- source: Extension/Web/API
- ttl: Time-to-live (auto-expire after 7 days)

**GSI (Global Secondary Index)**:
- GSI1: user_id (PK) + timestamp (SK) - Query scans by user
- GSI2: scan_result.recommendation (PK) + timestamp (SK) - Query by threat level

---

### DynamoDB Table 2: LiveDashboard

**Purpose**: Real-time statistics for dashboard without hitting PostgreSQL

**Partition Key**: metric_type (STRING) - e.g., "daily_stats", "hourly_stats"
**Sort Key**: timestamp (NUMBER)

**Attributes**:
- metric_type: Type of metric
- timestamp: When recorded
- total_scans: Count
- threats_detected: Count
- active_users: Count
- ttl: Auto-expire after 90 days

---

## Entity Relationship Summary

```
USERS (1) ─────── (M) USER_ACTIVITY_LOGS
  │
  ├──── (M) REPORTS (reported_by)
  │       │
  │       └──── (M) COMMUNITY_FEEDBACK
  │
  ├──── (M) URL_CHECKS (user_id)
  │
  └──── (M) QUIZ_ATTEMPTS

SUSPICIOUS_URLS (1) ─────── (M) URL_CHECKS
  │
  ├──── (1) KNOWN_PHISHING_URLS
  │
  └──── (M) REPORTS

URL_CHECKS (1) ─────── (M) SCAN_RESULTS
  │
  └──── (M) FEED_MATCHES

THREAT_FEEDS (1) ─────── (M) FEED_ITEMS
  │
  └──── (M) FEED_MATCHES

KNOWN_PHISHING_URLS (1) ─────── (M) SCAN_RESULTS (matched_phishing_id)

EDUCATION_CONTENT (1) ─────── (M) QUIZ_ATTEMPTS

EXTENSION_SESSIONS (1) ─────── (M) EXTENSION_ALERTS
```

---

## Data Flow Example: URL Check Process

1. **User submits URL** → Create entry in `suspicious_urls` (if new)
2. **Create check record** → Insert into `url_checks`
3. **Run algorithm** → Store detailed results in `scan_results`
4. **Check Safe Browsing** → Query/update `safebrowsing_cache`
5. **Check threat feeds** → Match against `feed_items`, record in `feed_matches`
6. **Aggregate results** → Update `url_checks.aggregated_recommendation`
7. **Log activity** → Insert into `user_activity_logs`
8. **If extension** → Record in `extension_alerts`
9. **Update stats** → Increment counters in `system_statistics`

---

## Indexing Strategy

### High-Priority Indexes (Performance Critical):
1. **suspicious_urls.url_hash** - Fast URL lookup
2. **url_checks(url_id, checked_at)** - Historical checks
3. **reports(status, priority)** - Moderator queue
4. **users(email, role)** - Authentication
5. **known_phishing_urls(domain_pattern)** - Pattern matching

### Composite Indexes:
1. **(user_id, timestamp)** on activity_logs, url_checks - User history
2. **(status, reviewed_at)** on reports - Moderation workflow
3. **(feed_id, added_at)** on feed_items - Feed updates

---

## Security Considerations

1. **Encryption at Rest**: All tables encrypted using AWS KMS
2. **Password Storage**: Bcrypt with salt rounds >= 12
3. **API Keys**: Store in `system_settings` but encrypted separately
4. **PII Protection**: Email, phone_number encrypted in users table
5. **Audit Logging**: All admin actions logged in user_activity_logs
6. **Rate Limiting**: Track in DynamoDB to prevent abuse
7. **Access Control**: IAM policies for database access

---

## Backup & Disaster Recovery

1. **PostgreSQL**: Automated daily backups to S3, 30-day retention
2. **DynamoDB**: Point-in-time recovery enabled, 35-day window
3. **Replication**: Multi-AZ deployment for high availability
4. **Archival**: Monthly exports to S3 Glacier for long-term storage

---

## Scalability Considerations

1. **Partitioning**: Partition large tables (url_checks, user_activity_logs) by date
2. **Read Replicas**: Create PostgreSQL read replicas for analytics queries
3. **Caching**: Redis/ElastiCache for frequently accessed data (user sessions, recent scans)
4. **DynamoDB Auto-Scaling**: Configure based on traffic patterns
5. **S3 for Media**: Education content, screenshots stored in S3, not database

---

## Migration Path

**Phase 1**: Start with PostgreSQL for all tables (simpler development)
**Phase 2**: Migrate high-frequency operations to DynamoDB (url_checks)
**Phase 3**: Add caching layer (Redis) for session and recent scans
**Phase 4**: Implement partitioning for historical data

This allows you to start simple and scale as needed.

---

## Sample SQL Queries

### Check if URL is in phishing database:
```sql
SELECT p.*, s.original_url 
FROM known_phishing_urls p
JOIN suspicious_urls s ON p.url_id = s.url_id
WHERE s.domain = 'suspicious-bank.com'
AND p.active = TRUE;
```

### Get user's scan history:
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

### Moderator dashboard - pending reports:
```sql
SELECT 
  r.report_id,
  r.reported_at,
  r.priority,
  su.original_url,
  u.full_name AS reporter,
  COUNT(cf.feedback_id) AS community_votes
FROM reports r
JOIN suspicious_urls su ON r.url_id = su.url_id
JOIN users u ON r.reported_by = u.user_id
LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
WHERE r.status = 'pending'
GROUP BY r.report_id
ORDER BY r.priority DESC, r.reported_at ASC;
```

### Dashboard statistics:
```sql
SELECT 
  stat_date,
  total_scans,
  phishing_count,
  (phishing_count::FLOAT / NULLIF(total_scans, 0) * 100) AS phishing_rate,
  active_users
FROM system_statistics
WHERE stat_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY stat_date DESC;
```

---

## Next Steps

1. **Generate SQL DDL scripts** for table creation
2. **Create ER diagram visualization** using draw.io or dbdiagram.io
3. **Set up AWS DynamoDB tables** with proper indexes
4. **Implement database seeding** with sample data for testing
5. **Document API endpoints** that interact with each table

Would you like me to generate the actual SQL CREATE TABLE statements or DynamoDB table definitions?
